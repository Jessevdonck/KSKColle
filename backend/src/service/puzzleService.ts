import { prisma } from "./data";
import handleDBError from "./handleDBError";
import ServiceError from "../core/serviceError";

export interface CreatePuzzleInput {
  name: string;
  start_position: string; // FEN notation
  active_color: "white" | "black";
  solution: Array<{ from: string; to: string }>; // Array of moves
}

export interface Puzzle {
  puzzle_id: number;
  name: string;
  start_position: string;
  active_color: string;
  solution: Array<{ from: string; to: string }>;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new puzzle
 */
export const createPuzzle = async (
  userId: number,
  data: CreatePuzzleInput
): Promise<Puzzle> => {
  try {
    const puzzle = await prisma.puzzle.create({
      data: {
        name: data.name,
        start_position: data.start_position,
        active_color: data.active_color,
        solution: data.solution as any, // Store as JSON
        created_by: userId,
      },
    });

    return {
      ...puzzle,
      solution: puzzle.solution as Array<{ from: string; to: string }>,
    };
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get all puzzles
 */
export const getAllPuzzles = async (): Promise<Puzzle[]> => {
  try {
    const puzzles = await prisma.puzzle.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    return puzzles.map((puzzle) => ({
      ...puzzle,
      solution: puzzle.solution as Array<{ from: string; to: string }>,
    }));
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get puzzle by ID
 */
export const getPuzzleById = async (puzzleId: number): Promise<Puzzle> => {
  try {
    const puzzle = await prisma.puzzle.findUnique({
      where: { puzzle_id: puzzleId },
    });

    if (!puzzle) {
      throw ServiceError.notFound("Puzzle not found");
    }

    return {
      ...puzzle,
      solution: puzzle.solution as Array<{ from: string; to: string }>,
    };
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Update puzzle
 */
export const updatePuzzle = async (
  puzzleId: number,
  userId: number,
  data: Partial<CreatePuzzleInput>
): Promise<Puzzle> => {
  try {
    // Check if puzzle exists and user is the creator
    const puzzle = await prisma.puzzle.findUnique({
      where: { puzzle_id: puzzleId },
    });

    if (!puzzle) {
      throw ServiceError.notFound("Puzzle not found");
    }

    if (puzzle.created_by !== userId) {
      throw ServiceError.forbidden("You can only edit your own puzzles");
    }

    const updated = await prisma.puzzle.update({
      where: { puzzle_id: puzzleId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.start_position && { start_position: data.start_position }),
        ...(data.active_color && { active_color: data.active_color }),
        ...(data.solution && { solution: data.solution as any }),
      },
    });

    return {
      ...updated,
      solution: updated.solution as Array<{ from: string; to: string }>,
    };
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Delete puzzle
 */
export const deletePuzzle = async (
  puzzleId: number,
  userId: number
): Promise<void> => {
  try {
    // Check if puzzle exists and user is the creator or admin
    const puzzle = await prisma.puzzle.findUnique({
      where: { puzzle_id: puzzleId },
      include: {
        creator: {
          select: {
            is_admin: true,
            roles: true,
          },
        },
      },
    });

    if (!puzzle) {
      throw ServiceError.notFound("Puzzle not found");
    }

    // Parse roles to check if user is admin
    const creatorRoles =
      typeof puzzle.creator.roles === "string"
        ? JSON.parse(puzzle.creator.roles)
        : puzzle.creator.roles;

    const isAdmin = puzzle.creator.is_admin || creatorRoles.includes("admin");

    if (puzzle.created_by !== userId && !isAdmin) {
      throw ServiceError.forbidden(
        "You can only delete your own puzzles or be an admin"
      );
    }

    await prisma.puzzle.delete({
      where: { puzzle_id: puzzleId },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export interface PuzzleAttempt {
  attempt_id: number;
  puzzle_id: number;
  user_id: number;
  solve_time_ms: number;
  completed_at: Date;
  user?: {
    user_id: number;
    voornaam: string;
    achternaam: string;
    avatar_url: string | null;
  };
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  voornaam: string;
  achternaam: string;
  avatar_url: string | null;
  solve_time_ms: number;
  completed_at: Date;
}

/**
 * Save a puzzle attempt (when user solves the puzzle)
 */
export const savePuzzleAttempt = async (
  userId: number,
  puzzleId: number,
  solveTimeMs: number
): Promise<PuzzleAttempt> => {
  try {
    // Check if user already has an attempt for this puzzle
    const existingAttempt = await prisma.puzzleAttempt.findUnique({
      where: {
        puzzle_id_user_id: {
          puzzle_id: puzzleId,
          user_id: userId,
        },
      },
    });

    // Only save if this is a better time (faster) or if no attempt exists
    if (existingAttempt) {
      if (solveTimeMs < existingAttempt.solve_time_ms) {
        // Update with better time
        const updated = await prisma.puzzleAttempt.update({
          where: {
            attempt_id: existingAttempt.attempt_id,
          },
          data: {
            solve_time_ms: solveTimeMs,
            completed_at: new Date(),
          },
          include: {
            user: {
              select: {
                user_id: true,
                voornaam: true,
                achternaam: true,
                avatar_url: true,
              },
            },
          },
        });

        return {
          attempt_id: updated.attempt_id,
          puzzle_id: updated.puzzle_id,
          user_id: updated.user_id,
          solve_time_ms: updated.solve_time_ms,
          completed_at: updated.completed_at,
          user: updated.user,
        };
      } else {
        // Return existing attempt (not updating because new time is slower)
        return {
          attempt_id: existingAttempt.attempt_id,
          puzzle_id: existingAttempt.puzzle_id,
          user_id: existingAttempt.user_id,
          solve_time_ms: existingAttempt.solve_time_ms,
          completed_at: existingAttempt.completed_at,
        };
      }
    } else {
      // Create new attempt
      const attempt = await prisma.puzzleAttempt.create({
        data: {
          puzzle_id: puzzleId,
          user_id: userId,
          solve_time_ms: solveTimeMs,
        },
        include: {
          user: {
            select: {
              user_id: true,
              voornaam: true,
              achternaam: true,
              avatar_url: true,
            },
          },
        },
      });

      return {
        attempt_id: attempt.attempt_id,
        puzzle_id: attempt.puzzle_id,
        user_id: attempt.user_id,
        solve_time_ms: attempt.solve_time_ms,
        completed_at: attempt.completed_at,
        user: attempt.user,
      };
    }
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get leaderboard for a puzzle (sorted by solve time, fastest first)
 */
export const getPuzzleLeaderboard = async (
  puzzleId: number,
  limit: number = 50
): Promise<LeaderboardEntry[]> => {
  try {
    const attempts = await prisma.puzzleAttempt.findMany({
      where: {
        puzzle_id: puzzleId,
      },
      include: {
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            avatar_url: true,
          },
        },
      },
      orderBy: {
        solve_time_ms: "asc", // Fastest first
      },
      take: limit,
    });

    return attempts.map((attempt, index) => ({
      rank: index + 1,
      user_id: attempt.user_id,
      voornaam: attempt.user.voornaam,
      achternaam: attempt.user.achternaam,
      avatar_url: attempt.user.avatar_url,
      solve_time_ms: attempt.solve_time_ms,
      completed_at: attempt.completed_at,
    }));
  } catch (error) {
    throw handleDBError(error);
  }
};

/**
 * Get user's attempt for a puzzle (if exists)
 */
export const getUserPuzzleAttempt = async (
  userId: number,
  puzzleId: number
): Promise<PuzzleAttempt | null> => {
  try {
    const attempt = await prisma.puzzleAttempt.findUnique({
      where: {
        puzzle_id_user_id: {
          puzzle_id: puzzleId,
          user_id: userId,
        },
      },
      include: {
        user: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!attempt) {
      return null;
    }

    return {
      attempt_id: attempt.attempt_id,
      puzzle_id: attempt.puzzle_id,
      user_id: attempt.user_id,
      solve_time_ms: attempt.solve_time_ms,
      completed_at: attempt.completed_at,
      user: attempt.user,
    };
  } catch (error) {
    throw handleDBError(error);
  }
};

