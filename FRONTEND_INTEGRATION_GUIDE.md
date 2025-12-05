# 🎮 Echoes of Realms - Frontend Integration Guide

## Przegląd

**Echoes of Realms** to gra typu roguelike/risk inspirowana fantasy world, gdzie gracz wciela się w Wanderer podróżującą przez wymiary. Backend działa na **Express.js + TypeScript** z **MongoDB Atlas**.

**Base URL:** `http://localhost:3000/api`

---

## 🔑 Kluczowe koncepcje

### Architektura Multi-Event Round (Roguelike/Risk)

Każda **runda** to seria eventów, gdzie gracz po każdej wygranej decyduje:
- **CONTINUE** - ryzykuj dalej (wyższy mnożnik, ale możesz stracić wszystko)
- **CASH OUT** - wypłać dotychczasowe wygrane

**Jeśli przegrasz** - tracisz WSZYSTKO z tej rundy (bet + accumulated winnings).

### Flow gry
```
1. POST /api/session/create     → Utwórz sesję (otrzymujesz sessionId)
2. POST /api/round/start        → Rozpocznij rundę (bet + pierwszy event)
3. [LOOP] Jeśli wygrana:
   - POST /api/round/continue   → Ryzykuj dalej (następny event)
   - POST /api/round/cashout    → Wypłać wygrane (koniec rundy)
4. GET  /api/session/:id/rounds → Historia rund ze statystykami
5. POST /api/session/:id/end    → Zakończ sesję
```

### Diagram flow rundy
```
┌─────────────────┐
│  /round/start   │  ← Gracz stawia zakład
│   (bet: 100)    │
└────────┬────────┘
         │
         ▼
    ┌────────────┐
    │  Event #1  │  ← Losowanie: wygrana/przegrana
    └─────┬──────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
 WYGRANA     PRZEGRANA
 (103 zł)    (status: LOST)
    │           │
    │           └──► Koniec rundy, bet stracony
    │
    ▼
┌──────────────────────┐
│ canContinue: true    │
│ canCashOut: true     │
│ Gracz decyduje...    │
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
/round/continue  /round/cashout
     │           │
     ▼           └──► Koniec rundy, 103 zł na konto
┌────────────┐
│  Event #2  │  ← Trudniejszy! (szansa spada)
└─────┬──────┘
      │
┌─────┴─────┐
│           │
▼           ▼
WYGRANA   PRZEGRANA
(+156 zł)  (status: LOST)
│           │
│           └──► Tracisz WSZYSTKO (103 + 156 = 0)
▼
[...powtórz lub cashout...]
```

---

## 📡 API Endpoints

### 1. Zarządzanie sesją

#### `POST /api/session/create`
Tworzy nową sesję gry.

**Request:**
```json
{
  "username": "PlayerName",
  "characterName": "Wanderer"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid-session-id",
  "playerId": "uuid-player-id",
  "character": {
    "id": "uuid",
    "name": "Wanderer",
    "level": 1,
    "experience": 0,
    "experienceToNextLevel": 100,
    "stats": {
      "luck": 10,
      "agility": 10,
      "intuition": 10,
      "magicAffinity": 10,
      "dimensionalMastery": 5
    },
    "skills": [],
    "unlockedPortals": ["EASY"],
    "inventory": [],
    "activeModifiers": []
  },
  "balance": 1000
}
```

#### `GET /api/session/:sessionId`
Pobiera dane sesji.

#### `POST /api/session/:sessionId/end`
Kończy sesję i synchronizuje z bazą.

---

### 2. 🎰 Główna mechanika - Rundy (Multi-Event)

#### `POST /api/round/start` ⭐ ROZPOCZNIJ RUNDĘ
Rozpoczyna nową rundę - pobiera zakład i losuje pierwszy event.

**Request:**
```json
{
  "sessionId": "uuid-session-id",
  "portalDifficulty": "EASY",
  "betAmount": 100
}
```

**Response (wygrana - runda trwa):**
```json
{
  "success": true,
  "round": {
    "roundId": "uuid-round-id",
    "sessionId": "uuid-session-id",
    "roundNumber": 1,
    "status": "IN_PROGRESS",
    "portalDifficulty": "EASY",
    "initialBet": 100,
    
    "events": [
      {
        "eventIndex": 0,
        "event": {
          "id": "event_chest_abc123",
          "type": "CHEST",
          "name": "Skrzynia Skarbów",
          "description": "Stara skrzynia emanuje złotym blaskiem..."
        },
        "background": {
          "background": {
            "id": "easy_bg_1",
            "name": "Zaczarowany Las",
            "description": "Mglisty las pełen tajemniczych świateł..."
          },
          "activeFilters": ["GLOW"],
          "combinedModifier": 1.05
        },
        "isWin": true,
        "reward": 126,
        "multiplierGained": 2.26,
        "timestamp": 1701234567890
      }
    ],
    
    "currentEventIndex": 0,
    "maxEvents": 7,
    "accumulatedWinnings": 126,
    "currentMultiplier": 2.26,
    
    "canContinue": true,
    "canCashOut": true,
    "nextEventDifficulty": 57,
    "potentialLoss": 126,
    
    "balanceBefore": 1000,
    "balanceAfter": 900,
    
    "totalExperienceGained": 35,
    "baseRtp": 0.96,
    "startedAt": 1701234567800
  },
  "lastEvent": { /* ostatni event z tablicy events */ },
  "message": "Event 1: WYGRANA! Kontynuuj lub wypłać.",
  "session": {
    "balance": 900,
    "totalRounds": 1
  }
}
```

**Response (przegrana - runda zakończona):**
```json
{
  "success": true,
  "round": {
    "roundId": "uuid-round-id",
    "status": "LOST",
    "accumulatedWinnings": 0,
    "canContinue": false,
    "canCashOut": false,
    "balanceAfter": 900,
    "completedAt": 1701234567890
  },
  "lastEvent": {
    "isWin": false,
    "reward": 0
  },
  "message": "Runda zakończona",
  "session": {
    "balance": 900,
    "totalRounds": 1
  }
}
```

---

#### `POST /api/round/continue` ⭐ KONTYNUUJ (RYZYKUJ)
Gracz decyduje się ryzykować - losowany jest następny event.

**Request:**
```json
{
  "sessionId": "uuid-session-id"
}
```

**Response (kolejna wygrana):**
```json
{
  "success": true,
  "round": {
    "status": "IN_PROGRESS",
    "events": [
      { "eventIndex": 0, "isWin": true, "reward": 126 },
      { "eventIndex": 1, "isWin": true, "reward": 170 }
    ],
    "currentEventIndex": 1,
    "accumulatedWinnings": 296,
    "currentMultiplier": 3.96,
    "canContinue": true,
    "canCashOut": true,
    "nextEventDifficulty": 49,
    "potentialLoss": 296
  },
  "lastEvent": {
    "eventIndex": 1,
    "isWin": true,
    "reward": 170,
    "multiplierGained": 1.70
  },
  "message": "Event 2: WYGRANA! Kontynuuj lub wypłać.",
  "session": {
    "balance": 900,
    "totalRounds": 1
  }
}
```

**Response (przegrana - tracisz wszystko!):**
```json
{
  "success": true,
  "round": {
    "status": "LOST",
    "events": [
      { "eventIndex": 0, "isWin": true, "reward": 126 },
      { "eventIndex": 1, "isWin": true, "reward": 170 },
      { "eventIndex": 2, "isWin": false, "reward": 0 }
    ],
    "accumulatedWinnings": 0,
    "currentMultiplier": 3.96,
    "canContinue": false,
    "canCashOut": false,
    "balanceAfter": 900,
    "completedAt": 1701234567890
  },
  "lastEvent": {
    "eventIndex": 2,
    "isWin": false,
    "reward": 0
  },
  "message": "PRZEGRANA! Straciłeś 100 złota.",
  "session": {
    "balance": 900,
    "totalRounds": 1
  }
}
```

---

#### `POST /api/round/cashout` ⭐ WYPŁAĆ WYGRANE
Gracz decyduje się zakończyć rundę i zabrać wygrane.

**Request:**
```json
{
  "sessionId": "uuid-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "round": {
    "status": "CASHED_OUT",
    "events": [
      { "eventIndex": 0, "isWin": true, "reward": 126 },
      { "eventIndex": 1, "isWin": true, "reward": 170 }
    ],
    "accumulatedWinnings": 296,
    "currentMultiplier": 3.96,
    "balanceAfter": 1196,
    "completedAt": 1701234567890
  },
  "message": "WYPŁATA! Wygrałeś 296 złota (3.96x) po 2 eventach!",
  "session": {
    "balance": 1196,
    "totalRounds": 1
  }
}
```

---

#### `GET /api/round/active/:sessionId`
Sprawdza czy gracz ma aktywną (niezakończoną) rundę.

**Response (jest aktywna runda):**
```json
{
  "success": true,
  "hasActiveRound": true,
  "round": { /* pełny obiekt rundy */ }
}
```

**Response (brak aktywnej rundy):**
```json
{
  "success": true,
  "hasActiveRound": false,
  "round": null
}
```

---

#### `GET /api/round/config/:difficulty`
Pobiera konfigurację trudności dla portalu.

**Response:**
```json
{
  "success": true,
  "difficulty": "EASY",
  "config": {
    "baseWinChance": 65,
    "difficultyIncreasePerEvent": 8,
    "minWinChance": 25,
    "multiplierIncreasePerEvent": 0.5,
    "maxEvents": 7,
    "minEventsForCashOut": 1
  }
}
```

**Konfiguracja dla wszystkich poziomów:**

| Portal | Start % | Spadek/event | Min % | Mnożnik/event | Max events |
|--------|---------|--------------|-------|---------------|------------|
| EASY   | 65%     | -8%          | 25%   | +0.5x         | 7          |
| MEDIUM | 55%     | -10%         | 15%   | +1.0x         | 6          |
| HARD   | 45%     | -12%         | 10%   | +2.0x         | 5          |

---

#### `GET /api/round/:roundId`
Pobiera szczegóły konkretnej rundy.

#### `GET /api/session/:sessionId/rounds`
Pobiera historię rund ze statystykami.

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "rounds": [
    {
      "roundId": "uuid",
      "roundNumber": 1,
      "status": "CASHED_OUT",
      "portalDifficulty": "EASY",
      "initialBet": 100,
      "finalWinnings": 296,
      "totalMultiplier": 3.96,
      "eventsPlayed": 2,
      "completedAt": 1701234567890
    }
  ],
  "totalRounds": 5,
  "stats": {
    "totalBet": 500,
    "totalWon": 450,
    "netResult": -50,
    "winCount": 2,
    "lossCount": 3,
    "avgEventsPerRound": 1.8,
    "biggestWin": 296,
    "biggestMultiplier": 3.96,
    "longestStreak": 2
  }
}
```

#### `GET /api/session/:sessionId/rounds/last`
Pobiera ostatnią rundę w sesji.

---

### 3. Portale

#### `GET /api/portals`
Lista wszystkich portali.

#### `GET /api/portals/:difficulty`
Szczegóły konkretnego portalu (EASY/MEDIUM/HARD).

---

### 4. Health Check

#### `GET /api/health`
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": 1701234567890,
  "version": "1.0.0",
  "game": "Echoes of Realms"
}
```

---

## 🎨 TypeScript Types dla Frontend

```typescript
// === ENUMS ===
enum PortalDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

enum EventType {
  CHEST = 'CHEST',      // Skrzynia - złoto
  LAMP = 'LAMP',        // Lampa - mnożniki
  BOOK = 'BOOK',        // Księga - XP
  DIAMONDS = 'DIAMONDS' // Diamenty - rzadkie nagrody
}

type RoundStatus = 'IN_PROGRESS' | 'WON' | 'LOST' | 'CASHED_OUT';

// === CORE TYPES ===
interface Character {
  id: string;
  name: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  stats: CharacterStats;
  skills: CharacterSkill[];
  unlockedPortals: PortalDifficulty[];
  inventory: InventoryItem[];
  activeModifiers: EventModifier[];
  createdAt: number;
  lastPlayedAt: number;
}

interface CharacterStats {
  luck: number;
  agility: number;
  intuition: number;
  magicAffinity: number;
  dimensionalMastery: number;
}

interface Background {
  id: string;
  name: string;
  description: string;
  portalDifficulty: PortalDifficulty;
  atmosphere: string;
  availableFilters: string[];
  baseModifier: number;
}

interface BackgroundSelection {
  background: Background;
  activeFilters: string[];
  combinedModifier: number;
}

interface GameEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  baseProbability: number;
  modifiers: EventModifier[];
}

// === ROUND EVENT (pojedynczy event w rundzie) ===
interface RoundEvent {
  eventIndex: number;
  event: GameEvent;
  background: BackgroundSelection;
  isWin: boolean;
  reward: number;
  multiplierGained: number;
  timestamp: number;
}

// === ROUND (główna jednostka gry - multi-event) ===
interface Round {
  roundId: string;
  sessionId: string;
  roundNumber: number;
  status: RoundStatus;
  
  // Input
  portalDifficulty: PortalDifficulty;
  initialBet: number;
  
  // Events (tablica wszystkich eventów w rundzie)
  events: RoundEvent[];
  currentEventIndex: number;
  maxEvents: number;
  
  // Accumulated values
  accumulatedWinnings: number;
  currentMultiplier: number;
  
  // Decision flags
  canContinue: boolean;
  canCashOut: boolean;
  nextEventDifficulty?: number;  // % szans na następny event
  potentialLoss: number;         // ile stracisz jeśli przegrasz
  
  // Balance tracking
  balanceBefore: number;
  balanceAfter: number;
  
  // Character
  totalExperienceGained: number;
  characterUpdates: CharacterUpdate[];
  
  // Meta
  baseRtp: number;
  difficultyScaling: number;
  
  // Timestamps
  startedAt: number;
  completedAt?: number;
}

interface RoundSummary {
  roundId: string;
  roundNumber: number;
  status: RoundStatus;
  portalDifficulty: PortalDifficulty;
  initialBet: number;
  finalWinnings: number;
  totalMultiplier: number;
  eventsPlayed: number;
  completedAt?: number;
}

interface RoundHistory {
  sessionId: string;
  rounds: RoundSummary[];
  totalRounds: number;
  stats: {
    totalBet: number;
    totalWon: number;
    netResult: number;
    winCount: number;
    lossCount: number;
    avgEventsPerRound: number;
    biggestWin: number;
    biggestMultiplier: number;
    longestStreak: number;
  };
}

interface RoundDifficultyConfig {
  baseWinChance: number;
  difficultyIncreasePerEvent: number;
  minWinChance: number;
  multiplierIncreasePerEvent: number;
  maxEvents: number;
  minEventsForCashOut: number;
}

// === API RESPONSES ===
interface RoundStartResponse {
  success: boolean;
  round: Round;
  lastEvent: RoundEvent;
  message: string;
  session: {
    balance: number;
    totalRounds: number;
  };
}

interface RoundContinueResponse {
  success: boolean;
  round: Round;
  lastEvent: RoundEvent;
  message: string;
  session: {
    balance: number;
    totalRounds: number;
  };
}

interface RoundCashoutResponse {
  success: boolean;
  round: Round;
  message: string;
  session: {
    balance: number;
    totalRounds: number;
  };
}

interface ActiveRoundResponse {
  success: boolean;
  hasActiveRound: boolean;
  round: Round | null;
}
```

---

## 🎯 Frontend Implementation Checklist

### Ekrany do zaimplementowania:

1. **Ekran startowy**
   - Input: username
   - Button: "Rozpocznij grę" → `POST /api/session/create`

2. **Główny ekran gry**
   - Wyświetl: balance, level, XP
   - Wybór portalu (EASY/MEDIUM/HARD)
   - Wybór zakładu
   - Button: "Wejdź do portalu" → `POST /api/round/start`

3. **Ekran decyzji (po wygranej)**
   - Pokaż: aktualny event, wygrana, mnożnik
   - Pokaż: `nextEventDifficulty` (szansa na kolejną wygraną)
   - Pokaż: `potentialLoss` (ile stracisz jeśli przegrasz)
   - Button: "RYZYKUJ" → `POST /api/round/continue`
   - Button: "WYPŁAĆ" → `POST /api/round/cashout`

4. **Animacja wyniku**
   - WYGRANA: efekty, update winnings
   - PRZEGRANA: dramatyczna animacja straty
   - CASHOUT: celebracja wygranej

5. **Panel statystyk**
   - `GET /api/session/:id/rounds` → wyświetl `stats`
   - Historia rund z eventami

### Stan aplikacji (React/Vue/etc):

```typescript
interface GameState {
  sessionId: string | null;
  playerId: string | null;
  character: Character | null;
  balance: number;
  
  // UI state
  selectedPortal: PortalDifficulty;
  selectedBet: number;
  isSpinning: boolean;
  
  // Active round (multi-event)
  activeRound: Round | null;
  lastEvent: RoundEvent | null;
  
  // Decision state
  showDecisionModal: boolean;  // czy pokazać CONTINUE/CASHOUT
  
  // Historia
  roundHistory: RoundSummary[];
  sessionStats: RoundHistory['stats'] | null;
}
```

---

## 🔄 Przykładowy flow w React

```typescript
// 1. Start gry
const startGame = async (username: string) => {
  const res = await fetch('/api/session/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, characterName: 'Wanderer' })
  });
  const data = await res.json();
  
  setSessionId(data.sessionId);
  setCharacter(data.character);
  setBalance(data.balance);
};

// 2. Rozpocznij rundę
const startRound = async () => {
  setIsSpinning(true);
  
  const res = await fetch('/api/round/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      portalDifficulty: selectedPortal,
      betAmount: selectedBet
    })
  });
  const data: RoundStartResponse = await res.json();
  
  setActiveRound(data.round);
  setLastEvent(data.lastEvent);
  setBalance(data.session.balance);
  
  // Animacja eventu
  await playEventAnimation(data.lastEvent);
  
  if (data.round.status === 'IN_PROGRESS') {
    // Wygrana! Pokaż modal decyzji
    setShowDecisionModal(true);
  } else {
    // Przegrana - koniec rundy
    await playLossAnimation();
  }
  
  setIsSpinning(false);
};

// 3. Kontynuuj (ryzykuj)
const continueRound = async () => {
  setShowDecisionModal(false);
  setIsSpinning(true);
  
  const res = await fetch('/api/round/continue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
  const data: RoundContinueResponse = await res.json();
  
  setActiveRound(data.round);
  setLastEvent(data.lastEvent);
  
  await playEventAnimation(data.lastEvent);
  
  if (data.round.status === 'IN_PROGRESS') {
    setShowDecisionModal(true);
  } else if (data.round.status === 'LOST') {
    // Przegrał wszystko!
    await playBigLossAnimation();
    setBalance(data.session.balance);
  }
  
  setIsSpinning(false);
};

// 4. Wypłać
const cashOut = async () => {
  setShowDecisionModal(false);
  
  const res = await fetch('/api/round/cashout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });
  const data: RoundCashoutResponse = await res.json();
  
  setActiveRound(data.round);
  setBalance(data.session.balance);
  
  // Celebracja!
  await playCashoutAnimation(data.round.accumulatedWinnings);
};

// 5. Sprawdź aktywną rundę (np. po refreshu)
const checkActiveRound = async () => {
  const res = await fetch(`/api/round/active/${sessionId}`);
  const data: ActiveRoundResponse = await res.json();
  
  if (data.hasActiveRound) {
    setActiveRound(data.round);
    setShowDecisionModal(true);
  }
};
```

---

## ⚠️ Ważne uwagi

1. **Session ID** - przechowuj w localStorage, potrzebny do wszystkich requestów
2. **Aktywna runda** - gracz może mieć tylko JEDNĄ aktywną rundę na raz
3. **Decyzja gracza** - po każdej wygranej MUSISZ pokazać wybór CONTINUE/CASHOUT
4. **Potential Loss** - zawsze pokazuj ile gracz straci jeśli przegra
5. **Next Event Difficulty** - pokazuj % szans na kolejną wygraną
6. **Status rundy**:
   - `IN_PROGRESS` - runda trwa, czeka na decyzję
   - `LOST` - przegrana, wszystko stracone
   - `CASHED_OUT` - gracz wypłacił wygrane
   - `WON` - auto-cashout po max eventach

---

## 🧪 Testowanie

```bash
# Health check
curl http://localhost:3000/api/health

# Utwórz sesję
curl -X POST http://localhost:3000/api/session/create \
  -H "Content-Type: application/json" \
  -d '{"characterName": "Wanderer"}'

# Zapisz sessionId, np:
SID="your-session-id"

# Rozpocznij rundę
curl -X POST http://localhost:3000/api/round/start \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SID\", \"portalDifficulty\": \"EASY\", \"betAmount\": 100}"

# Jeśli wygrana - kontynuuj lub wypłać:
curl -X POST http://localhost:3000/api/round/continue \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SID\"}"

curl -X POST http://localhost:3000/api/round/cashout \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SID\"}"

# Sprawdź aktywną rundę
curl http://localhost:3000/api/round/active/$SID

# Historia rund
curl http://localhost:3000/api/session/$SID/rounds

# Konfiguracja trudności
curl http://localhost:3000/api/round/config/EASY
curl http://localhost:3000/api/round/config/HARD
```

---

## 📁 Struktura plików backendu (reference)

```
src/
├── routes/
│   └── api.ts              # Wszystkie endpointy
├── services/
│   ├── SessionService.ts   # Zarządzanie sesjami
│   ├── RoundService.ts     # Logika rund (multi-event)
│   ├── PortalService.ts    # Portale
│   ├── BackgroundService.ts
│   ├── EventService.ts
│   ├── RewardService.ts
│   ├── CharacterService.ts
│   └── RNGService.ts       # Generator losowy
├── types/
│   ├── enums/              # PortalDifficulty, EventType, etc.
│   └── interfaces/         # IRound, IRoundEvent, etc.
└── config/
    └── gameEconomy.ts      # Konfiguracja gry
```
