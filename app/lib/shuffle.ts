/** Plain Fisher-Yates shuffle — true randomness for anything that should vary every play (Arcade rounds). Daily Quests uses a separate *seeded* shuffle on purpose, since it needs the same result all day; don't merge the two. */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** `count` random items from `pool` without replacement — the source array is left untouched. */
export function pickRandomUnique<T>(pool: T[], count: number): T[] {
  const remaining = [...pool];
  const picked: T[] = [];
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const index = Math.floor(Math.random() * remaining.length);
    picked.push(remaining.splice(index, 1)[0]);
  }
  return picked;
}
