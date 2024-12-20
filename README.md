# Examenopdracht Front-end Web Development & Web Services

> Schrap hierboven eventueel wat niet past

- Student: Jesse Vaerendonck
- Studentennummer: 202399060
- E-mailadres: <mailto:jesse.vaerendonck@student.hogent.be>

## Vereisten

Ik verwacht dat volgende software reeds geïnstalleerd is:

- [NodeJS](https://nodejs.org)
- [NPM](https://www.npmjs.com/)
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

> Vul eventueel aan

## Front-end

## Setup
### 1. Installeer de dependencies:
```npm install```

### 2. Maak een bestand genaamd .env met de volgende inhoud en pas dit toe op je configuratie:
```NEXT_PUBLIC_API_URL=http://localhost:9000/api```

## Opstarten

### Development
 - Zorg dat het .env bestand aanwezig en correct ingevuld is
 - Start de app met volgend commando ```npm run dev```
### Production
- Zorg dat het .env bestand aanwezig en correct ingevuld is
- Build de applicatie met ```npm run build```. Dit maakt een .next folder aan met de gecompileerde bestanden.
- Host deze map met een dynamische service.



## Testen

### 1. Run de testen met volgend commando:
 ```npm run test```

## Back-end

## Setup
### Instellen van .env-bestand:
```
NODE_ENV=development 
DATABASE_URL=<"mysql://<USER>:<PASSWORD>@localhost:3306/<DATABASE_NAME>" >
AUTH_JWT_SECRET=<YOUR-JWT-SECRET>
```

## Opstarten

### Development

#### 1. Installeer de dependencies:
```npm install```

#### 2. Voer de databank migraties uit:
```npx prisma migrate dev```

#### 3. Start de applicatie met volgend commando
```npm run start:dev```

### Production
#### 1. Instellen .env bestand (zie hierboven)

#### 2. Installeer de dependencies:
```npm install```

#### 3. Voer de databank migraties uit:
```npx prisma migrate deploy```

#### 4. Build je project:
```npm run build```

#### 5. Start de applicatie op:
```node build/src/index.js```


## Testen
#### 1. Installeer de dependencies:
```npm install```
#### 2. Zorg dat de .env.test bestaat (zie hierboven)
#### 3. Voer de databank migraties uit:
```npm run migrate:test```
#### 4. Voer de testen uit:
```npm test```
#### 5. Voer de testen uit met coverage: ```npm run test:coverage```
##### Dit genereert een coverage rapport in de __tests__/coverage folder
##### ```Open __tests__/coverage/lcov-report/index.html``` in je browser om het rapport te bekijken.



