// Pure game rules: no DOM, timers, or knowledge of human/CPU players.
export type Mark = "X" | "O";
export type Cell = Mark | null;
export type Outcome = "playing" | "draw" | Mark;

export interface GameState {
  board: Cell[];
  turn: Mark;
  outcome: Outcome;
}

export function createInitialState(): GameState {
  return {
    board: Array<Cell>(9).fill(null),
    turn: "X",
    outcome: "playing",
  };
}

export function applyMove(state: GameState, square: number): GameState {
  if (!Number.isInteger(square)) {
    return state;
  }
  if (square < 0 || square > 8) {
    return state;
  }

  const nextState: GameState = {
    ...state,
    board: [...state.board],
  };

  if (state.outcome != "playing") {
    return createInitialState();
  }

  if (state.board[square] != null) {
    return state;
  }

  nextState.board[square] = state.turn;
  nextState.outcome = getOutcome(nextState.board);

  if (nextState.outcome === "playing") {
    nextState.turn = state.turn === "X" ? "O" : "X";
  }

  return nextState;
}

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function getWinningSquares(board: readonly Cell[]): number[] {
  const lines = winningLines.filter(
    ([a, b, c]) =>
      board[a] != null && board[a] === board[b] && board[a] === board[c],
  );
  return [...new Set(lines.flat())];
}

export function getOutcome(board: readonly Cell[]): Outcome {
  const [winningSquare] = getWinningSquares(board);
  const winner = winningSquare === undefined ? null : board[winningSquare];
  if (winner != null) return winner;

  return board.every((cell) => cell !== null) ? "draw" : "playing";
}
