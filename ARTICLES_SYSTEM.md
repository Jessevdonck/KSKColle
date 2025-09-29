# Artikel Systeem - KSK Colle

## Overzicht

Het artikel systeem stelt bestuursleden en admins in staat om artikels te maken, beheren en publiceren op de website. Artikels kunnen worden gebruikt voor nieuws, toernooiverslagen, en algemene mededelingen.

## Functionaliteiten

### Voor Bestuursleden en Admins:
- **Artikel aanmaken**: Maak nieuwe artikels aan met titel, inhoud, samenvatting
- **Artikel bewerken**: Bewerk bestaande artikels (alleen eigen artikels voor bestuursleden)
- **Artikel verwijderen**: Verwijder artikels (alleen eigen artikels voor bestuursleden)
- **Publicatie controle**: Artikels kunnen als concept worden opgeslagen of direct gepubliceerd
- **Uitgelichte artikels**: Markeer belangrijke artikels als "uitgelicht" voor prominente weergave
- **Artikel types**: Kies uit Nieuws, Toernooiverslag, of Algemeen

### Voor Bezoekers:
- **Homepage**: Meest recente gepubliceerde artikels worden getoond op de homepage
- **Artikel overzicht**: Alle gepubliceerde artikels bekijken op `/articles`
- **Artikel lezen**: Volledige artikels lezen met auteur en publicatiedatum
- **Zoeken en filteren**: Zoek door artikels en filter op type

## Database Schema

### Article Tabel
```sql
CREATE TABLE Article (
    article_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500),
    type ArticleType NOT NULL DEFAULT 'NEWS',
    author_id INT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at DATETIME,
    
    FOREIGN KEY (author_id) REFERENCES User(user_id) ON DELETE CASCADE
);
```

### ArticleType Enum
```sql
CREATE TYPE ArticleType AS ENUM ('NEWS', 'TOURNAMENT_REPORT', 'GENERAL');
```

## API Endpoints

### Publieke Endpoints
- `GET /api/articles` - Lijst van artikels met paginatie en filters
- `GET /api/articles/recent` - Meest recente gepubliceerde artikels
- `GET /api/articles/:id` - Specifiek artikel ophalen

### Beveiligde Endpoints (Admin/Bestuurslid)
- `POST /api/articles` - Nieuw artikel aanmaken
- `PUT /api/articles/:id` - Artikel bijwerken
- `DELETE /api/articles/:id` - Artikel verwijderen

## Frontend Pagina's

### `/articles`
- Overzichtspagina met alle artikels
- Zoek- en filterfunctionaliteit
- Paginatie voor grote aantallen artikels

### `/articles/create`
- Formulier voor het aanmaken van nieuwe artikels
- Alleen toegankelijk voor admins en bestuursleden

### `/articles/[id]`
- Detailpagina van een specifiek artikel
- Toont volledige inhoud, auteur, en publicatiedatum

### `/articles/[id]/edit`
- Bewerkingspagina voor bestaande artikels
- Alleen toegankelijk voor admins en eigenaars van het artikel

## Toegangscontrole

### Admin Gebruikers:
- Kunnen alle artikels beheren
- Kunnen alle artikels bewerken en verwijderen
- Hebben volledige toegang tot alle functionaliteiten

### Bestuurslid Gebruikers:
- Kunnen eigen artikels bewerken en verwijderen
- Kunnen nieuwe artikels aanmaken
- Kunnen artikels van anderen bekijken maar niet bewerken

### Gewone Gebruikers:
- Kunnen alleen gepubliceerde artikels bekijken
- Geen toegang tot beheerfunctionaliteiten

## Homepage Integratie

De homepage toont automatisch de 3 meest recente gepubliceerde artikels:
- Uitgelichte artikels krijgen voorrang
- Artikels worden gesorteerd op publicatiedatum
- Alleen gepubliceerde artikels worden getoond
- Link naar volledig artikel overzicht

## Installatie

1. **Database Migratie**:
   ```bash
   # Voer de migratie uit
   mysql -u username -p database_name < backend/src/data/migrations/000021_add_articles_table.sql
   ```

2. **Seed Data** (optioneel):
   ```bash
   # Voeg voorbeeldartikels toe
   cd backend
   npm run seed
   ```

3. **Frontend Build**:
   ```bash
   cd frontend/kskcolle
   npm run build
   ```

## Gebruik

### Artikel Aanmaken:
1. Log in als admin of bestuurslid
2. Ga naar Profiel dropdown → "Artikels beheren"
3. Klik op "Nieuw artikel"
4. Vul titel, inhoud en instellingen in
5. Klik "Artikel opslaan"

### Artikel Publiceren:
- Schakel "Gepubliceerd" aan om het artikel zichtbaar te maken
- Schakel "Uitgelicht" aan om het prominent te tonen op de homepage
- Artikels kunnen later nog worden aangepast

### Artikel Beheren:
- Ga naar `/articles` om alle artikels te bekijken
- Gebruik zoek- en filteropties om artikels te vinden
- Klik op "Bewerken" om een artikel aan te passen
- Klik op "Verwijderen" om een artikel te verwijderen

## Styling

Het artikel systeem gebruikt de bestaande design system van de website:
- Consistent met de rest van de interface
- Responsive design voor alle apparaten
- Gebruikt dezelfde kleuren en componenten
- Integreert naadloos met de bestaande styling

## Toekomstige Uitbreidingen

Mogelijke toekomstige verbeteringen:
- Rich text editor voor artikel inhoud
- Afbeeldingen uploaden voor artikels
- Artikel categorieën en tags
- Commentaar systeem voor artikels
- SEO optimalisaties
- Artikel templates voor verschillende types
- Bulk bewerkingen
- Artikel statistieken en analytics
