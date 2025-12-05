/**
 * Echoes of Realms - API Client
 * Główny klient do komunikacji z backendem
 */

import {
  AllBackgroundsResponse,
  ApiError,
  BackgroundResponse,
  BalanceResponse,
  CharacterProfileResponse,
  CreateSessionResponse,
  EconomyConfigResponse,
  EndSessionResponse,
  EnterPortalResponse,
  EventsResponse,
  GetSessionResponse,
  HealthResponse,
  LeaderboardResponse,
  PortalDifficulty,
  PortalResponse,
  PortalsResponse,
  PortalStatsResponse,
  RTPCalculationResponse,
  RoundStartResponse,
  RoundContinueResponse,
  RoundCashoutResponse,
  ActiveRoundResponse
} from './types';

type ApiResponse<T> = T | ApiError;

export class EchoesApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        // enable CORS for cross-origin requests; allow caller to override via options
        mode: 'cors',
        // include credentials (cookies/authorization) for cross-origin requests if needed;
        // change to 'same-origin' or remove if you don't want to send cookies
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // ==================== SESSION ====================

  /**
   * Tworzy nową sesję gry
   * @param characterId - opcjonalnie ID istniejącej postaci
   */
  async createSession(characterId?: string): Promise<ApiResponse<CreateSessionResponse>> {
    return this.request<CreateSessionResponse>('/session/create', {
      method: 'POST',
      body: JSON.stringify({ characterId })
    });
  }

  /**
   * Pobiera dane aktywnej sesji
   */
  async getSession(sessionId: string): Promise<ApiResponse<GetSessionResponse>> {
    return this.request<GetSessionResponse>(`/session/${sessionId}`);
  }

  /**
   * Kończy sesję i zwraca podsumowanie
   */
  async endSession(sessionId: string): Promise<ApiResponse<EndSessionResponse>> {
    return this.request<EndSessionResponse>(`/session/${sessionId}/end`, {
      method: 'POST'
    });
  }

  /**
   * Pobiera aktualne saldo gracza
   */
  async getBalance(sessionId: string): Promise<ApiResponse<BalanceResponse>> {
    return this.request<BalanceResponse>(`/session/${sessionId}/balance`);
  }

  // ==================== ECONOMY ====================

  /**
   * Pobiera konfigurację ekonomii gry
   */
  async getEconomyConfig(): Promise<ApiResponse<EconomyConfigResponse>> {
    return this.request<EconomyConfigResponse>('/economy/config');
  }

  // ==================== PORTALS ====================

  /**
   * Pobiera listę wszystkich portali
   */
  async getPortals(): Promise<ApiResponse<PortalsResponse>> {
    return this.request<PortalsResponse>('/portals');
  }

  /**
   * Pobiera szczegóły konkretnego portalu
   */
  async getPortal(difficulty: PortalDifficulty): Promise<ApiResponse<PortalResponse>> {
    return this.request<PortalResponse>(`/portals/${difficulty}`);
  }

  /**
   * Wejście do portalu (spin)
   */
  async enterPortal(
    sessionId: string,
    portalDifficulty: PortalDifficulty,
    betAmount: number
  ): Promise<ApiResponse<EnterPortalResponse>> {
    return this.request<EnterPortalResponse>('/portals/enter', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        portalDifficulty,
        betAmount
      })
    });
  }

  /**
   * Pobiera statystyki portalu dla gracza
   */
  async getPortalStats(
    difficulty: PortalDifficulty,
    sessionId: string
  ): Promise<ApiResponse<PortalStatsResponse>> {
    return this.request<PortalStatsResponse>(`/portals/${difficulty}/stats/${sessionId}`);
  }

  // ==================== BACKGROUNDS ====================

  /**
   * Pobiera losowy background dla poziomu trudności
   */
  async getBackground(difficulty: PortalDifficulty): Promise<ApiResponse<BackgroundResponse>> {
    return this.request<BackgroundResponse>(`/backgrounds/${difficulty}`);
  }

  /**
   * Pobiera wszystkie backgroundy dla poziomu trudności
   */
  async getAllBackgrounds(difficulty: PortalDifficulty): Promise<ApiResponse<AllBackgroundsResponse>> {
    return this.request<AllBackgroundsResponse>(`/backgrounds/${difficulty}/all`);
  }

  // ==================== EVENTS ====================

  /**
   * Pobiera listę wszystkich eventów
   */
  async getEvents(): Promise<ApiResponse<EventsResponse>> {
    return this.request<EventsResponse>('/events');
  }

  // ==================== RTP ====================

  /**
   * Oblicza RTP dla gracza
   */
  async calculateRTP(
    sessionId: string,
    portalDifficulty: PortalDifficulty
  ): Promise<ApiResponse<RTPCalculationResponse>> {
    return this.request<RTPCalculationResponse>('/rtp/calculate', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        portalDifficulty
      })
    });
  }

  // ==================== CHARACTER ====================

  /**
   * Pobiera profil postaci
   */
  async getCharacterProfile(sessionId: string): Promise<ApiResponse<CharacterProfileResponse>> {
    return this.request<CharacterProfileResponse>(`/character/${sessionId}`);
  }

  // ==================== LEADERBOARD ====================

  /**
   * Pobiera ranking graczy
   */
  async getLeaderboard(limit: number = 10): Promise<ApiResponse<LeaderboardResponse>> {
    return this.request<LeaderboardResponse>(`/leaderboard?limit=${limit}`);
  }

  // ==================== HEALTH ====================

  /**
   * Sprawdza status API
   */
  async healthCheck(): Promise<ApiResponse<HealthResponse>> {
    return this.request<HealthResponse>('/health');
  }

  // ==================== ROUNDS (Multi-Event) ====================

  /**
   * Rozpoczyna nową rundę (pierwszy event)
   */
  async startRound(
    sessionId: string,
    portalDifficulty: PortalDifficulty,
    betAmount: number
  ): Promise<ApiResponse<RoundStartResponse>> {
    return this.request<RoundStartResponse>('/round/start', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        portalDifficulty,
        betAmount
      })
    });
  }

  /**
   * Kontynuuje rundę (ryzykuj dalej)
   */
  async continueRound(sessionId: string): Promise<ApiResponse<RoundContinueResponse>> {
    return this.request<RoundContinueResponse>('/round/continue', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
  }

  /**
   * Wypłaca wygrane (zakończ rundę)
   */
  async cashoutRound(sessionId: string): Promise<ApiResponse<RoundCashoutResponse>> {
    return this.request<RoundCashoutResponse>('/round/cashout', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
  }

  /**
   * Sprawdza czy gracz ma aktywną rundę
   */
  async getActiveRound(sessionId: string): Promise<ApiResponse<ActiveRoundResponse>> {
    return this.request<ActiveRoundResponse>(`/round/active/${sessionId}`);
  }
}

// Domyślna instancja klienta
export const api = new EchoesApiClient();

export default EchoesApiClient;
