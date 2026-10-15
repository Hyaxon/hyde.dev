import { applyMove, type GameState, type Mark } from "./engine";

export type Difficulty = "easy" | "medium" | "hard";

function getAvailableMoves(state: GameState): number[] | null {
  const availableMoves = state.board
    .map((cell, index) => (cell === null ? index : null))
    .filter((index): index is number => index !== null);

  if (availableMoves.length === 0) {
    return null;
  }
  return availableMoves;
}

function minimax(cpuMark: Mark, state: GameState, depth: number): number {
  if (state.outcome !== "playing") {
    if (state.outcome === cpuMark) {
      return 10 - depth;
    } else if (state.outcome == "draw") {
      return 0;
    }
    return depth - 10;
  }

  const availableMoves = getAvailableMoves(state);

  if (availableMoves === null) {
    return 0;
  }

  const scores = Array<number>(availableMoves.length).fill(0);

  for (const [index, move] of availableMoves.entries()) {
    const nextState = applyMove(state, move);
    scores[index] = minimax(cpuMark, nextState, depth + 1);
  }
  if (state.turn === cpuMark) {
    return Math.max(...scores);
  }
  return Math.min(...scores);
}

export function chooseMove(
  state: GameState,
  difficulty: Difficulty,
): number | null {
  if (state.outcome !== "playing") return null;

  const availableMoves = getAvailableMoves(state);
  if (availableMoves === null) {
    return null;
  }

  if (difficulty === "easy") {
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randomIndex];
  }

  if (difficulty === "medium") {
    // 1. Take a winning move
    for (const move of availableMoves) {
      const nextState = applyMove(state, move);

      if (nextState.outcome === state.turn) {
        return move;
      }
    }

    // 2. Block opponent's winning move
    const opponentMark: Mark = state.turn === "X" ? "O" : "X";

    for (const move of availableMoves) {
      const opponentState: GameState = {
        ...state,
        turn: opponentMark,
      };

      const nextState = applyMove(opponentState, move);

      if (nextState.outcome === opponentMark) {
        return move;
      }
    }

    // 3. Otherwise use weighted selection
    const weightedMoves: number[] = [];

    for (const move of availableMoves) {
      let weight = 1;

      if (move === 4) {
        weight = 5;
      } else if ([0, 2, 6, 8].includes(move)) {
        weight = 3;
      }

      for (let i = 0; i < weight; i++) {
        weightedMoves.push(move);
      }
    }

    const randomIndex = Math.floor(Math.random() * weightedMoves.length);
    return weightedMoves[randomIndex];
  }

  if (difficulty === "hard") {
    const scores = Array<number>(availableMoves.length).fill(0);

    for (const [index, move] of availableMoves.entries()) {
      const nextState = applyMove(state, move);
      scores[index] = minimax(state.turn, nextState, 0);
    }

    const bestScore = Math.max(...scores);

    const bestMoves = availableMoves.filter(
      (_, index) => scores[index] === bestScore,
    );

    if (bestMoves.includes(4)) {
      return 4;
    }

    return bestMoves[0];
  }
  // TODO: Choose a square for state.turn; return null if no move is available.
  // Only select a move here. The controller applies it through the engine.
  // Keep DOM updates and any artificial thinking delay out of this module.
  throw new Error("TODO: implement chooseMove");
}
