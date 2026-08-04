# Kosten Optimalisatie Rapport

## Uitgangssituatie (augustus 2026)

| Post | Verbruik | Kost |
|---|---|---|
| **Memory** | 108.296,91 minutely GB | **$25,07** |
| CPU | 282,62 minutely vCPU | $0,13 |
| Egress | 4,07 GB | $0,20 |
| Volume | 8.733,91 minutely GB | $0,03 |
| **Totaal** | | **$25,43** |

**Geheugen is 98,6% van de rekening.** CPU, egress en volume zijn verwaarloosbaar
en hoeven niet geoptimaliseerd te worden. 108.296,91 GB-minuten over een maand
komt neer op een gemiddelde van ~2,5 GB, met een piek van 3,31 GB — en de
RAM-grafiek klom gestaag, wat wijst op geheugen dat nooit werd vrijgegeven.

## Hoofdoorzaak: Node kreeg geen heap-limiet

Node bepaalt zijn maximale heap op basis van het RAM van de *host*, niet van de
container. Gemeten op een machine met 16 GB:

```
zonder vlag                  : 4288 MB heap-limiet
met --max-old-space-size=320 :  512 MB heap-limiet
```

V8 ruimt pas agressief op als het die limiet nadert. Met een plafond van ruim
4 GB laat de garbage collector het geheugen dus rustig oplopen tot in de
gigabytes voor hij serieus opruimt — exact het klimmende patroon in de grafiek.

De frontend (`next start`) draaide volledig zonder limiet. De backend stond al
op 512 MB.

## Doorgevoerde wijzigingen

### 1. Heap-limiet op de frontend ⭐ grootste winst
- **Frontend**: `next start` draait nu via `node --max-old-space-size=512`
  (`frontend/kskcolle/package.json`). Plafond van 4288 MB → 512 MB, oftewel
  ruim acht keer lager. Dit is de eigenlijke besparing.
- **Backend**: blijft op 512 MB. Die stond al gecapt en was nooit het probleem;
  bovendien heeft de Sevilla-import ruimte nodig.
- Beide services hebben een `railway.json` met een expliciet startcommando,
  zodat het niet afhangt van dashboard-configuratie.

> **Let op — valkuil bij `NODE_OPTIONS`.** In de eerste versie stond
> `NODE_OPTIONS='--max-old-space-size=320'` in het startcommando van de backend.
> Die variabele erft door naar álle child-processen, dus ook naar de
> `tsc`-build die via het `prestart`-script draait. Die build heeft meer dan
> 320 MB nodig en crashte met "JavaScript heap out of memory", waardoor de
> deploy faalde vóór de healthcheck.
> Daarom staat de limiet voor de backend alleen als CLI-vlag op het
> serverproces zelf (`node --max-old-space-size=512 …`) en niet als
> `NODE_OPTIONS`. Bij de frontend kan het wel via `NODE_OPTIONS`, want daar
> draait geen build tijdens het opstarten.

### 2. `googleapis` vervangen door `@googleapis/drive`
Het `googleapis`-pakket (**120,8 MB**) werd bij het opstarten volledig
ingeladen, terwijl er alleen Google Drive-bestandslijsten mee opgehaald worden.
Vervangen door `@googleapis/drive` (**2,3 MB**), dat bovendien pas geladen wordt
bij het eerste fotoverzoek in plaats van bij het opstarten.
Het ongebruikte duplicaat `googleDriveService.ts` is verwijderd.

### 3. Ongebruikte dependencies verwijderd
- **Backend** (13 pakketten): `bcryptjs`, `cors`, `@radix-ui/react-radio-group`,
  `zod`, `dayjs`, `edmonds-blossom`, `munkres-algorithm`, `munkres-js`,
  `roundrobin`, `round-robin-tournament`, `swiss-pairing`,
  `tournament-organizer`, `tournament-pairings`.
- **Frontend** (7 pakketten): `npm` (!), `i`, `koa`, `react-router-dom`,
  `next-navigation`, `lucide` (duplicaat van `lucide-react`), `html2canvas`.

`jspdf` is bewust behouden: het wordt via een dynamische import gebruikt in de
PDF-export van de admin.

### 4. Geheugenlek in de cache gedicht
`shortLivedCache` verwijderde verlopen entries alleen wanneer diezelfde sleutel
opnieuw werd opgevraagd. Een toernooidetail is ~270 KB, dus wat eenmalig werd
opgehaald bleef hangen. Er draait nu elke minuut een opruimronde
(`backend/src/core/shortLivedCache.ts`), netjes gestopt bij shutdown.

## Verificatie

- Backend bouwt en start; `/api/health/ping` en `/api/users/publicUsers`
  (124 spelers) werken. RSS bij opstarten: 107 MB.
- Frontend bouwt volledig (inclusief type-check) en serveert pagina's met de
  nieuwe startopdracht: HTTP 200 op `/spelers`.

## Verwachte impact

De frontend kon voorheen ongestoord tot boven de gigabyte groeien en is nu
gebonden aan 512 MB heap. Samen met het lichtere backend-proces (geen
`googleapis` meer bij het opstarten) verwacht ik het gemiddelde
geheugengebruik flink te zien dalen ten opzichte van de ~2,5 GB van voorheen.
Hoeveel precies hangt af van het aandeel van de database, dat ongewijzigd
blijft.

## Wat overblijft: de database

De MySQL-service is niet aangepast en is waarschijnlijk de grootste
resterende geheugenpost. Klik in Railway op **"View Cost by Service"** om te
zien hoe de $25 verdeeld is over database, backend en frontend. Als de database
er flink uitspringt, zijn dat de vervolgstappen:

1. **Next.js `output: 'standalone'`** — kleinere runtime-footprint voor de
   frontend. Vraagt een aangepast startcommando en het meekopiëren van
   `.next/static` en `public`; bewust nog niet gedaan omdat het niet zonder
   deploy te testen valt.
2. **Frontend statisch hosten** — vrijwel de hele app is client-side
   (`"use client"` + SWR). Een statische export op bijvoorbeeld Cloudflare Pages
   is gratis en zou een volledige Railway-service uitsparen. Wel moet dan
   `next/image`-optimalisatie uitgeschakeld worden.
3. **Databasegebruik nakijken** — of het gekozen plan/instance past bij een club
   met 697 leden en 1.819 partijen; dat is een kleine dataset.
