# Wordle Arena — Frontend-to-Backend Contract Specification

**Document Version:** 1.0 (Final Built Frontend)
**Purpose:** This document details the exact REST API contract, payloads, and behaviors the **implemented Frontend application** relies on. Any backend powering this frontend MUST adhere strictly to the endpoints, DTOs, and logic outlined here.

---

## 1. Global Architecture & Networking

- **Base URL:** The frontend makes all API requests to `http://localhost:8080/api` (configurable via `NEXT_PUBLIC_API_BASE_URL`).
- **CORS:** The backend MUST allow `http://localhost:3000` (or `*` during development). Allowed headers must include `Authorization` and `Content-Type`. Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`.
- **Authentication:** 
  - JWT Bearer tokens only. No cookies. No sessions.
  - The frontend attaches `Authorization: Bearer <token>` to all requests except `/api/auth/register` and `/api/auth/login`.
  - The frontend expects `401 Unauthorized` when a token is missing, invalid, or expired. On `401`, the frontend drops the local session and hard-redirects to `/login`.
- **Content Type:** All requests and responses are strictly `application/json`.
- **Pagination:** None. Endpoints returning lists (Leaderboard, Games History) expect the complete array in a single response.

---

## 2. Shared Domain Enums & Interfaces

The frontend strictly expects these exact string values:

**Game Status Enum (`GameStatus`)**
```typescript
type GameStatus = 'IN_PROGRESS' | 'WON' | 'LOST' | 'ABANDONED';
```

**Arena Match Status Enum (`ArenaMatchStatus`)**
```typescript
type ArenaMatchStatus = 'WAITING' | 'IN_PROGRESS' | 'PLAYER1_WON' | 'PLAYER2_WON' | 'DRAW' | 'CANCELLED';
```

**Game Type Enum (`GameType`)**
```typescript
type GameType = 'DAILY' | 'PRACTICE' | 'ARENA';
```

**Letter Result Enum (`LetterResult`)**
```typescript
type LetterResult = 'CORRECT' | 'PRESENT' | 'ABSENT';
```

---

## 3. Error Handling Contract

The frontend intercepts HTTP errors globally. 
- **Standard Error Format:** The frontend attempts to parse the response body as `{ message: string }`. If present, it shows this message to the user.
- **409 Conflict:** Specifically for Arena Match guesses. If the frontend receives a `409 Conflict`, it treats it as a `ConcurrentModificationError`, triggers a match refresh, and prompts the user to manually retry their guess.

---

## 4. Authentication API

### 4.1 Register
- **Endpoint:** `POST /api/auth/register`
- **Request Body:** `{ username: "string", password: "string" }`
- **Response Body:**
  ```json
  {
    "token": "jwt.token.string",
    "user": {
      "id": 1,
      "username": "string",
      "rating": 1200
    }
  }
  ```

### 4.2 Login
- **Endpoint:** `POST /api/auth/login`
- **Request Body:** `{ username: "string", password: "string" }`
- **Response Body:** Same as Register.

---

## 5. Users API

### 5.1 Get Current User
- **Endpoint:** `GET /api/users/me`
- **Response Body:**
  ```json
  {
    "id": 1,
    "username": "string",
    "rating": 1200
  }
  ```

---

## 6. Daily Challenge API

### 6.1 Get Today's Daily Game
- **Endpoint:** `GET /api/daily`
- **Behavior:** Returns the current user's daily game for today. If one does not exist, the backend MUST create it and return it.
- **Response Body:**
  ```json
  {
    "id": 1,
    "userId": 1,
    "gameType": "DAILY",
    "status": "IN_PROGRESS",
    "attemptCount": 0,
    "startedAt": "2023-10-01T12:00:00Z",
    "endedAt": null
  }
  ```

### 6.2 Submit Daily Guess
- **Endpoint:** `POST /api/daily/guesses`
- **Request Body:** `{ guess: "string" }` (Must be exactly 5 letters).
- **Response Body:**
  ```json
  {
    "guess": "string",
    "result": ["CORRECT", "ABSENT", "PRESENT", "ABSENT", "CORRECT"],
    "gameStatus": "IN_PROGRESS" // or WON / LOST
  }
  ```

### 6.3 Get Daily Game Details (History)
- **Endpoint:** `GET /api/daily/details`
- **Behavior:** Returns the user's past guesses for today's daily game. Used to hydrate the board upon page reload.
- **Response Body:**
  ```json
  {
    "gameId": 1,
    "status": "IN_PROGRESS",
    "guesses": [
      {
        "guess": "string",
        "result": ["ABSENT", "ABSENT", "ABSENT", "ABSENT", "ABSENT"],
        "gameStatus": "IN_PROGRESS"
      }
    ]
  }
  ```

---

## 7. Practice Mode (Games API)

### 7.1 Start Practice Game
- **Endpoint:** `POST /api/games`
- **Request Body:** `{ gameType: "PRACTICE" }`
- **Response Body:** Same as 6.1 (Game Response).

### 7.2 Submit Practice Guess
- **Endpoint:** `POST /api/games/{id}/guesses`
- **Request Body:** `{ guess: "string" }`
- **Response Body:** Same as 6.2 (Guess Response).

### 7.3 Abandon Practice Game
- **Endpoint:** `POST /api/games/{id}/abandon`
- **Response Body:** Same as 6.1 (Game Response), but with `status: "ABANDONED"`.

### 7.4 Get Game History
- **Endpoint:** `GET /api/games`
- **Behavior:** Returns ALL past games (Daily and Practice) for the user. Excludes Arena matches.
- **Response Body:** Array of Game Responses (6.1).

### 7.5 Get Specific Game
- **Endpoint:** `GET /api/games/{id}`
- **Behavior:** Returns a game with its full guess history.
- **Response Body:**
  ```json
  {
    "gameId": 1,
    "status": "WON",
    "guesses": [ ... ]
  }
  ```

---

## 8. Arena Mode API (1v1)

### 8.1 Find or Create Match (Matchmaking)
- **Endpoint:** `POST /api/arena/matchmake`
- **Behavior:** Joins an existing `WAITING` match or creates a new one.
- **Response Body:**
  ```json
  {
    "id": 1,
    "player1": "user1",
    "player2": "user2", // null if WAITING
    "status": "WAITING",
    "player1Attempts": 0,
    "player2Attempts": 0,
    "startedAt": "2023-10-01T12:00:00Z",
    "endedAt": null
  }
  ```

### 8.2 Cancel Match Search
- **Endpoint:** `POST /api/arena/{id}/cancel`
- **Behavior:** Cancels a `WAITING` match.
- **Response Body:** Empty (`200 OK`).

### 8.3 Get Match State (Polling)
- **Endpoint:** `GET /api/arena/{id}`
- **Behavior:** The frontend polls this every **3 seconds** while `WAITING` and every **4 seconds** while `IN_PROGRESS`.
- **Response Body:** Same as 8.1 (Arena Match Response).

### 8.4 Get Match Details (Guesses)
- **Endpoint:** `GET /api/arena/{id}/details`
- **Behavior:** The frontend fetches this to sync the board state and render opponent guesses.
- **Response Body:**
  ```json
  {
    "matchId": 1,
    "status": "IN_PROGRESS",
    "player1Guesses": [
      {
        "guess": "words",
        "result": ["ABSENT", ...],
        "attemptNumber": 1
      }
    ],
    "player2Guesses": []
  }
  ```

### 8.5 Submit Arena Guess
- **Endpoint:** `POST /api/arena/{id}/guesses`
- **Behavior:** Expects Optimistic Locking on the backend. If two players guess at the exact same millisecond, the backend must throw a `409 Conflict`.
- **Request Body:** `{ guess: "string" }`
- **Response Body:**
  ```json
  {
    "matchId": 1,
    "guess": "string",
    "result": ["ABSENT", ...],
    "attemptNumber": 1,
    "matchStatus": "IN_PROGRESS"
  }
  ```

---

## 9. Stats & Leaderboard API

### 9.1 Get User Stats
- **Endpoint:** `GET /api/stats`
- **Response Body:**
  ```json
  {
    "userId": 1,
    "gamesPlayed": 10,
    "wins": 8,
    "losses": 2,
    "winRate": 80.0,
    "currentStreak": 3,
    "bestStreak": 5,
    "guessDistribution": {
      "1": 0, "2": 1, "3": 4, "4": 2, "5": 1, "6": 0
    }
  }
  ```
- **Note:** `guessDistribution` must have keys "1" through "6" representing the attempt number.

### 9.2 Get Leaderboard
- **Endpoint:** `GET /api/leaderboard`
- **Behavior:** Returns top players sorted by rating descending.
- **Response Body:**
  ```json
  [
    {
      "username": "string",
      "rating": 1500,
      "gamesPlayed": 20,
      "winRate": 90.5
    }
  ]
  ```

### 9.3 Get My Rank
- **Endpoint:** `GET /api/leaderboard/me`
- **Response Body:**
  ```json
  {
    "rank": 42
  }
  ```
