import { api } from './apiConnections/client';
import { PortalDifficulty, Character, ApiError } from './apiConnections/types';

export interface GameStateData {
  sessionId: string | null;
  balance: number;
  character: Character | null;
  isLoading: boolean;
}

type GameStateListener = (state: GameStateData) => void;

export class GameState {
  private state: GameStateData = {
    sessionId: null,
    balance: 0,
    character: null,
    isLoading: false,
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

    const response = await api.createSession('test');

    if (this.isApiError(response)) {
      console.error('Failed to create session:', response.error);
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
      console.log('Session created:', response.sessionId);
      return true;
    }

    this.update({ isLoading: false });
    return false;
  }

  /**
   * Enter a portal (spin)
   */
  async enterPortal(
    difficulty: PortalDifficulty,
    betAmount: number
  ): Promise<{
    success: boolean;
    winAmount: number;
    netResult: number;
    event?: any;
    background?: any;
    message?: string;
    error?: string;
  }> {
    if (!this.state.sessionId) {
      return { success: false, winAmount: 0, netResult: 0, error: 'No active session' };
    }

    this.update({ isLoading: true });

    const response = await api.enterPortal(this.state.sessionId, difficulty, betAmount);

    if (this.isApiError(response)) {
      this.update({ isLoading: false });
      return {
        success: false,
        winAmount: 0,
        netResult: 0,
        error: response.error,
      };
    }

    if (response.success) {
      this.update({
        balance: response.balance,
        isLoading: false,
      });

      return {
        success: true,
        winAmount: response.winAmount,
        netResult: response.netResult,
        event: response.result?.event,
        background: response.result?.background,
        message: response.rewardReport,
      };
    }

    this.update({ isLoading: false });
    return {
      success: false,
      winAmount: 0,
      netResult: 0,
      error: 'Unknown error',
    };
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
      console.log('Session ended. Final stats:', response.finalStats);
    }

    this.update({
      sessionId: null,
      balance: 0,
      character: null,
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
}

// Singleton instance
export const gameState = new GameState();

export default gameState;
