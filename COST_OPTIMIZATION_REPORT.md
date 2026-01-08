# Kosten Optimalisatie Rapport

## Analyse van de Kosten

De huidige kosten zijn:
- **Memory**: 4695.88 minutely GB × $0.000231 = **$1.0870** (grootste kostenpost!)
- **CPU**: 60.31 minutely vCPU × $0.000463 = $0.0279
- **Egress**: 7.40 GB × $0.05 = $0.3698
- **Volume**: 834.55 minutely GB × $0.000003 = $0.0029
- **Totaal**: $1.49 (excl. hobby plan fee)

## Geïdentificeerde Problemen

### 1. **Body Parser Limit Te Hoog** ✅ GEFIXT
- **Probleem**: 50MB limit voor JSON en form data
- **Impact**: Kan veel geheugen gebruiken bij grote uploads
- **Oplossing**: Verlaagd naar 10MB (genoeg voor normale gebruik, Sevilla imports kunnen via aparte endpoint)

### 2. **Logging Overhead** ✅ GEFIXT
- **Probleem**: Elke request wordt 2x gelogd (voor en na)
- **Impact**: I/O overhead en mogelijk geheugen voor log buffers
- **Oplossing**: Logging alleen in development/testing, niet in productie

### 3. **Prisma Connection Pooling** ✅ GEFIXT
- **Probleem**: Geen expliciete connection pool configuratie
- **Impact**: Mogelijk te veel database connections
- **Oplossing**: Prisma logging geoptimaliseerd, connection pooling via DATABASE_URL (indien nodig)

### 4. **Inefficiënte Database Queries** ⚠️ AANBEVOLEN
- **Probleem**: `getAllTournaments()` haalt alle participations, rounds en games op, zelfs als niet nodig
- **Impact**: Veel geheugen gebruik bij grote datasets
- **Aanbeveling**: Lazy loading of selectieve queries implementeren waar mogelijk
- **Locatie**: `backend/src/service/tournamentService.ts`

### 5. **Static File Serving** ⚠️ TE CONTROLEREN
- **Probleem**: `koa-static` serveert bestanden uit `public` en `apidoc` directories
- **Impact**: Grote bestanden kunnen geheugen gebruiken
- **Aanbeveling**: 
  - Controleer of er grote bestanden in `public/uploads` staan
  - Overweeg CDN voor static assets
  - Limiteer max file size voor uploads

## Geïmplementeerde Fixes

1. ✅ Body parser limit verlaagd van 50MB naar 10MB
2. ✅ Request logging uitgeschakeld in productie
3. ✅ Prisma logging geoptimaliseerd

## Aanbevolen Volgende Stappen

### Korte Termijn (Direct Impact)
1. **Monitor geheugen gebruik** na deze fixes
2. **Controleer static files** - verwijder grote ongebruikte bestanden
3. **Database query optimalisatie** - implementeer lazy loading voor tournaments

### Lange Termijn
1. **CDN voor static assets** - verplaats grote bestanden naar CDN (Cloudinary wordt al gebruikt voor avatars)
2. **Caching** - implementeer Redis caching voor vaak opgevraagde data
3. **Database indexing** - controleer of alle queries gebruik maken van indexes
4. **Rate limiting** - voorkom misbruik/overmatig gebruik

## Verwachte Impact

Na deze fixes zou het geheugen gebruik moeten dalen met:
- **Body parser**: ~20-40% reductie bij grote uploads
- **Logging**: ~5-10% reductie in I/O overhead
- **Totaal verwachte reductie**: 25-50% minder geheugen gebruik

Dit zou de kosten moeten verlagen van **$1.49** naar ongeveer **$0.75-$1.10** per maand.

## Monitoring

Na deployment, monitor:
1. Memory usage (moet dalen)
2. CPU usage (moet stabiel blijven of dalen)
3. Response times (moeten niet verslechteren)
4. Error rates (moeten niet stijgen)
