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

export function getOutcome(board: readonly Cell[]): Outcome {
  for (let i = 0; i <= 6; i += 3) {
    const mark = board[i];

    if (mark != null && mark == board[i + 1] && mark === board[i + 2]) {
      return mark;
    }
  }

  for (let i = 0; i <= 2; i++) {
    const mark = board[i];

    if (mark != null && mark == board[i + 3] && mark === board[i + 6]) {
      return mark;
    }
  }

  if (
    (board[0] != null && board[0] == board[4] && board[0] == board[8]) ||
    (board[2] != null && board[2] == board[4] && board[2] == board[6])
  ) {
    return board[4];
  }

  return board.every((cell) => cell !== null) ? "draw" : "playing";
}
