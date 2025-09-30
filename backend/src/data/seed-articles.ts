import { PrismaClient, ArticleType } from '@prisma/client'

const prisma = new PrismaClient()

export const seedArticles = async () => {
  try {
    // Get admin user for seeding articles
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { is_admin: true },
          { roles: { path: '$', string_contains: 'admin' } }
        ]
      }
    })

    if (!adminUser) {
      console.log('No admin user found, skipping article seeding')
      return
    }

    console.log('Seeding articles...')

    // Sample articles
    const articles = [
      {
        title: "Welkom bij KSK Colle!",
        content: "Welkom bij onze schaakclub! We zijn verheugd om je te verwelkomen op onze nieuwe website. Hier kun je alle informatie vinden over onze club, toernooien, en activiteiten.\n\nOnze club organiseert regelmatig toernooien en trainingen voor spelers van alle niveaus. Of je nu een beginnende speler bent of een ervaren schaker, er is altijd een plek voor je bij KSK Colle.\n\nWe kijken ernaar uit om je te zien bij onze volgende bijeenkomst!",
        excerpt: "Welkom op onze nieuwe website! Ontdek alles over onze schaakclub en activiteiten.",
        type: ArticleType.NEWS,
        author_id: adminUser.user_id,
        published: true,
        featured: true,
        published_at: new Date(),
      },
      {
        title: "Herfstkampioenschap 2024 - Verslag",
        content: "Het Herfstkampioenschap 2024 is succesvol afgerond! We hebben een geweldig toernooi gehad met veel spannende partijen.\n\nIn de eerste klasse werd Jan Janssens kampioen met een indrukwekkende score van 7.5/8. Op de tweede plaats eindigde Marie Verstraeten met 6.5 punten.\n\nDe tweede klasse werd gewonnen door Peter De Vries, die met 8/8 een perfecte score behaalde.\n\nWe willen alle deelnemers bedanken voor hun deelname en kijken al uit naar het volgende toernooi!",
        excerpt: "Een verslag van het succesvol afgeronde Herfstkampioenschap 2024 met alle uitslagen en hoogtepunten.",
        type: ArticleType.TOURNAMENT_REPORT,
        author_id: adminUser.user_id,
        published: true,
        featured: true,
        published_at: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        title: "Nieuwe trainingstijden vanaf januari 2025",
        content: "Beste leden,\n\nVanaf januari 2025 gaan we over op nieuwe trainingstijden. De wijzigingen zijn als volgt:\n\n- Maandag: 19:30 - 21:30 (volwassenen)\n- Woensdag: 18:00 - 20:00 (jeugd)\n- Vrijdag: 19:00 - 21:00 (volwassenen)\n\nDeze nieuwe tijden zorgen voor een betere verdeling van de trainingen en meer ruimte voor alle leden.\n\nGraag zien we je op de nieuwe tijden!",
        excerpt: "Vanaf januari 2025 gaan we over op nieuwe trainingstijden. Bekijk hier de wijzigingen.",
        type: ArticleType.GENERAL,
        author_id: adminUser.user_id,
        published: true,
        featured: false,
        published_at: new Date(Date.now() - 172800000), // 2 days ago
      }
    ]

    for (const article of articles) {
      // Check if article already exists by title
      const existingArticle = await prisma.article.findFirst({
        where: {
          title: article.title,
        }
      })

      if (!existingArticle) {
        await prisma.article.create({
          data: article,
        })
      }
    }

    console.log(`Seeded ${articles.length} articles`)
  } catch (error) {
    console.error('Error seeding articles:', error)
  }
}

// Run if called directly
if (require.main === module) {
  seedArticles()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
