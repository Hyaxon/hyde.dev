import {
  applyMove,
  createInitialState,
  type GameState,
  type Mark,
} from "../games/tic-tac-toe/engine";
import { chooseMove, type Difficulty } from "../games/tic-tac-toe/cpu";

interface Session {
  state: GameState;
  difficulty: Difficulty;
  humanMark: Mark;
  thinking: boolean;
  scores: Record<Difficulty, { wins: number; losses: number }>;
}

export function initTicTacToe(root: HTMLElement): () => void {
  // Each widget owns its own session and event listeners.
  const session: Session = {
    state: createInitialState(),
    difficulty:
      root.dataset.difficulty === "medium" || root.dataset.difficulty === "hard"
        ? root.dataset.difficulty
        : "easy",
    humanMark: root.dataset.humanMark === "O" ? "O" : "X",
    thinking: false,
    scores: {
      easy: { wins: 0, losses: 0 },
      medium: { wins: 0, losses: 0 },
      hard: { wins: 0, losses: 0 },
    },
  };
  const events = new AbortController();
  let cpuTimer: number | undefined;

  const squares = root.querySelectorAll<HTMLButtonElement>("[data-square]");
  const difficultyButtons = root.querySelectorAll<HTMLButtonElement>(
    "[data-difficulty-option]",
  );

  function commitMove(square: number): void {
    const previousOutcome = session.state.outcome;
    session.state = applyMove(session.state, square);

    // Count a result once, when a move finishes a round. Draws and restarts
    // leave the running totals unchanged.
    if (previousOutcome === "playing") {
      const outcome = session.state.outcome;
      const score = session.scores[session.difficulty];
      if (outcome === session.humanMark) {
        score.wins++;
      } else if (outcome === "X" || outcome === "O") {
        score.losses++;
      }
    }

    render();
  }

  function handleSquarePress(square: number): void {
    if (
      session.thinking ||
      (session.state.outcome === "playing" &&
        session.state.turn !== session.humanMark)
    )
      return;
    console.log("[TicTacToe] Square pressed:", square);
    commitMove(square);
    scheduleCpuTurn();
  }

  function cancelCpuTurn(): void {
    window.clearTimeout(cpuTimer);
    cpuTimer = undefined;
    session.thinking = false;
  }

  function scheduleCpuTurn(): void {
    if (
      events.signal.aborted ||
      session.thinking ||
      session.state.outcome !== "playing" ||
      session.state.turn === session.humanMark
    ) {
      return;
    }

    session.thinking = true;
    render();

    const delay = 250 + Math.floor(Math.random() * 501);
    cpuTimer = window.setTimeout(() => {
      cpuTimer = undefined;
      try {
        const move = chooseMove(session.state, session.difficulty);
        if (move !== null) commitMove(move);
      } finally {
        session.thinking = false;
        render();
      }
    }, delay);
  }

  function handleDifficultyPress(difficulty: Difficulty): void {
    console.log("[TicTacToe] Difficulty pressed:", difficulty);
    if (session.difficulty === difficulty) return;

    cancelCpuTurn();
    session.state = createInitialState();
    session.difficulty = difficulty;
    session.thinking = false;
    render();
    scheduleCpuTurn();
  }

  function render(): void {
    const { state, humanMark, thinking } = session;
    const score = session.scores[session.difficulty];
    const finished = state.outcome !== "playing";
    const cpuTurn = state.turn !== humanMark;

    squares.forEach((button) => {
      const square = Number(button.dataset.square);
      const mark = state.board[square];
      const symbol = button.querySelector("span");

      if (symbol) symbol.textContent = mark ?? "";

      const position = `Row ${Math.floor(square / 3) + 1}, column ${(square % 3) + 1}`;
      button.setAttribute(
        "aria-label",
        `${position}: ${mark ?? "empty"}${finished ? ". Play again" : ""}`,
      );
      // Finished boards stay clickable so the next click can restart the round.
      button.disabled = !finished && (thinking || cpuTurn || mark != null);
    });

    difficultyButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.difficultyOption === session.difficulty),
      );
    });

    let status: string;
    if (finished) {
      const result =
        state.outcome === "draw"
          ? "Draw!"
          : state.outcome === humanMark
            ? "You won!"
            : "CPU won!";
      status = `${result} Click the board to play again.`;
    } else if (thinking) {
      status = "CPU is thinking…";
    } else {
      status = cpuTurn ? "CPU's Turn" : "Your Turn";
    }

    const textUpdates: [string, string][] = [
      ["[data-status]", status],
      ["[data-wins]", String(score.wins)],
      ["[data-losses]", String(score.losses)],
      ["[data-human-mark-label]", humanMark],
    ];

    textUpdates.forEach(([selector, text]) => {
      const element = root.querySelector<HTMLElement>(selector);
      // Avoid repeating an unchanged live-region announcement.
      if (element && element.textContent !== text) element.textContent = text;
    });

    root.dataset.difficulty = session.difficulty;
    root.dataset.humanMark = humanMark;
  }

  squares.forEach((button) => {
    button.addEventListener(
      "click",
      () => handleSquarePress(Number(button.dataset.square)),
      {
        signal: events.signal,
      },
    );
  });

  difficultyButtons.forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const difficulty = button.dataset.difficultyOption;
        if (
          difficulty === "easy" ||
          difficulty === "medium" ||
          difficulty === "hard"
        ) {
          handleDifficultyPress(difficulty);
        }
      },
      { signal: events.signal },
    );
  });

  render();
  scheduleCpuTurn();

  return () => {
    events.abort();
    cancelCpuTurn();
  };
}
