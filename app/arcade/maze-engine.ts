// Scripture Maze generation — pure, framework-free. A fresh maze is
// generated every attempt (recursive backtracker), so no two plays
// look the same, per the "avoid repetitive static screens" brief.

import { shuffle } from '../lib/shuffle';
import type { DifficultyLevel } from './types';

export type Cell = { row: number; col: number; walls: { N: boolean; E: boolean; S: boolean; W: boolean } };
export type MazeLayout = {
  size: number;
  cells: Cell[][];
  start: { row: number; col: number };
  exit: { row: number; col: number };
  checkpoints: { row: number; col: number }[];
  fragments: { row: number; col: number }[];
};

export const MAZE_SIZE: Record<DifficultyLevel, number> = { easy: 7, medium: 9, hard: 11, expert: 13 };
export const CHECKPOINT_COUNT: Record<DifficultyLevel, number> = { easy: 2, medium: 3, hard: 3, expert: 4 };
export const FRAGMENT_COUNT: Record<DifficultyLevel, number> = { easy: 3, medium: 4, hard: 5, expert: 6 };

function generateGrid(size: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({ row, col, walls: { N: true, E: true, S: true, W: true } }))
  );
  const visited = Array.from({ length: size }, () => new Array(size).fill(false));
  const stack: { row: number; col: number }[] = [{ row: 0, col: 0 }];
  visited[0][0] = true;

  const dirs: { key: 'N' | 'E' | 'S' | 'W'; opposite: 'N' | 'E' | 'S' | 'W'; dr: number; dc: number }[] = [
    { key: 'N', opposite: 'S', dr: -1, dc: 0 },
    { key: 'E', opposite: 'W', dr: 0, dc: 1 },
    { key: 'S', opposite: 'N', dr: 1, dc: 0 },
    { key: 'W', opposite: 'E', dr: 0, dc: -1 },
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const candidates = shuffle(dirs).filter(({ dr, dc }) => {
      const nr = current.row + dr;
      const nc = current.col + dc;
      return nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc];
    });
    if (candidates.length === 0) {
      stack.pop();
      continue;
    }
    const dir = candidates[0];
    const next = { row: current.row + dir.dr, col: current.col + dir.dc };
    grid[current.row][current.col].walls[dir.key] = false;
    grid[next.row][next.col].walls[dir.opposite] = false;
    visited[next.row][next.col] = true;
    stack.push(next);
  }
  return grid;
}

export function generateMaze(difficulty: DifficultyLevel): MazeLayout {
  const size = MAZE_SIZE[difficulty];
  const cells = generateGrid(size);
  const start = { row: 0, col: 0 };
  const exit = { row: size - 1, col: size - 1 };

  const allOtherCells = cells.flat().filter((c) => !(c.row === start.row && c.col === start.col) && !(c.row === exit.row && c.col === exit.col));
  const shuffled = shuffle(allOtherCells);

  const checkpointCount = CHECKPOINT_COUNT[difficulty];
  const fragmentCount = FRAGMENT_COUNT[difficulty];
  const checkpoints = shuffled.slice(0, checkpointCount).map((c) => ({ row: c.row, col: c.col }));
  const fragments = shuffled.slice(checkpointCount, checkpointCount + fragmentCount).map((c) => ({ row: c.row, col: c.col }));

  return { size, cells, start, exit, checkpoints, fragments };
}

export function canMove(cells: Cell[][], from: { row: number; col: number }, direction: 'N' | 'E' | 'S' | 'W'): boolean {
  return !cells[from.row][from.col].walls[direction];
}

export const DIRECTION_DELTA: Record<'N' | 'E' | 'S' | 'W', { dr: number; dc: number }> = {
  N: { dr: -1, dc: 0 },
  E: { dr: 0, dc: 1 },
  S: { dr: 1, dc: 0 },
  W: { dr: 0, dc: -1 },
};

// ── CHECKPOINT QUESTION BANK ──────────────────────────────────────
export type MazeQuestion = { prompt: string; options: string[]; correct: number };

export const MAZE_QUESTIONS: Record<DifficultyLevel, MazeQuestion[]> = {
  easy: [
    { prompt: 'Who built a big boat to survive the flood?', options: ['Noah', 'Moses', 'David'], correct: 0 },
    { prompt: 'Who was thrown into a den of lions?', options: ['Daniel', 'Samuel', 'Jonah'], correct: 0 },
    { prompt: 'What did David use to defeat Goliath?', options: ['A sword', 'A sling', 'A spear'], correct: 1 },
    { prompt: 'Who led the Israelites out of Egypt?', options: ['Moses', 'Joshua', 'Aaron'], correct: 0 },
  ],
  medium: [
    { prompt: 'Which city’s walls fell after the Israelites marched around it?', options: ['Jericho', 'Bethlehem', 'Nazareth'], correct: 0 },
    { prompt: 'Who interpreted Pharaoh’s dreams in Egypt?', options: ['Joseph', 'Jacob', 'Judah'], correct: 0 },
    { prompt: 'What did Jesus multiply to feed 5,000 people?', options: ['Bread and fish', 'Water and wine', 'Grain and oil'], correct: 0 },
    { prompt: 'Who was swallowed by a great fish?', options: ['Jonah', 'Elijah', 'Job'], correct: 0 },
  ],
  hard: [
    { prompt: 'What does the word "gospel" mean?', options: ['Good news', 'Holy book', 'Ancient law'], correct: 0 },
    { prompt: 'Who was the first king of Israel?', options: ['Saul', 'David', 'Solomon'], correct: 0 },
    { prompt: 'Which apostle denied knowing Jesus three times?', options: ['Peter', 'John', 'Andrew'], correct: 0 },
    { prompt: 'Where was Paul headed when he was blinded by a great light?', options: ['Damascus', 'Rome', 'Corinth'], correct: 0 },
  ],
  expert: [
    { prompt: 'What is the meaning of "propitiation" in Romans 3:25?', options: ['Satisfying God’s just wrath', 'A moral example', 'A symbolic ritual'], correct: 0 },
    { prompt: 'Who wrote the majority of the New Testament letters?', options: ['Paul', 'Peter', 'John'], correct: 0 },
    { prompt: 'What covenant sign did God give Noah?', options: ['The rainbow', 'Circumcision', 'The Sabbath'], correct: 0 },
    { prompt: 'What does "sanctification" mean?', options: ['The ongoing process of being made holy', 'The moment of first belief', 'Final resurrection'], correct: 0 },
  ],
};

export function pickQuestions(difficulty: DifficultyLevel, count: number): MazeQuestion[] {
  return shuffle(MAZE_QUESTIONS[difficulty]).slice(0, count);
}
