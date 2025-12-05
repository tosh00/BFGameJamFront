/**
 * Echoes of Realms - API Types
 * Typy dla komunikacji z backendem
 */

// Enums
export enum PortalDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum EventType {
  CHEST = 'CHEST',
  LAMP = 'LAMP',
  BOOK = 'BOOK',
  DIAMONDS = 'DIAMONDS'
}

export enum RewardType {
  GOLD = 'GOLD',
  GEMS = 'GEMS',
  EXPERIENCE = 'EXPERIENCE',
  SKILL_POINT = 'SKILL_POINT',
  ARTIFACT = 'ARTIFACT',
  MULTIPLIER = 'MULTIPLIER'
}

// Character
export interface CharacterStats {
  luck: number;
  agility: number;
  intuition: number;
  magicAffinity: number;
  dimensionalMastery: number;
}

export interface Character {
  id: string;
  name: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  stats: CharacterStats;
  unlockedPortals: PortalDifficulty[];
  inventory: any[];
  activeModifiers: any[];
  createdAt: number;
  lastPlayedAt: number;
}

// Portal
export interface Portal {
  id: string;
  difficulty: PortalDifficulty;
  name: string;
  description: string;
  baseRTP: number;
  minBet: number;
  maxBet: number;
  unlockLevel: number;
}

// Background
export interface Background {
  id: string;
  name: string;
  description: string;
  atmosphere: string;
  baseModifier: number;
}

export interface BackgroundSelection {
  background: Background;
  activeFilters: string[];
  combinedModifier: number;
}

// Event
export interface GameEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
}

// Reward
export interface Reward {
  id: string;
  type: RewardType;
  amount: number;
  multiplier?: number;
  source: string;
  timestamp: number;
}

export interface RewardBundle {
  rewards: Reward[];
  totalValue: number;
  bonusApplied: boolean;
}

// Session
export interface SessionStats {
  totalSpins: number;
  totalWinnings: number;
  biggestWin: number;
  sessionDuration: number;
}

export interface BalanceInfo {
  balance: number;
  minBet: number;
  maxBet: number;
  betOptions: number[];
  canPlay: boolean;
}

// API Responses
export interface CreateSessionResponse {
  success: boolean;
  sessionId: string;
  character: Character;
  balance: number;
  message: string;
}

export interface GetSessionResponse {
  success: boolean;
  session: {
    sessionId: string;
    character: Character;
    spinsCount: number;
    currentBet: number;
  };
  balance: number;
  stats: SessionStats;
}

export interface EndSessionResponse {
  success: boolean;
  finalStats: SessionStats;
  character: Character;
}

export interface BalanceResponse {
  success: boolean;
  balance: number;
  minBet: number;
  maxBet: number;
  betOptions: number[];
  canPlay: boolean;
}

export interface EconomyConfigResponse {
  success: boolean;
  startingBalance: number;
  minBet: number;
  maxBet: number;
  betOptions: number[];
}

export interface PortalsResponse {
  success: boolean;
  portals: Portal[];
}

export interface PortalResponse {
  success: boolean;
  portal: Portal;
}

export interface EnterPortalResponse {
  success: boolean;
  result: {
    portal: Portal;
    background: BackgroundSelection;
    event: GameEvent;
    rewards: RewardBundle;
    rtpUsed: number;
    characterUpdate: {
      experienceGained: number;
      levelUp: boolean;
      newLevel?: number;
    };
  };
  balance: number;
  betAmount: number;
  winAmount: number;
  netResult: number;
  rewardReport: string;
}

export interface PortalStatsResponse {
  success: boolean;
  stats: {
    effectiveRTP: number;
    hitProbability: number;
    lossStreak: number;
    potentialMultiplier: {
      min: number;
      max: number;
    };
  };
}

export interface BackgroundResponse {
  success: boolean;
  background: BackgroundSelection;
  description: string;
  bonusPercent: string;
}

export interface AllBackgroundsResponse {
  success: boolean;
  backgrounds: Background[];
}

export interface EventsResponse {
  success: boolean;
  events: Array<{
    type: EventType;
    name: string;
    description: string;
    baseProbability: number;
  }>;
}

export interface RTPCalculationResponse {
  success: boolean;
  calculation: {
    baseRTP: number;
    characterBonus: number;
    finalRTP: number;
    breakdown: string[];
  };
  formattedRTP: string;
}

export interface CharacterProfileResponse {
  success: boolean;
  profile: {
    basic: {
      name: string;
      title: string;
    };
    stats: {
      baseStats: CharacterStats;
      effectiveStats: CharacterStats;
    };
    progress: {
      level: number;
      experience: number;
    };
    skills: any[];
    unlockedPortals: PortalDifficulty[];
  };
}

export interface LeaderboardEntry {
  characterId: string;
  characterName: string;
  level: number;
  totalExperience: number;
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
}

export interface HealthResponse {
  success: boolean;
  status: string;
  timestamp: string;
  uptime: number;
}

export interface ApiError {
  success: false;
  error: string;
}

// ==================== ROUND TYPES ====================

export type RoundStatus = 'IN_PROGRESS' | 'WON' | 'LOST' | 'CASHED_OUT';

export interface RoundEvent {
  eventIndex: number;
  event: GameEvent;
  background: BackgroundSelection;
  isWin: boolean;
  reward: number;
  multiplierGained: number;
  timestamp: number;
}

export interface Round {
  roundId: string;
  sessionId: string;
  roundNumber: number;
  status: RoundStatus;
  portalDifficulty: PortalDifficulty;
  initialBet: number;
  events: RoundEvent[];
  currentEventIndex: number;
  maxEvents: number;
  accumulatedWinnings: number;
  currentMultiplier: number;
  canContinue: boolean;
  canCashOut: boolean;
  nextEventDifficulty?: number;
  potentialLoss: number;
  balanceBefore: number;
  balanceAfter: number;
  totalExperienceGained: number;
  baseRtp: number;
  startedAt: number;
  completedAt?: number;
}

export interface RoundStartResponse {
  success: boolean;
  round: Round;
  lastEvent: RoundEvent;
  message: string;
  session: {
    balance: number;
    totalRounds: number;
  };
}

export interface RoundContinueResponse {
  success: boolean;
  round: Round;
  lastEvent: RoundEvent;
  message: string;
  session: {
    balance: number;
    totalRounds: number;
  };
}

export interface RoundCashoutResponse {
  success: boolean;
  round: Round;
  message: string;
  session: {
    balance: number;
    totalRounds: number;
  };
}

export interface ActiveRoundResponse {
  success: boolean;
  hasActiveRound: boolean;
  round: Round | null;
}
