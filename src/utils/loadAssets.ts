import { Assets } from 'pixi.js';

// Base URL for GitHub assets
const ASSETS_BASE_URL = 'https://raw.githubusercontent.com/tosh00/BFGameJamFrontAssets/refs/heads/main/backgrounds';

// Background assets organized by difficulty
export const backgroundAssets = {
  // ...existing code...
  easy: [
    'blossomFields',
    'bubbleBay',
    'crystalCreekVillage',
    'jellyForest',
    'peacfulJungle',
  ],
  medium: [
    'emberwoodCanyon',
    'frostbiteCaverns',
    'gearfallRuins',
    'mistveilSwamp',
    'shatteredDesert',
    'stoneScene',
  ],
  hard: [
    'abyssalMaw',
    'crimsonDominion',
    'infernalClocktowerCore',
    'voidfractRiftplane',
    'volcano',
  ],
};

export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Get the full URL for a background asset
 */
export function getBackgroundUrl(difficulty: Difficulty, name: string): string {
  return `${ASSETS_BASE_URL}/${difficulty}/${name}.png`;
}

/**
 * Get all background URLs for a specific difficulty
 */
export function getBackgroundUrls(difficulty: Difficulty): string[] {
  return backgroundAssets[difficulty].map((name) => getBackgroundUrl(difficulty, name));
}

/**
 * Get all background URLs for all difficulties
 */
export function getAllBackgroundUrls(): string[] {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  return difficulties.flatMap((diff) => getBackgroundUrls(diff));
}

/**
 * Load all background assets
 */
export async function loadAllBackgrounds(): Promise<void> {
  const allUrls = getAllBackgroundUrls();
  await Assets.load(allUrls);
}

/**
 * Get a random background URL for a specific difficulty
 */
export function getRandomBackground(difficulty: Difficulty): string {
  const backgrounds = backgroundAssets[difficulty];
  const randomIndex = Math.floor(Math.random() * backgrounds.length);
  return getBackgroundUrl(difficulty, backgrounds[randomIndex]);
}

/**
 * Get random backgrounds for each portal (easy, medium, hard)
 */
export function getRandomBackgroundsForPortals(): { easy: string; medium: string; hard: string } {
  return {
    easy: getRandomBackground('easy'),
    medium: getRandomBackground('medium'),
    hard: getRandomBackground('hard'),
  };
}
