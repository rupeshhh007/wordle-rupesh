# Wordle Arena — Frontend Implementation Report

This document outlines the final, built state of the Wordle Arena frontend. It certifies that the implemented frontend precisely maps to the documented, frozen backend contract.

## 1. Stack & Architecture
- **Framework**: Next.js 16.3.4 (App Router)
- **Styling**: Tailwind CSS v4 using inline `@theme` and native CSS features
- **State Management**: Zustand (for persisted auth) and local `useState` (for isolated component state)
- **Networking**: native `fetch` via a centralized `client.ts` wrapper with JWT auto-attachment

## 2. Authentication Flow
- Implemented `/login` and `/register` pages parsing `AuthResponse`.
- JWT token is persisted in `localStorage` under the `"wordle-auth"` Zustand persist key.
- Root layout/client component verifies `isHydrated`.
- If 401 is received, local storage is cleared, and user is hard-redirected via `window.location.href = "/login"`. No automatic refresh exists, per the frozen backend.

## 3. UI/UX & Neobrutalism
- Achieved the requested Neobrutalist design with deep drop shadows (`4px 4px 0px var(--color-border)`), thick borders (`3px`), and bold pastel accents (Yellow, Pink, Green, Blue).
- Added satisfying, snappy CSS animations: `bounce-in` for modals and results, `tile-flip` for reveals, `tile-pop` for entering letters, and `tile-shake` for errors.
- Adhered strictly to `prefers-reduced-motion` to disable animations for accessibility.

## 4. Game Modes Implementation
- **Daily Mode**: 
  - Hits `GET /api/daily` to check status and `GET /api/daily/details` if game is active.
  - Submits guesses via `POST /api/daily/guesses`.
  - Renders streaks immediately upon winning or losing.
- **Practice Mode**: 
  - Allows infinite practice games via `POST /api/games`.
  - Includes a custom "Abandon" modal calling `POST /api/games/{id}/abandon`.
- **Arena Mode (1v1)**: 
  - Implements lobby polling (every 3s) for `WAITING` -> `IN_PROGRESS` transition.
  - Implements match polling (every 4s) during `IN_PROGRESS` to fetch opponent updates.
  - Correctly intercepts `409 Conflict` (ConcurrentModificationError) and refreshes match state.
  - Dynamically displays rating updates in the final results screen.

## 5. Keyboard & Input State
- Created a robust custom hook `useGameInput` to safely handle both physical keyboard strokes and on-screen clicks.
- Built a unified `updateKeyboardState` algorithm prioritizing `CORRECT` > `PRESENT` > `ABSENT` > `undefined`.

## 6. Types & Interfaces
- A unified `src/types/api.ts` file mirrors the backend DTOs EXACTLY.
- A normalized `BoardGuess` type bridges the gap between different backend Guess DTOs (`GuessResponse` vs `ArenaGuessHistoryResponse`) so a single `<GameBoard />` component can render them all.

## 7. Leaderboard & Stats
- Real-time leaderboard table mapping `rank`, `username`, `rating`, `winRate`, and `totalGames`.
- Dashboard and Stats pages parse the `guessDistribution` maps perfectly to render bar charts using CSS grid/flex widths.

**Conclusion**: The frontend has been cleanly orchestrated and typed to match the backend specification, and has successfully passed standard lint and type build checks.
