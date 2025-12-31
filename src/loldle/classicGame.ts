import championData from "../../data/lol/championData.json" with { type: "json" };

interface RawChampionData {
  championId: string;
  championName: string;
  species?: string[];
  regions?: string[];
  positions?: string[];
  resource?: string;
  release_date?: string;
  range_type?: string[];
  gender?: string;
}

export interface ClassicChampion {
  id: string;
  name: string;
  gender: string;
  positions: string[];
  species: string[];
  resource: string;
  rangeType: string[];
  regions: string[];
  releaseYear: number;
}

export type MatchStatus = "match" | "partial" | "mismatch";
export type YearStatus = "match" | "higher" | "lower";

export interface ClassicEvaluation {
  guess: ClassicChampion;
  target: ClassicChampion;
  isCorrect: boolean;
  gender: MatchStatus;
  positions: MatchStatus;
  species: MatchStatus;
  resource: MatchStatus;
  rangeType: MatchStatus;
  regions: MatchStatus;
  releaseYear: YearStatus;
}

const rawChampions = championData as RawChampionData[];

const champions: ClassicChampion[] = rawChampions
  .map((champion) => ({
    id: champion.championId,
    name: champion.championName,
    gender: champion.gender ?? "Unknown",
    positions: [...(champion.positions ?? [])],
    species: [...(champion.species ?? [])],
    resource: champion.resource ?? "Unknown",
    rangeType: [...(champion.range_type ?? [])],
    regions: [...(champion.regions ?? [])],
    releaseYear: parseReleaseYear(champion.release_date),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const championMap = new Map<string, ClassicChampion>();

for (const champion of champions) {
  championMap.set(normalizeName(champion.name), champion);
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseReleaseYear(value?: string): number {
  if (!value) {
    return 0;
  }

  const year = Number.parseInt(value.slice(0, 4), 10);
  return Number.isNaN(year) ? 0 : year;
}

function toNormalizedSet(values: string[]): Set<string> {
  return new Set(values.map((value) => value.toLowerCase()));
}

function compareSingle(guess: string, target: string): MatchStatus {
  return guess.toLowerCase() === target.toLowerCase() ? "match" : "mismatch";
}

function compareMultiValue(guess: string[], target: string[]): MatchStatus {
  const guessSet = toNormalizedSet(guess);
  const targetSet = toNormalizedSet(target);

  if (guess.length === 0 && target.length === 0) {
    return "match";
  }

  if (guessSet.size === targetSet.size && [...guessSet].every((value) => targetSet.has(value))) {
    return "match";
  }

  for (const value of guessSet) {
    if (targetSet.has(value)) {
      return "partial";
    }
  }

  return "mismatch";
}

function compareReleaseYear(guessYear: number, targetYear: number): YearStatus {
  if (guessYear === targetYear) {
    return "match";
  }

  return guessYear < targetYear ? "higher" : "lower";
}

function getDailyIndex(date: Date): number {
  const isoDate = date.toISOString().slice(0, 10);
  let hash = 0;

  for (const char of isoDate) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash % champions.length;
}

export function getDailyChampion(date: Date = new Date()): ClassicChampion {
  date.setUTCDate(date.getUTCDate() + 3);
  return champions[getDailyIndex(date)];
}

export function findChampionByName(input: string): ClassicChampion | undefined {
  return championMap.get(normalizeName(input));
}

export function findChampionSuggestions(input: string, limit = 5): string[] {
  const normalized = normalizeName(input);

  if (!normalized) {
    return [];
  }

  const startsWith = champions.filter((champion) => normalizeName(champion.name).startsWith(normalized));

  if (startsWith.length >= limit) {
    return startsWith.slice(0, limit).map((champion) => champion.name);
  }

  const contains = champions.filter((champion) => normalizeName(champion.name).includes(normalized));

  return [...new Set([...startsWith, ...contains])].slice(0, limit).map((champion) => champion.name);
}

export function evaluateClassicGuess(guess: ClassicChampion, target: ClassicChampion): ClassicEvaluation {
  return {
    guess,
    target,
    isCorrect: guess.name === target.name,
    gender: compareSingle(guess.gender, target.gender),
    positions: compareMultiValue(guess.positions, target.positions),
    species: compareMultiValue(guess.species, target.species),
    resource: compareSingle(guess.resource, target.resource),
    rangeType: compareMultiValue(guess.rangeType, target.rangeType),
    regions: compareMultiValue(guess.regions, target.regions),
    releaseYear: compareReleaseYear(guess.releaseYear, target.releaseYear),
  };
}

export function getChampionCount(): number {
  return champions.length;
}
