import { SevillaImporterService } from '../service/sevillaImporterService';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    tournament: {
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    participation: {
      create: jest.fn(),
    },
    round: {
      create: jest.fn(),
    },
    game: {
      create: jest.fn(),
    },
  })),
}));

describe('SevillaImporterService', () => {
  let sevillaImporter: SevillaImporterService;

  beforeEach(() => {
    sevillaImporter = new SevillaImporterService();
  });

  describe('validateSevillaData', () => {
    it('should validate correct Sevilla data', async () => {
      const validData = {
        Name: 'Test Tournament',
        GroupReport: [
          {
            ID: 1,
            Name: 'Group 1',
            Ranking: [
              {
                RankOrder: 1,
                Round: 1,
                Name: 'Round 1',
                Date: '01-01-2024',
                Player: [
                  {
                    Pos: 1,
                    ID: 1,
                    Name: 'Test Player',
                    SortName: 'Player Test',
                    PlayerID: '123456',
                    Games: 1,
                    Wins: 1,
                    Draws: 0,
                    Losses: 0,
                    Score: 1,
                    Rating: 1500,
                    RatedGames: 1,
                    Game: [
                      {
                        Round: 1,
                        Color: 'W',
                        ActualColor: 'W',
                        Opponent: 2,
                        White: 'Test Player',
                        Black: 'Opponent Player',
                        Res: '1-0',
                        Score: 1,
                        PlainScore: 1,
                        ExpScore: 0.5,
                        Pos: 1,
                        OrgPos: 1,
                        Venue: 'Test Venue',
                        GameTime: '',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = await sevillaImporter.validateSevillaData(validData);
      expect(result).toBe(true);
    });

    it('should reject invalid Sevilla data', async () => {
      const invalidData = {
        Name: 'Test Tournament',
        // Missing GroupReport
      };

      const result = await sevillaImporter.validateSevillaData(invalidData);
      expect(result).toBe(false);
    });

    it('should reject data without main group', async () => {
      const invalidData = {
        Name: 'Test Tournament',
        GroupReport: [
          {
            ID: 2, // Not the main group (ID: 1)
            Name: 'Group 2',
            Ranking: [],
          },
        ],
      };

      const result = await sevillaImporter.validateSevillaData(invalidData);
      expect(result).toBe(false);
    });
  });

  describe('parseDate', () => {
    it('should parse DD-MM-YYYY format correctly', () => {
      const sevillaImporter = new SevillaImporterService();
      const parseDate = (sevillaImporter as any).parseDate;
      
      const result = parseDate('15-03-2024');
      expect(result).toEqual(new Date(2024, 2, 15)); // Month is 0-indexed
    });
  });
});

