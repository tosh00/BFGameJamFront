import { api } from './apiConnections/client';
import { PortalDifficulty, Character, ApiError, Round, RoundEvent, RoundStatus } from './apiConnections/types';

export interface GameStateData {
  sessionId: string | null;
  balance: number;
  character: Character | null;
  isLoading: boolean;
  
  // Round state
  activeRound: Round | null;
  lastEvent: RoundEvent | null;
  canContinue: boolean;
  canCashOut: boolean;
}

type GameStateListener = (state: GameStateData) => void;

export class GameState {
  private state: GameStateData = {
    sessionId: null,
    balance: 0,
    character: null,
    isLoading: false,
    activeRound: null,
    lastEvent: null,
    canContinue: false,
    canCashOut: false,
  };

  private listeners: GameStateListener[] = [];

  getState(): GameStateData {
    return { ...this.state };
  }

  subscribe(listener: GameStateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.getState()));
  }

  private update(partial: Partial<GameStateData>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private isApiError(response: any): response is ApiError {
    return response.success === false && 'error' in response;
  }

  /**
   * Create a new game session
   */
  async createSession(username?: string, characterName?: string): Promise<boolean> {
    this.update({ isLoading: true });

    const response = await api.createSession(username);

    if (this.isApiError(response)) {
      console.error('❌ Failed to create session:', response.error);
      this.update({ isLoading: false });
      return false;
    }

    if (response.success) {
      this.update({
        sessionId: response.sessionId,
        balance: response.balance,
        character: response.character,
        isLoading: false,
      });
      console.log('✅ Session created:', response.sessionId);
      console.log('💰 Starting balance:', response.balance);
      return true;
    }

    this.update({ isLoading: false });
    return false;
  }

  /**
   * Start a new round (first event)
   */
  async startRound(
    difficulty: PortalDifficulty,
    betAmount: number
  ): Promise<{
    success: boolean;
    isWin: boolean;
    reward: number;
    message: string;
    event?: RoundEvent;
    roundStatus?: RoundStatus;
    error?: string;
  }> {
    if (!this.state.sessionId) {
      return { success: false, isWin: false, reward: 0, message: '', error: 'No active session' };
    }

    if (this.state.activeRound?.status === 'IN_PROGRESS') {
      return { success: false, isWin: false, reward: 0, message: '', error: 'Round already in progress' };
    }

    this.update({ isLoading: true });

    const response = await api.startRound(this.state.sessionId, difficulty, betAmount);

    if (this.isApiError(response)) {
      this.update({ isLoading: false });
      console.error('❌ Failed to start round:', response.error);
      return {
        success: false,
        isWin: false,
        reward: 0,
        message: '',
        error: response.error,
      };
    }

    if (response.success) {
      const { round, lastEvent, session, message } = response;
      
      this.update({
        balance: session.balance,
        activeRound: round,
        lastEvent: lastEvent,
        canContinue: round.canContinue,
        canCashOut: round.canCashOut,
        isLoading: false,
      });

      const isWin = lastEvent.isWin;
      
      if (isWin) {
        console.log(`🎉 Event ${lastEvent.eventIndex + 1}: WYGRANA! +${lastEvent.reward} gold`);
        console.log(`📊 Accumulated: ${round.accumulatedWinnings} gold (${round.currentMultiplier.toFixed(2)}x)`);
        console.log(`⚠️ Next event difficulty: ${round.nextEventDifficulty}%`);
      } else {
        console.log(`💀 Event ${lastEvent.eventIndex + 1}: PRZEGRANA!`);
        console.log(`💸 Lost bet: ${round.initialBet} gold`);
      }

      return {
        success: true,
        isWin,
        reward: lastEvent.reward,
        message,
        event: lastEvent,
        roundStatus: round.status,
      };
    }

    this.update({ isLoading: false });
    return { success: false, isWin: false, reward: 0, message: '', error: 'Unknown error' };
  }

  /**
   * Continue the round (risk it!)
   */
  async continueRound(): Promise<{
    success: boolean;
    isWin: boolean;
    reward: number;
    message: string;
    event?: RoundEvent;
    roundStatus?: RoundStatus;
    totalLost?: number;
    error?: string;
  }> {
    if (!this.state.sessionId) {
      return { success: false, isWin: false, reward: 0, message: '', error: 'No active session' };
    }

    if (!this.state.canContinue) {
      return { success: false, isWin: false, reward: 0, message: '', error: 'Cannot continue' };
    }

    this.update({ isLoading: true });

    const response = await api.continueRound(this.state.sessionId);

    if (this.isApiError(response)) {
      this.update({ isLoading: false });
      console.error('❌ Failed to continue round:', response.error);
      return {
        success: false,
        isWin: false,
        reward: 0,
        message: '',
        error: response.error,
      };
    }

    if (response.success) {
      const { round, lastEvent, session, message } = response;
      
      this.update({
        balance: session.balance,
        activeRound: round,
        lastEvent: lastEvent,
        canContinue: round.canContinue,
        canCashOut: round.canCashOut,
        isLoading: false,
      });

      const isWin = lastEvent.isWin;
      
      if (isWin) {
        console.log(`🎉 Event ${lastEvent.eventIndex + 1}: WYGRANA! +${lastEvent.reward} gold`);
        console.log(`📊 Accumulated: ${round.accumulatedWinnings} gold (${round.currentMultiplier.toFixed(2)}x)`);
        console.log(`⚠️ Next event difficulty: ${round.nextEventDifficulty}%`);
      } else {
        console.log(`💀 Event ${lastEvent.eventIndex + 1}: PRZEGRANA!`);
        console.log(`💸 LOST EVERYTHING! Total lost: ${round.initialBet + round.potentialLoss} gold`);
      }

      return {
        success: true,
        isWin,
        reward: lastEvent.reward,
        message,
        event: lastEvent,
        roundStatus: round.status,
        totalLost: round.status === 'LOST' ? round.initialBet : undefined,
      };
    }

    this.update({ isLoading: false });
    return { success: false, isWin: false, reward: 0, message: '', error: 'Unknown error' };
  }

  /**
   * Cash out the current round
   */
  async cashOut(): Promise<{
    success: boolean;
    totalWinnings: number;
    message: string;
    error?: string;
  }> {
    if (!this.state.sessionId) {
      return { success: false, totalWinnings: 0, message: '', error: 'No active session' };
    }

    if (!this.state.canCashOut) {
      return { success: false, totalWinnings: 0, message: '', error: 'Cannot cash out' };
    }

    this.update({ isLoading: true });

    const response = await api.cashoutRound(this.state.sessionId);

    if (this.isApiError(response)) {
      this.update({ isLoading: false });
      console.error('❌ Failed to cash out:', response.error);
      return {
        success: false,
        totalWinnings: 0,
        message: '',
        error: response.error,
      };
    }

    if (response.success) {
      const { round, session, message } = response;
      
      console.log(`💰 CASH OUT! Won ${round.accumulatedWinnings} gold (${round.currentMultiplier.toFixed(2)}x)`);
      console.log(`💎 New balance: ${session.balance} gold`);

      this.update({
        balance: session.balance,
        activeRound: null,
        lastEvent: null,
        canContinue: false,
        canCashOut: false,
        isLoading: false,
      });

      return {
        success: true,
        totalWinnings: round.accumulatedWinnings,
        message,
      };
    }

    this.update({ isLoading: false });
    return { success: false, totalWinnings: 0, message: '', error: 'Unknown error' };
  }

  /**
   * Check for active round (e.g., after page refresh)
   */
  async checkActiveRound(): Promise<boolean> {
    if (!this.state.sessionId) return false;

    const response = await api.getActiveRound(this.state.sessionId);

    if (this.isApiError(response)) {
      return false;
    }

    if (response.success && response.hasActiveRound && response.round) {
      this.update({
        activeRound: response.round,
        canContinue: response.round.canContinue,
        canCashOut: response.round.canCashOut,
      });
      console.log('🔄 Active round found:', response.round.roundId);
      return true;
    }

    return false;
  }

  /**
   * Clear round state (after round ends)
   */
  clearRound() {
    this.update({
      activeRound: null,
      lastEvent: null,
      canContinue: false,
      canCashOut: false,
    });
  }

  /**
   * Get current balance from server
   */
  async refreshBalance(): Promise<void> {
    if (!this.state.sessionId) return;

    const response = await api.getBalance(this.state.sessionId);
    if (response.success) {
      this.update({ balance: response.balance });
    }
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    if (!this.state.sessionId) return;

    const response = await api.endSession(this.state.sessionId);
    if (response.success) {
      console.log('👋 Session ended. Final stats:', response.finalStats);
    }

    this.update({
      sessionId: null,
      balance: 0,
      character: null,
      activeRound: null,
      lastEvent: null,
      canContinue: false,
      canCashOut: false,
    });
  }

  /**
   * Check if player can afford a bet
   */
  canAffordBet(amount: number): boolean {
    return this.state.balance >= amount;
  }

  /**
   * Check if a portal is unlocked for the player
   */
  isPortalUnlocked(difficulty: PortalDifficulty): boolean {
    if (!this.state.character) return difficulty === PortalDifficulty.EASY;
    return this.state.character.unlockedPortals.includes(difficulty);
  }

  /**
   * Check if there's an active round in progress
   */
  hasActiveRound(): boolean {
    return this.state.activeRound?.status === 'IN_PROGRESS';
  }
}

// Singleton instance
export const gameState = new GameState();

export default gameState;
