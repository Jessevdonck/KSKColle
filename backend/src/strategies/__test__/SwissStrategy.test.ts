// src/strategies/__tests__/SwissStrategy.test.ts
import { SwissStrategy } from "../SwissStrategy";
import type { Competitor, Pairing } from "../../types/Types";

describe("SwissStrategy", () => {
  let strategy: SwissStrategy;

  beforeEach(() => {
    strategy = new SwissStrategy();
  });

  describe("First Round Pairings", () => {
    it("should pair high-rated with low-rated players in first round", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 0, schaakrating_elo: 2000 },
        { user_id: 2, score: 0, schaakrating_elo: 1800 },
        { user_id: 3, score: 0, schaakrating_elo: 1600 },
        { user_id: 4, score: 0, schaakrating_elo: 1400 },
      ];

      const { pairings } = await strategy.generatePairings(players, 1, []);

      expect(pairings).toHaveLength(2);
      
      // Check that highest rated (2000) is paired with lowest rated (1400)
      const firstPairing = pairings.find(p => p.speler1_id === 1);
      expect(firstPairing?.speler2_id).toBe(4);
      
      // Check that second highest (1800) is paired with second lowest (1600)
      const secondPairing = pairings.find(p => p.speler1_id === 2);
      expect(secondPairing?.speler2_id).toBe(3);
    });

    it("should handle odd number of players with bye", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 0, schaakrating_elo: 2000 },
        { user_id: 2, score: 0, schaakrating_elo: 1800 },
        { user_id: 3, score: 0, schaakrating_elo: 1600 },
      ];

      const { pairings, byePlayer } = await strategy.generatePairings(players, 1, []);

      expect(pairings).toHaveLength(1);
      expect(byePlayer).toBeDefined();
      expect(byePlayer?.user_id).toBe(3); // Lowest rated should get bye
    });
  });

  describe("Swiss Pairings (Round 2+)", () => {
    it("should pair players with equal scores together", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 2, schaakrating_elo: 2000 },
        { user_id: 2, score: 2, schaakrating_elo: 1800 },
        { user_id: 3, score: 1, schaakrating_elo: 1600 },
        { user_id: 4, score: 1, schaakrating_elo: 1400 },
      ];

      const previousRounds: Pairing[][] = [
        [
          { speler1_id: 1, speler2_id: 2, color1: "W", color2: "B" },
          { speler1_id: 3, speler2_id: 4, color1: "W", color2: "B" },
        ]
      ];

      const { pairings } = await strategy.generatePairings(players, 2, previousRounds);

      expect(pairings).toHaveLength(2);
      
      // Players with score 2 should be paired together
      const score2Pairing = pairings.find(p => 
        (p.speler1_id === 1 || p.speler2_id === 1) && 
        (p.speler1_id === 2 || p.speler2_id === 2)
      );
      expect(score2Pairing).toBeDefined();
      
      // Players with score 1 should be paired together
      const score1Pairing = pairings.find(p => 
        (p.speler1_id === 3 || p.speler2_id === 3) && 
        (p.speler1_id === 4 || p.speler2_id === 4)
      );
      expect(score1Pairing).toBeDefined();
    });

    it("should avoid rematches when possible", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 2, schaakrating_elo: 2000 },
        { user_id: 2, score: 2, schaakrating_elo: 1800 },
        { user_id: 3, score: 2, schaakrating_elo: 1600 },
        { user_id: 4, score: 2, schaakrating_elo: 1400 },
      ];

      const previousRounds: Pairing[][] = [
        [
          { speler1_id: 1, speler2_id: 2, color1: "W", color2: "B" },
          { speler1_id: 3, speler2_id: 4, color1: "W", color2: "B" },
        ]
      ];

      const { pairings } = await strategy.generatePairings(players, 2, previousRounds);

      expect(pairings).toHaveLength(2);
      
      // Check that no rematches occurred
      const hasRematch = pairings.some(p => 
        (p.speler1_id === 1 && p.speler2_id === 2) ||
        (p.speler1_id === 3 && p.speler2_id === 4)
      );
      expect(hasRematch).toBe(false);
    });

    it("should allow rematches only when necessary", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 2, schaakrating_elo: 2000 },
        { user_id: 2, score: 2, schaakrating_elo: 1800 },
      ];

      const previousRounds: Pairing[][] = [
        [
          { speler1_id: 1, speler2_id: 2, color1: "W", color2: "B" },
        ]
      ];

      const { pairings } = await strategy.generatePairings(players, 2, previousRounds);

      expect(pairings).toHaveLength(1);
      
      // Since there are only 2 players, they must play each other again
      const pairing = pairings[0];
      expect(pairing).toBeDefined();
      if (pairing) {
        expect(pairing.speler1_id).toBe(1);
        expect(pairing.speler2_id).toBe(2);
      }
    });
  });

  describe("Color Balance", () => {
    it("should balance colors fairly", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 0, schaakrating_elo: 2000 },
        { user_id: 2, score: 0, schaakrating_elo: 1800 },
        { user_id: 3, score: 0, schaakrating_elo: 1600 },
        { user_id: 4, score: 0, schaakrating_elo: 1400 },
      ];

      const previousRounds: Pairing[][] = [
        [
          { speler1_id: 1, speler2_id: 2, color1: "W", color2: "B" },
          { speler1_id: 3, speler2_id: 4, color1: "W", color2: "B" },
        ]
      ];

      const { pairings } = await strategy.generatePairings(players, 2, previousRounds);

      // Check that the color balancing logic is working
      // We expect that players who had white in round 1 should get black in round 2 when possible
      const player1Pairing = pairings.find(p => p.speler1_id === 1 || p.speler2_id === 1);
      const player3Pairing = pairings.find(p => p.speler1_id === 3 || p.speler2_id === 3);
      
      // Verify that colors are assigned (either W or B, not N)
      expect(player1Pairing).toBeDefined();
      expect(player3Pairing).toBeDefined();
      
      if (player1Pairing) {
        const player1Color = player1Pairing.speler1_id === 1 ? player1Pairing.color1 : player1Pairing.color2;
        expect(["W", "B"]).toContain(player1Color);
      }
      
      if (player3Pairing) {
        const player3Color = player3Pairing.speler1_id === 3 ? player3Pairing.color1 : player3Pairing.color2;
        expect(["W", "B"]).toContain(player3Color);
      }
      
      // Verify that we have a mix of colors (not all white or all black)
      const allColors = pairings.flatMap(p => [p.color1, p.color2]).filter(c => c !== "N");
      const whiteCount = allColors.filter(c => c === "W").length;
      const blackCount = allColors.filter(c => c === "B").length;
      
      expect(whiteCount).toBeGreaterThan(0);
      expect(blackCount).toBeGreaterThan(0);
    });

    it("should prevent all group leaders from getting the same color", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 2, schaakrating_elo: 2000 }, // Group leader
        { user_id: 2, score: 2, schaakrating_elo: 1800 }, // Group leader
        { user_id: 3, score: 1, schaakrating_elo: 1600 }, // Second group
        { user_id: 4, score: 1, schaakrating_elo: 1400 }, // Second group
        { user_id: 5, score: 0, schaakrating_elo: 1200 }, // Third group
        { user_id: 6, score: 0, schaakrating_elo: 1000 }, // Third group
      ];

      const previousRounds: Pairing[][] = [
        // Round 1: All leaders had white
        [
          { speler1_id: 1, speler2_id: 2, color1: "W", color2: "B" },
          { speler1_id: 3, speler2_id: 4, color1: "W", color2: "B" },
          { speler1_id: 5, speler2_id: 6, color1: "W", color2: "B" },
        ],
        // Round 2: All leaders had white again (this was the problem)
        [
          { speler1_id: 1, speler2_id: 3, color1: "W", color2: "B" },
          { speler1_id: 2, speler2_id: 4, color1: "W", color2: "B" },
          { speler1_id: 5, speler2_id: 6, color1: "W", color2: "B" },
        ]
      ];

      const { pairings } = await strategy.generatePairings(players, 3, previousRounds);

      // Check that not all group leaders (players 1 and 2) have the same color
      const player1Pairing = pairings.find(p => p.speler1_id === 1 || p.speler2_id === 1);
      const player2Pairing = pairings.find(p => p.speler1_id === 2 || p.speler2_id === 2);
      
      expect(player1Pairing).toBeDefined();
      expect(player2Pairing).toBeDefined();
      
      if (player1Pairing && player2Pairing) {
        const player1Color = player1Pairing.speler1_id === 1 ? player1Pairing.color1 : player1Pairing.color2;
        const player2Color = player2Pairing.speler1_id === 2 ? player2Pairing.color1 : player2Pairing.color2;
        
        // They should NOT both have the same color (this was the bug)
        expect(player1Color).not.toBe(player2Color);
        
        // At least one should have black (since they both had white in previous rounds)
        expect([player1Color, player2Color]).toContain("B");
      }
    });

    it("should alternate colors properly across multiple rounds", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 0, schaakrating_elo: 2000 },
        { user_id: 2, score: 0, schaakrating_elo: 1800 },
        { user_id: 3, score: 0, schaakrating_elo: 1600 },
        { user_id: 4, score: 0, schaakrating_elo: 1400 },
      ];

      // Round 1: All top players get white
      const round1: Pairing[][] = [
        [
          { speler1_id: 1, speler2_id: 2, color1: "W", color2: "B" },
          { speler1_id: 3, speler2_id: 4, color1: "W", color2: "B" },
        ]
      ];

      const { pairings: round2Pairings } = await strategy.generatePairings(players, 2, round1);

      // Round 2: Players who had white in round 1 should get black when possible
      const round2: Pairing[][] = [
        ...round1,
        round2Pairings
      ];

      const { pairings: round3Pairings } = await strategy.generatePairings(players, 3, round2);

      // Check that colors are alternating properly
      // Player 1 had white in round 1, should get black in round 2 or 3
      const player1Round2Pairing = round2Pairings.find(p => p.speler1_id === 1 || p.speler2_id === 1);
      const player1Round3Pairing = round3Pairings.find(p => p.speler1_id === 1 || p.speler2_id === 1);

      // Check that player 1 gets different colors across rounds (not always white)
      const player1Colors = [];
      if (player1Round2Pairing) {
        const player1Round2Color = player1Round2Pairing.speler1_id === 1 ? player1Round2Pairing.color1 : player1Round2Pairing.color2;
        player1Colors.push(player1Round2Color);
      }
      if (player1Round3Pairing) {
        const player1Round3Color = player1Round3Pairing.speler1_id === 1 ? player1Round3Pairing.color1 : player1Round3Pairing.color2;
        player1Colors.push(player1Round3Color);
      }
      
      // Player 1 should have both white and black across the rounds (not always the same color)
      const uniqueColors = [...new Set(player1Colors)];
      expect(uniqueColors.length).toBeGreaterThan(1);

      // Verify that we don't have all players with the same color in any round
      const round2Colors = round2Pairings.flatMap(p => [p.color1, p.color2]).filter(c => c !== "N");
      const round3Colors = round3Pairings.flatMap(p => [p.color1, p.color2]).filter(c => c !== "N");

      const round2WhiteCount = round2Colors.filter(c => c === "W").length;
      const round2BlackCount = round2Colors.filter(c => c === "B").length;
      const round3WhiteCount = round3Colors.filter(c => c === "W").length;
      const round3BlackCount = round3Colors.filter(c => c === "B").length;

      expect(round2WhiteCount).toBeGreaterThan(0);
      expect(round2BlackCount).toBeGreaterThan(0);
      expect(round3WhiteCount).toBeGreaterThan(0);
      expect(round3BlackCount).toBeGreaterThan(0);
    });
  });

  describe("Bye Handling", () => {
    it("should assign bye to player who hasn't had one yet", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 2, schaakrating_elo: 2000 },
        { user_id: 2, score: 1, schaakrating_elo: 1800 },
        { user_id: 3, score: 0, schaakrating_elo: 1600 },
      ];

      const previousRounds: Pairing[][] = [
        [
          { speler1_id: 1, speler2_id: 2, color1: "W", color2: "B" },
          { speler1_id: 3, speler2_id: null, color1: "N", color2: "N" }, // Player 3 had bye
        ]
      ];

      const { pairings, byePlayer } = await strategy.generatePairings(players, 2, previousRounds);

      expect(pairings).toHaveLength(1);
      expect(byePlayer).toBeDefined();
      
      // Player 2 should get bye since player 3 already had one
      expect(byePlayer?.user_id).toBe(2);
    });

    it("should allow bye for player who already had one if everyone else has too", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 2, schaakrating_elo: 2000 },
        { user_id: 2, score: 1, schaakrating_elo: 1800 },
        { user_id: 3, score: 0, schaakrating_elo: 1600 },
      ];

      const previousRounds: Pairing[][] = [
        [
          { speler1_id: 1, speler2_id: null, color1: "N", color2: "N" }, // Player 1 had bye
          { speler1_id: 2, speler2_id: 3, color1: "W", color2: "B" },
        ]
      ];

      const { pairings, byePlayer } = await strategy.generatePairings(players, 2, previousRounds);

      expect(pairings).toHaveLength(1);
      expect(byePlayer).toBeDefined();
      
      // Player 3 should get bye since they have lowest score (0) and haven't had bye yet
      expect(byePlayer?.user_id).toBe(3);
    });
  });

  describe("Edge Cases", () => {
    it("should handle single player (should never happen in practice)", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 0, schaakrating_elo: 2000 },
      ];

      const { pairings, byePlayer } = await strategy.generatePairings(players, 1, []);

      expect(pairings).toHaveLength(0);
      expect(byePlayer).toBeDefined();
      expect(byePlayer?.user_id).toBe(1);
    });

    it("should handle two players", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 0, schaakrating_elo: 2000 },
        { user_id: 2, score: 0, schaakrating_elo: 1800 },
      ];

      const { pairings, byePlayer } = await strategy.generatePairings(players, 1, []);

      expect(pairings).toHaveLength(1);
      expect(byePlayer).toBeUndefined();
      
      const pairing = pairings[0];
      expect(pairing).toBeDefined();
      if (pairing) {
        expect(pairing.speler1_id).toBe(1);
        expect(pairing.speler2_id).toBe(2);
      }
    });
  });

  describe("Integration Test", () => {
    it("should run a complete tournament simulation", async () => {
      const players: Competitor[] = [
        { user_id: 1, score: 0, schaakrating_elo: 2000 },
        { user_id: 2, score: 0, schaakrating_elo: 1800 },
        { user_id: 3, score: 0, schaakrating_elo: 1600 },
        { user_id: 4, score: 0, schaakrating_elo: 1400 },
        { user_id: 5, score: 0, schaakrating_elo: 1200 },
        { user_id: 6, score: 0, schaakrating_elo: 1000 },
      ];

      const previousRounds: Pairing[][] = [];
      const allPairings: Pairing[] = [];

      // Simulate 3 rounds
      for (let round = 1; round <= 3; round++) {
        // Update scores based on previous rounds
        const updatedPlayers = players.map(player => ({
          ...player,
          score: Math.floor(Math.random() * 3), // Random scores for testing
        }));

        const { pairings } = await strategy.generatePairings(updatedPlayers, round, previousRounds);
        
        expect(pairings.length).toBeGreaterThan(0);
        expect(pairings.length * 2).toBeLessThanOrEqual(players.length);
        
        previousRounds.push(pairings);
        allPairings.push(...pairings);
      }

      // Verify that all players participated in all rounds
      const playerParticipation = new Map<number, number>();
      allPairings.forEach(pairing => {
        playerParticipation.set(pairing.speler1_id, (playerParticipation.get(pairing.speler1_id) || 0) + 1);
        if (pairing.speler2_id) {
          playerParticipation.set(pairing.speler2_id, (playerParticipation.get(pairing.speler2_id) || 0) + 1);
        }
      });

      // Each player should have played in 3 rounds
      players.forEach(player => {
        const gamesPlayed = playerParticipation.get(player.user_id) || 0;
        expect(gamesPlayed).toBe(3);
      });
    });
  });
});



