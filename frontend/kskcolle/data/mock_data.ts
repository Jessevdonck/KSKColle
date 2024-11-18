export type Player = {
    id: number;
    name: string;
    elio_01_24: number;
    elio_07_24: number;
    difference: number;
    max: number;
    photoUrl?: string;
    fide_rating ?: number;
    national_rating ?: number;
  };

  export const playersData: Player[] = [
    { id: 1, name: "Björn Dyckmans", elio_01_24: 2174, elio_07_24: 2174, difference: 0, max: 2181, photoUrl: '/images/image_placeholder.png', fide_rating: 2250, national_rating: 2200 },
    { id: 2, name: "Bart Schittekat", elio_01_24: 2164, elio_07_24: 2164, difference: 0, max: 2194, fide_rating: 2240, national_rating: 2190 },
    { id: 3, name: "Eduardo Semanat Planas", elio_01_24: 2155, elio_07_24: 2155, difference: 0, max: 2155, fide_rating: 2225, national_rating: 2180 },
    { id: 4, name: "Niels Ongena", elio_01_24: 2126, elio_07_24: 2061, difference: -65, max: 2140, fide_rating: 2180, national_rating: 2100 },
    { id: 5, name: "Ronny Hanssen", elio_01_24: 2027, elio_07_24: 2027, difference: 0, max: 2028, fide_rating: 2100, national_rating: 2050 },
    { id: 6, name: "Peter Van Landeghem", elio_01_24: 1938, elio_07_24: 1962, difference: 24, max: 1962, fide_rating: 2055, national_rating: 2000 },
    { id: 7, name: "Peter Verbeeren", elio_01_24: 1928, elio_07_24: 1957, difference: 29, max: 2019, fide_rating: 2040, national_rating: 1980 },
    { id: 8, name: "Jitte Van Tilburgh", elio_01_24: 1925, elio_07_24: 1955, difference: 30, max: 1955, fide_rating: 2035, national_rating: 1975 },
    { id: 9, name: "Jasper Tondeleir", elio_01_24: 1894, elio_07_24: 1915, difference: 21, max: 1915, fide_rating: 2020, national_rating: 1950 },
    { id: 10, name: "Jan Van Der Stricht", elio_01_24: 1934, elio_07_24: 1903, difference: -31, max: 1934, fide_rating: 2010, national_rating: 1940 },
    { id: 11, name: "Janusz Dudka", elio_01_24: 1838, elio_07_24: 1903, difference: 65, max: 1933, fide_rating: 2005, national_rating: 1925 },
    { id: 12, name: "Pieter-Jan Orban", elio_01_24: 1772, elio_07_24: 1898, difference: 126, max: 1898, fide_rating: 1980, national_rating: 1900 },
    { id: 13, name: "Jelle Van Goethem", elio_01_24: 1800, elio_07_24: 1880, difference: 80, max: 1880, fide_rating: 1970, national_rating: 1890 },
    { id: 14, name: "Bert Tollenaere", elio_01_24: 1785, elio_07_24: 1871, difference: 86, max: 1871, fide_rating: 1965, national_rating: 1885 },
    { id: 15, name: "Diego Poeck", elio_01_24: 1711, elio_07_24: 1827, difference: 116, max: 1827, fide_rating: 1950, national_rating: 1850 },
    { id: 16, name: "Filip Hellemans", elio_01_24: 1710, elio_07_24: 1826, difference: 116, max: 1826, fide_rating: 1945, national_rating: 1845 },
    { id: 17, name: "Tijs Elsen", elio_01_24: 1711, elio_07_24: 1819, difference: 108, max: 1827, fide_rating: 1940, national_rating: 1840 },
    { id: 18, name: "Bart Kuenen", elio_01_24: 1698, elio_07_24: 1819, difference: 121, max: 1819, fide_rating: 1935, national_rating: 1835 },
    { id: 19, name: "Peter Verbruggen", elio_01_24: 1690, elio_07_24: 1814, difference: 124, max: 1814, fide_rating: 1930, national_rating: 1830 },
    { id: 20, name: "Vincent Heyninck", elio_01_24: 1696, elio_07_24: 1814, difference: 118, max: 1814, fide_rating: 1925, national_rating: 1825 },
    { id: 21, name: "Giovanni Beniers", elio_01_24: 1724, elio_07_24: 1803, difference: 79, max: 1926, fide_rating: 1920, national_rating: 1820 },
    { id: 22, name: "Ahmed Abdi Houssein", elio_01_24: 1668, elio_07_24: 1800, difference: 132, max: 1800, fide_rating: 1915, national_rating: 1815 },
    { id: 23, name: "Frederik De Troyer", elio_01_24: 1663, elio_07_24: 1798, difference: 135, max: 1798, fide_rating: 1910, national_rating: 1810 },
    { id: 24, name: "Stefan Van Garsse", elio_01_24: 1650, elio_07_24: 1790, difference: 140, max: 1790, fide_rating: 1905, national_rating: 1805 },
    { id: 25, name: "Wim Weyers", elio_01_24: 1602, elio_07_24: 1775, difference: 173, max: 1775, fide_rating: 1900, national_rating: 1800 },
    { id: 26, name: "Maarten Heyrman", elio_01_24: 1624, elio_07_24: 1774, difference: 150, max: 1774, fide_rating: 1895, national_rating: 1795 },
    { id: 27, name: "Jurgen Vertongen", elio_01_24: 1675, elio_07_24: 1767, difference: 92, max: 1767, fide_rating: 1890, national_rating: 1790 },
    { id: 28, name: "Raf Van Marcke", elio_01_24: 1610, elio_07_24: 1766, difference: 156, max: 1766, fide_rating: 1885, national_rating: 1785 },
    { id: 29, name: "Enver Tosuni", elio_01_24: 1594, elio_07_24: 1756, difference: 162, max: 1756, fide_rating: 1880, national_rating: 1780 },
    { id: 30, name: "Jo Tondeleir", elio_01_24: 1539, elio_07_24: 1755, difference: 216, max: 1755, fide_rating: 1875, national_rating: 1775 },
    { id: 31, name: "Eray Kadir", elio_01_24: 1564, elio_07_24: 1738, difference: 174, max: 1738, fide_rating: 1870, national_rating: 1770 },
    { id: 32, name: "Frans Van Mullem", elio_01_24: 1577, elio_07_24: 1737, difference: 160, max: 1818, fide_rating: 1865, national_rating: 1765 },
    { id: 33, name: "Johan De Blieck", elio_01_24: 1562, elio_07_24: 1737, difference: 175, max: 1737, fide_rating: 1860, national_rating: 1760 },
    { id: 34, name: "Rony Van Buggenhout", elio_01_24: 1563, elio_07_24: 1734, difference: 171, max: 1734, fide_rating: 1855, national_rating: 1755 },
    { id: 35, name: "Luc Ruymbeek", elio_01_24: 1572, elio_07_24: 1727, difference: 155, max: 1727, fide_rating: 1850, national_rating: 1750 },
    { id: 36, name: "Jesse Vaerendonck", elio_01_24: 1551, elio_07_24: 1722, difference: 171, max: 1722, fide_rating: 1845, national_rating: 1745 },
    { id: 37, name: "William Overmeire", elio_01_24: 1532, elio_07_24: 1719, difference: 187, max: 1719, fide_rating: 1840, national_rating: 1740 },
    { id: 38, name: "Sione Janssen Whiteman", elio_01_24: 1531, elio_07_24: 1719, difference: 188, max: 1719, fide_rating: 1835, national_rating: 1735 },
    { id: 39, name: "Kasper Van den Branden", elio_01_24: 1538, elio_07_24: 1714, difference: 176, max: 1714, fide_rating: 1830, national_rating: 1730 },
    { id: 40, name: "Michael Rosier", elio_01_24: 1534, elio_07_24: 1714, difference: 180, max: 1714, fide_rating: 1825, national_rating: 1725 }
];


  export type CalendarEvent = {
    id: string;
    title: string;
    date: Date;
    type: 'tournament' | 'training' | 'meeting' | 'other';
    description: string;
  };
  
  export const calendarEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Clubkampioenschap Ronde 1',
      date: new Date(2024, 0, 15),
      type: 'tournament',
      description: 'test',
    },
    {
      id: '2',
      title: 'Jeugdtraining',
      date: new Date(2024, 1, 5),
      type: 'training',
      description: 'test',
    },
    {
      id: '3',
      title: 'Bestuursvergadering',
      date: new Date(2024, 2, 10),
      type: 'meeting',
      description: 'test',
    },
    {
      id: '4',
      title: 'Paastornooi',
      date: new Date(2024, 3, 12),
      type: 'tournament',
      description: 'test',
    },
    {
      id: '5',
      title: 'Zomerkamp',
      date: new Date(2024, 10, 15),
      type: 'other',
      description: 'test',
    },
    {
      id: '5',
      title: 'Speeldag',
      date: new Date(2024, 10, 16),
      type: 'tournament',
      description: 'test',
    },
    {
      id: '6',
      title: 'Speeldag',
      date: new Date(2025, 10, 16),
      type: 'tournament',
      description: 'test',
    },
    {
      id: '6',
      title: 'Speeldag',
      date: new Date(2025, 8, 23),
      type: 'tournament',
      description: 'test',
    },
    {
      id: '6',
      title: 'Speeldag',
      date: new Date(2025, 8, 23),
      type: 'tournament',
      description: 'test',
    },
    {
      id: '6',
      title: 'Speeldag',
      date: new Date(2025, 8, 23),
      type: 'tournament',
      description: 'test',
    },
    {
      id: '7',
      title: 'Herfsttoernooi',
      date: new Date(2024, 9, 25),
      type: 'tournament',
      description: 'test',
    },
    {
      id: '8',
      title: 'Wintertraining',
      date: new Date(2024, 11, 2),
      type: 'training',
      description: 'test',
    },
    {
      id: '9',
      title: 'Jaarlijkse BBQ',
      date: new Date(2025, 5, 18),
      type: 'other',
      description: 'test',
    },
    {
      id: '10',
      title: 'Sinterklaasfeest',
      date: new Date(2024, 11, 5),
      type: 'meeting',
      description: 'test',
    },
    {
      id: '11',
      title: 'Kersttoernooi',
      date: new Date(2024, 11, 20),
      type: 'tournament',
      description: 'wekelijkse ronde',
    },
  ];
  
  export interface Round {
    id: string;
    number: number;
    games: Game[];
    date: Date;
  }
  
  export interface Tournament {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    rounds: Round[];
  }

  export const getPlayerById = (id: number): Player => {
    const player = playersData.find(player => player.id === id);
    if (!player) {
      throw new Error(`Player with ID ${id} not found`);
    }
    return player;
  };

  export interface Game {
    id: string;
    whitePlayer: Player;
    blackPlayer: Player;
    result?: '1-0' | '0-1' | '½-½';
  }

  export const games: Game[] = [
    { id: '1', whitePlayer: getPlayerById(1), blackPlayer: getPlayerById(4), result: '1-0' },
    { id: '2', whitePlayer: getPlayerById(2), blackPlayer: getPlayerById(3), result: '0-1' },
    { id: '3', whitePlayer: getPlayerById(3), blackPlayer: getPlayerById(2), result: '½-½' },
    { id: '4', whitePlayer: getPlayerById(4), blackPlayer: getPlayerById(1), result: '1-0' },
  ];
  
  export const tournaments: Tournament[] = [
    {
      id: '1',
      name: 'Zomertoernooi 2023',
      startDate: new Date(2023, 5, 1),
      endDate: new Date(2023, 7, 31),
      rounds: [
        {
          id: '1',
          number: 1,
          games: [
            {
              id: '1',
              whitePlayer: getPlayerById(1)!, 
              blackPlayer: getPlayerById(2)!, 
              result: '1-0'
            },
            {
              id: '2',
              whitePlayer: getPlayerById(3)!,
              blackPlayer: getPlayerById(4)!,
              result: '½-½'
            },
          ],
          date: new Date(2024, 5, 12),
        },
        {
          id: '4',
          number: 2,
          games: [
            {
              id: '3',
              whitePlayer: getPlayerById(1)!,
              blackPlayer: getPlayerById(2)!,
              result: '0-1'
            },
            {
              id: '4',
              whitePlayer: getPlayerById(32)!,
              blackPlayer: getPlayerById(36)!,
            },
          ],
          date: new Date(2024, 5, 19),
        },
      ]
    },
    {
      id: '2',
      name: 'Herfstcompetitie 2023-2024',
      startDate: new Date(2023, 11, 1),
      endDate: new Date(2024, 2, 31),
      rounds: [
        {
          id: '1',
          number: 1,
          games: [
            {
              id: '1',
              whitePlayer: getPlayerById(1)!,
              blackPlayer: getPlayerById(2)!,
              result: '1-0'
            },
            {
              id: '2',
              whitePlayer: getPlayerById(3)!,
              blackPlayer: getPlayerById(4)!,
              result: '½-½'
            },
            {
              id: '3',
              whitePlayer: getPlayerById(5)!,
              blackPlayer: getPlayerById(6)!,
              result: '½-½'
            },
            {
              id: '4',
              whitePlayer: getPlayerById(7)!,
              blackPlayer: getPlayerById(8)!,
              result: '½-½'
            },
            {
              id: '5',
              whitePlayer: getPlayerById(9)!,
              blackPlayer: getPlayerById(10)!,
              result: '½-½'
            },
            {
              id: '6',
              whitePlayer: getPlayerById(32)!,
              blackPlayer: getPlayerById(36)!,
              result: '½-½'
            },
            {
              id: '7',
              whitePlayer: getPlayerById(34)!,
              blackPlayer: getPlayerById(33)!,
              result: '½-½'
            },
            {
              id: '8',
              whitePlayer: getPlayerById(40)!,
              blackPlayer: getPlayerById(12)!,
              result: '½-½'
            },

          ],
          date: new Date(2024, 5, 26),
        },
      ]
    },
    {
      id: '3',
      name: 'Lentecompetitie 2023-2024',
      startDate: new Date(2023, 11, 1),
      endDate: new Date(2024, 2, 31),
      rounds: [
        {
          id: '1',
          number: 1,
          games: [
            {
              id: '1',
              whitePlayer: getPlayerById(15)!,
              blackPlayer: getPlayerById(26)!,
              result: '1-0'
            },
            {
              id: '2',
              whitePlayer: getPlayerById(5)!,
              blackPlayer: getPlayerById(38)!,
              result: '½-½'
            },
            {
              id: '3',
              whitePlayer: getPlayerById(40)!,
              blackPlayer: getPlayerById(36)!,
              result: '½-½'
            },
            {
              id: '4',
              whitePlayer: getPlayerById(12)!,
              blackPlayer: getPlayerById(13)!,
              result: '½-½'
            },
            {
              id: '5',
              whitePlayer: getPlayerById(17)!,
              blackPlayer: getPlayerById(19)!,
              result: '½-½'
            },
            {
              id: '6',
              whitePlayer: getPlayerById(10)!,
              blackPlayer: getPlayerById(25)!,
              result: '½-½'
            },
            {
              id: '7',
              whitePlayer: getPlayerById(22)!,
              blackPlayer: getPlayerById(20)!,
              result: '½-½'
            },
            {
              id: '8',
              whitePlayer: getPlayerById(8)!,
              blackPlayer: getPlayerById(9)!,
              result: '½-½'
            },

          ],
          date: new Date(2024, 5, 26),
        },
        {
          id: '2',
          number: 2,
          games: [
            {
              id: '1',
              whitePlayer: getPlayerById(12)!,
              blackPlayer: getPlayerById(33)!,
              result: '1-0'
            },
            {
              id: '2',
              whitePlayer: getPlayerById(4)!,
              blackPlayer: getPlayerById(28)!,
              result: '½-½'
            },
            {
              id: '3',
              whitePlayer: getPlayerById(15)!,
              blackPlayer: getPlayerById(19)!,
              result: '0-1'
            },
            {
              id: '4',
              whitePlayer: getPlayerById(6)!,
              blackPlayer: getPlayerById(31)!,
              result: '½-½'
            },
            {
              id: '5',
              whitePlayer: getPlayerById(11)!,
              blackPlayer: getPlayerById(17)!,
              result: '1-0'
            },
            {
              id: '6',
              whitePlayer: getPlayerById(25)!,
              blackPlayer: getPlayerById(34)!,
              result: '0-1'
            },
            {
              id: '7',
              whitePlayer: getPlayerById(9)!,
              blackPlayer: getPlayerById(7)!,
              result: '½-½'
            },
            {
              id: '8',
              whitePlayer: getPlayerById(1)!,
              blackPlayer: getPlayerById(40)!,
              result: '1-0'
            }
          ],
          date: new Date(2024, 6, 2),
        },
      ]
    },
    
  ];

  export interface GameWithRoundAndTournament extends Game {
    round: Round & { tournament?: Tournament };
  }

