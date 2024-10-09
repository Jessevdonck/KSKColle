import type {Toernooi, Ronde, Paring, Spellen, Deelnames, Speler} from "./types";

export const TOERNOOIEN: Toernooi[] = [
  {
    tournament_id: "t1",
    naam: "Herfsttoernooi 2024",
    rondes: 5,
  },
  {
    tournament_id: "t2",
    naam: "Lentetoernooi 2024",
    rondes: 3,
  },
];

export const RONDES: Ronde[] = [
  {
    round_id: "r1",
    tournament_id: "t1",
    ronde_nummer: 1,
  },
  {
    round_id: "r2",
    tournament_id: "t1",
    ronde_nummer: 2,
  }
  ,
  {
    round_id: "r3",
    tournament_id: "t1",
    ronde_nummer: 3,
  }
  ,
  {
    round_id: "r4",
    tournament_id: "t1",
    ronde_nummer: 4,
  }
  ,
  {
    round_id: "r5",
    tournament_id: "t1",
    ronde_nummer: 5,
  },
];

export const PARINGEN: Paring[] = [
  {
    pairing_id: "p1",
    round_id: "r1",
    player1_id: "sp1",
    player2_id: "sp2",
  },
  {
    pairing_id: "p2",
    round_id: "r1",
    player1_id: "sp3",
    player2_id: "sp4",
  },
  {
    pairing_id: "p3",
    round_id: "r2",
    player1_id: "sp1",
    player2_id: "sp3",
  },
  {
    pairing_id: "p4",
    round_id: "r2",
    player1_id: "sp2",
    player2_id: "sp4",
  },
];

export const SPELLEN: Spellen[] = [
  {
    game_id: "g1",
    pairing_id: "p1",
    tournament_id: "t1",
    winner_id: "sp1",
    date: "2023-10-01",
    result: "1-0",
  },
  {
    game_id: "g2",
    pairing_id: "p2",
    tournament_id: "t1",
    winner_id: "sp4",
    date: "2023-10-01",
    result: "0-1",
  },
  {
    game_id: "g3",
    pairing_id: "p3",
    tournament_id: "t1",
    winner_id: "sp1",
    date: "2023-10-01",
    result: "1-0",
  },
  {
    game_id: "g4",
    pairing_id: "p4",
    tournament_id: "t1",
    winner_id: "sp4",
    date: "2023-10-01",
    result: "0-1",
  },
];

export const DEELNAMES: Deelnames[] = [
  {
    user_id: "sp1",
    tournament_id: "t1",
  },
  {
    user_id: "sp2",
    tournament_id: "t1",
  },
  {
    user_id: "sp3",
    tournament_id: "t1",
  },
  {
    user_id: "sp4",
    tournament_id: "t1",
  },
];

export const SPELERS: Speler[] = [
  { user_id: 1, name: "Björn Dyckmans", elio_01_24: 2174, elio_07_24: 2174, difference: 0, max: 2181 },
  { user_id: 2, name: "Bart Schittekat", elio_01_24: 2164, elio_07_24: 2164, difference: 0, max: 2194 },
  { user_id: 3, name: "Eduardo Semanat Planas", elio_01_24: 2155, elio_07_24: 2155, difference: 0, max: 2155 },
  { user_id: 4, name: "Niels Ongena", elio_01_24: 2126, elio_07_24: 2061, difference: -65, max: 2140 },
  { user_id: 5, name: "Ronny Hanssen", elio_01_24: 2027, elio_07_24: 2027, difference: 0, max: 2028 },
  { user_id: 6, name: "Peter Van Landeghem", elio_01_24: 1938, elio_07_24: 1962, difference: 24, max: 1962 },
  { user_id: 7, name: "Peter Verbeeren", elio_01_24: 1928, elio_07_24: 1957, difference: 29, max: 2019 },
  { user_id: 8, name: "Jitte Van Tilburgh", elio_01_24: 1925, elio_07_24: 1955, difference: 30, max: 1955 },
  { user_id: 9, name: "Jasper Tondeleir", elio_01_24: 1894, elio_07_24: 1915, difference: 21, max: 1915 },
  { user_id: 10, name: "Jan Van Der Stricht", elio_01_24: 1934, elio_07_24: 1903, difference: -31, max: 1934 },
  { user_id: 11, name: "Janusz Dudka", elio_01_24: 1838, elio_07_24: 1903, difference: 65, max: 1933 },
  { user_id: 12, name: "Pieter-Jan Orban", elio_01_24: 1772, elio_07_24: 1898, difference: 126, max: 1898 },
  { user_id: 13, name: "Jelle Van Goethem", elio_01_24: 1800, elio_07_24: 1880, difference: 80, max: 1880 },
  { user_id: 14, name: "Bert Tollenaere", elio_01_24: 1785, elio_07_24: 1871, difference: 86, max: 1871 },
  { user_id: 15, name: "Diego Poeck", elio_01_24: 1711, elio_07_24: 1827, difference: 116, max: 1827 },
  { user_id: 16, name: "Filip Hellemans", elio_01_24: 1710, elio_07_24: 1826, difference: 116, max: 1826 },
  { user_id: 17, name: "Tijs Elsen", elio_01_24: 1711, elio_07_24: 1819, difference: 108, max: 1827 },
  { user_id: 18, name: "Bart Kuenen", elio_01_24: 1698, elio_07_24: 1819, difference: 121, max: 1819 },
  { user_id: 19, name: "Peter Verbruggen", elio_01_24: 1690, elio_07_24: 1814, difference: 124, max: 1814 },
  { user_id: 20, name: "Vincent Heyninck", elio_01_24: 1696, elio_07_24: 1814, difference: 118, max: 1814 },
];

/*----------------------------------------TYPES----------------------------------------*/

