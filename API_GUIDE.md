# 🎮 Echoes of Realms - API Guide dla Frontendu

## 📍 Base URL
- **Development:** `http://localhost:3000/api`
- **Production:** `https://your-app.railway.app/api`

---

## 🔄 Flow gry - kolejność wywołań

```
1. createSession     → Rozpocznij grę, zapisz sessionId
       ↓
2. getBalance        → Sprawdź ile masz złota
       ↓
3. getPortals        → Pobierz dostępne portale (opcjonalne)
       ↓
4. enterPortal       → SPIN! (powtarzaj wielokrotnie)
       ↓
5. getLeaderboard    → Pokaż ranking (opcjonalne)
       ↓
6. endSession        → Zakończ grę
```

---

## 📚 Endpointy API

### 1️⃣ Utworzenie sesji (START GRY)

**Wywołaj na początku gry. Zapisz `sessionId` - potrzebujesz go do wszystkiego!**

```http
POST /api/session/create
Content-Type: application/json

{
  "username": "Jan123",
  "characterName": "Ciri"
}
```

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `username` | string | ❌ | Nazwa gracza. Jeśli puste = `Gracz_timestamp` |
| `characterName` | string | ❌ | Nazwa postaci. Jeśli puste = `Cirilla` |

**Response:**
```json
{
  "success": true,
  "sessionId": "f199bcd2-3354-4298-87fb-ed47dee97766",
  "playerId": "54c0463a-9819-4eef-afca-21eed6a60a19",
  "character": {
    "id": "54c0463a-9819-4eef-afca-21eed6a60a19",
    "name": "Ciri",
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
  "balance": 1000,
  "message": "Sesja utworzona pomyślnie (z MongoDB)"
}
```

⭐ **WAŻNE:** Zapisz `sessionId` w state aplikacji!

---

### 2️⃣ Sprawdzenie salda

```http
GET /api/session/{sessionId}/balance
```

**Response:**
```json
{
  "success": true,
  "balance": 1000,
  "minBet": 10,
  "maxBet": 5000,
  "betOptions": [10, 25, 50, 100, 250, 500, 1000],
  "canPlay": true
}
```

---

### 3️⃣ Pobranie listy portali (opcjonalne)

```http
GET /api/portals
```

**Response:**
```json
{
  "success": true,
  "portals": [
    {
      "id": "portal_easy_1",
      "difficulty": "EASY",
      "name": "Wrota Świtu",
      "description": "Spokojny portal dla początkujących...",
      "baseRTP": 0.96,
      "minBet": 10,
      "maxBet": 1000,
      "unlockLevel": 1
    },
    {
      "id": "portal_medium_1",
      "difficulty": "MEDIUM",
      "name": "Wrota Zmierzchu",
      "baseRTP": 0.94,
      "unlockLevel": 5
    },
    {
      "id": "portal_hard_1",
      "difficulty": "HARD",
      "name": "Wrota Chaosu",
      "baseRTP": 0.92,
      "unlockLevel": 10
    }
  ]
}
```

---

### 4️⃣ SPIN - Wejście do portalu (GŁÓWNA MECHANIKA)

**To jest główna akcja gry - "spin" w portalu.**

```http
POST /api/portals/enter
Content-Type: application/json

{
  "sessionId": "f199bcd2-3354-4298-87fb-ed47dee97766",
  "portalDifficulty": "EASY",
  "betAmount": 50
}
```

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `sessionId` | string | ✅ | ID sesji z kroku 1 |
| `portalDifficulty` | string | ✅ | `"EASY"`, `"MEDIUM"` lub `"HARD"` |
| `betAmount` | number | ✅ | Stawka (10-5000, musi być ≤ balance) |

**Response (wygrana):**
```json
{
  "success": true,
  "balance": 1150,
  "betAmount": 50,
  "winAmount": 200,
  "netResult": 150,
  "result": {
    "portal": {
      "id": "portal_easy_1",
      "difficulty": "EASY",
      "name": "Wrota Świtu"
    },
    "background": {
      "background": {
        "id": "easy_bg_1",
        "name": "Zaczarowany Las",
        "description": "Spokojny las pełen świetlików..."
      },
      "activeFilters": ["MAGIC_GLOW"],
      "combinedModifier": 1.05
    },
    "event": {
      "type": "CHEST",
      "name": "Skrzynia Skarbów",
      "description": "Znalazłeś starożytną skrzynię..."
    },
    "rewards": {
      "rewards": [
        {
          "type": "GOLD",
          "amount": 200,
          "source": "CHEST"
        }
      ],
      "totalValue": 200
    },
    "characterUpdate": {
      "experienceGained": 30,
      "levelUp": false
    }
  },
  "rewardReport": {
    "summary": "Wygrałeś 200 złota!",
    "isWin": true,
    "winTier": "medium"
  },
  "savedToDb": true
}
```

**Response (przegrana):**
```json
{
  "success": true,
  "balance": 950,
  "betAmount": 50,
  "winAmount": 0,
  "netResult": -50,
  "result": {
    "event": {
      "type": "LAMP",
      "name": "Magiczna Lampa"
    },
    "rewards": {
      "rewards": [],
      "totalValue": 0
    }
  },
  "rewardReport": {
    "summary": "Brak nagród",
    "isWin": false,
    "winTier": "none"
  }
}
```

**Możliwe błędy:**
```json
{
  "success": false,
  "error": "Niewystarczające saldo. Aktualne: 30, wymagane: 50",
  "currentBalance": 30
}
```

---

### 5️⃣ Pobranie rankingu

```http
GET /api/leaderboard?limit=10&category=level
```

| Parametr | Typ | Domyślnie | Opis |
|----------|-----|-----------|------|
| `limit` | number | 10 | Liczba wyników |
| `category` | string | `level` | `level`, `gold`, `biggestWin`, `winRate` |

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "username": "ProGamer",
      "characterName": "Ciri",
      "level": 15,
      "totalGoldWon": 50000,
      "biggestWin": 5000
    },
    {
      "username": "Jan123",
      "characterName": "Ciri",
      "level": 3,
      "totalGoldWon": 2500,
      "biggestWin": 1444
    }
  ],
  "source": "mongodb",
  "category": "level"
}
```

---

### 6️⃣ Zakończenie sesji

```http
POST /api/session/{sessionId}/end
```

**Response:**
```json
{
  "success": true,
  "finalStats": {
    "totalSpins": 25,
    "totalWinnings": 3500,
    "sessionDuration": 1800000,
    "biggestWin": 1444
  },
  "character": {
    "name": "Ciri",
    "level": 3,
    "experience": 250
  },
  "message": "Sesja zakończona (zsynchronizowano z MongoDB)"
}
```

---

## 🔧 Dodatkowe endpointy

### Profil postaci
```http
GET /api/character/{sessionId}
```

### Konfiguracja ekonomii
```http
GET /api/economy/config
```

### Health check
```http
GET /api/health
```

---

## ⚠️ Obsługa błędów

Wszystkie błędy mają format:
```json
{
  "success": false,
  "error": "Opis błędu"
}
```

| Kod HTTP | Znaczenie |
|----------|-----------|
| 200 | Sukces |
| 400 | Błąd walidacji (np. za mało złota) |
| 404 | Nie znaleziono (np. zła sesja) |
| 500 | Błąd serwera |

---

## 💡 Przykład implementacji w React

```typescript
import { useState, useEffect } from 'react';

const API_URL = 'https://your-app.railway.app/api';

function Game() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  // 1. Start gry
  const startGame = async (username: string) => {
    const res = await fetch(`${API_URL}/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, characterName: 'Ciri' })
    });
    const data = await res.json();
    
    if (data.success) {
      setSessionId(data.sessionId);
      setBalance(data.balance);
    }
  };

  // 2. Spin
  const spin = async (bet: number) => {
    if (!sessionId || isSpinning) return;
    
    setIsSpinning(true);
    const res = await fetch(`${API_URL}/portals/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        portalDifficulty: 'EASY',
        betAmount: bet
      })
    });
    const data = await res.json();
    
    if (data.success) {
      setBalance(data.balance);
      // Pokaż animację wygranej/przegranej
      // data.winAmount, data.result.event, data.result.background
    }
    setIsSpinning(false);
  };

  return (
    <div>
      <p>Saldo: {balance} złota</p>
      <button onClick={() => spin(50)} disabled={isSpinning || balance < 50}>
        SPIN (50 złota)
      </button>
    </div>
  );
}
```

---

## 📊 Typy eventów w grze

| Event | Opis | Szansa |
|-------|------|--------|
| `CHEST` | Skrzynia Skarbów | ~30% |
| `LAMP` | Magiczna Lampa | ~25% |
| `BOOK` | Księga Zaklęć | ~25% |
| `DIAMONDS` | Diamenty | ~20% |

---

## 🎯 Poziomy trudności

| Portal | RTP | Min Bet | Max Bet | Unlock |
|--------|-----|---------|---------|--------|
| EASY | 96% | 10 | 1000 | Level 1 |
| MEDIUM | 94% | 25 | 2500 | Level 5 |
| HARD | 92% | 50 | 5000 | Level 10 |

---

## 🔗 Przydatne linki

- **Backend repo:** https://github.com/Vejmal/BFGameJamBackend2025
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Railway Dashboard:** https://railway.app
