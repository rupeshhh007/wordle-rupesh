# 🟩 Wordle Arena — Real-Time Competitive Multiplayer Platform

<p align="center">
  <a href="https://wordle-arena-two.vercel.app/"><strong>Explore the Live Platform »</strong></a>
  <br />
  <br />
  <a href="https://wordle-arena-two.vercel.app/"><img src="https://img.shields.io/badge/Live%20Demo-Vercel-success?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  <a href="https://wordle-arena-api.onrender.com"><img src="https://img.shields.io/badge/Backend%20API-Render-blue?style=for-the-badge&logo=render&logoColor=white" alt="Backend API" /></a>
  <img src="https://img.shields.io/badge/Java%2021-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 21" />
  <img src="https://img.shields.io/badge/Spring%20Boot%203-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 📌 Overview

**Wordle Arena** is a full-stack, competitive multiplayer adaptation of the classic Wordle puzzle. Unlike standalone single-player implementations, Wordle Arena brings real-time 1v1 competitive duels, Elo-based matchmaking, automated rank progressions, and persistent global leaderboards.

The application is architected with an enterprise-ready **Java 21 + Spring Boot** modular backend and a high-performance **Next.js (App Router) + TypeScript** frontend styled with a modern **Neobrutalist design system**.

---

## ✨ Core Features

### ⚔️ Competitive 1v1 Arena Mode
- **Turn-Based Matchmaking**: Automatic queue pairing players into private synchronized match lobbies.
- **Strict State Lifecycle**: Managed through a resilient state machine (`WAITING` ➔ `IN_PROGRESS` ➔ `PLAYER1_WON` / `PLAYER2_WON` / `DRAW` / `ABANDONED`).
- **Real-Time Opponent Tracking**: View your opponent's row-by-row progress and remaining attempts live without exposing the target solution.
- **Lobby Expiry & Forfeiture**: Automatic cleanup of stale queues (180s lobby timeout) and clean surrender/forfeit mechanisms.

### 🏆 Elo Rating Engine & Global Leaderboards
- **Dynamic Skill Adjustment**: Post-match Elo rating updates calculated mathematically based on player rating differentials.
- **Global Leaderboard**: Live rankings ordered by competitive rating, showcasing player records, win rates, and matches played.

### 🧩 Practice Mode & Daily Challenges
- **Solo Practice**: Unlimited games against a dictionary of 2,300+ validated 5-letter words.
- **Daily Challenge**: A globally synchronized daily puzzle seeded deterministically for all players each UTC day.

### 🎨 Neobrutalist UI/UX
- High-contrast visual identity featuring bold borders (`#1A1A2E`), aggressive drop shadows (`shadow-brutal`), and signature yellow accents (`#FFD93D`).
- Deterministic robot avatar generation via DiceBear based on player usernames.
- Ergonomic on-screen keyboard displaying real-time letter evaluation states (Absent, Present, Correct).

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────┐
                                  │   Next.js (Vercel)     │
                                  │  Tailwind CSS v4 + TS  │
                                  └───────────┬────────────┘
                                              │
                                              │ HTTPS / JSON (JWT)
                                              ▼
                                  ┌────────────────────────┐
                                  │   Spring Boot 3 API    │
                                  │    (Render / Java 21)  │
                                  ├────────────────────────┤
                                  │ • Spring Security      │
                                  │ • Concurrency Manager  │
                                  │ • Elo Rating Engine    │
                                  │ • Wordle Evaluator     │
                                  └───────────┬────────────┘
                                              │
                                              │ JPA / HikariCP
                                              ▼
                                  ┌────────────────────────┐
                                  │   PostgreSQL Database  │
                                  │ (Users, Matches, Words)│
                                  └────────────────────────┘
```

---

## 🧠 Engineering Highlights

### 1. Duplicate-Safe Letter Evaluation
Wordle word evaluation requires strict precedence to prevent multi-instance false positives (e.g., guessing `SPEED` when the answer is `CREEP`).
- **Pass 1 (Green/Correct)**: Direct positional matches are marked `CORRECT` and their target letter frequencies are decremented.
- **Pass 2 (Yellow/Present)**: Remaining letters are evaluated against remaining available counts; any excess occurrences are strictly marked `ABSENT`.

### 2. State & Concurrency Protection
To prevent duplicate submissions, replay attacks, or race conditions:
- Guess submissions validate match status, active player authorization, and attempt limits ($N \le 6$) inside transactional boundaries (`@Transactional`).
- Terminal states immediately seal the match, preventing subsequent attempts from modifying outcomes or triggering duplicate Elo calculations.

### 3. Production Container Optimization
- The backend is packaged into a **multi-stage Docker container** running Eclipse Temurin Java 21 on Alpine Linux.
- Configured with container-aware JVM flags:
  ```bash
  -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -Xss512k
  ```
  This allows the Spring Boot application to cold-boot in under 12 seconds and run reliably within Render's free-tier 512MB RAM budget.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 21, Spring Boot 3, Spring Data JPA, Spring Security, Hibernate |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand |
| **Database** | PostgreSQL, HikariCP Connection Pooling |
| **Authentication**| Stateless JWT (JSON Web Tokens) with custom entry point filters |
| **DevOps & Hosting** | Docker, Docker Compose, Render (Backend API), Vercel (Client App) |

---

## 🔌 API Reference

### Authentication
- `POST /api/auth/register` — Register a new player account.
- `POST /api/auth/login` — Authenticate and receive a signed JWT token.
- `GET /api/auth/me` — Retrieve current authenticated profile & rating.

### Arena (Multiplayer)
- `POST /api/arena/match` — Enter matchmaking or join a waiting match.
- `GET /api/arena/active` — Check for an ongoing active match.
- `GET /api/arena/{id}` — Fetch match status and participant information.
- `GET /api/arena/{id}/details` — Fetch full guess history and board states.
- `POST /api/arena/{id}/guesses` — Submit a 5-letter word guess.
- `POST /api/arena/{id}/forfeit` — Concede an active match.
- `POST /api/arena/{id}/cancel` — Cancel an open matchmaking request.

### Solo & Leaderboard
- `POST /api/game/guess` — Submit guess for single-player practice / daily puzzle.
- `GET /api/leaderboard` — Fetch top-ranked players by competitive rating.

---

## 🚀 Local Development Setup

### Prerequisites
- **Java 21 SDK**
- **Node.js 20+** & **npm**
- **PostgreSQL** or **Docker**

### Option A: Running with Docker Compose (Recommended)
You can boot the entire multi-tier stack with one command:
```bash
# Clone the repository
git clone https://github.com/rupeshhh007/wordle-rupesh.git
cd wordle-rupesh

# Start Database, Backend, and Frontend containers
docker compose up --build
```
- Frontend will be available at `http://localhost:3000`
- Backend API will be available at `http://localhost:8080`

---

### Option B: Running Manually

#### 1. Backend Setup
```bash
cd wordle-arena

# Configure database credentials in src/main/resources/application.properties or via ENV:
export DB_URL=jdbc:postgresql://localhost:5432/wordledb
export DB_USERNAME=postgres
export DB_PASSWORD=yourpassword
export JWT_SECRET=your_super_secret_jwt_key_at_least_64_bytes_long

# Run Spring Boot
./mvnw spring-boot:run
```

#### 2. Frontend Setup
```bash
cd wordle-frontend

# Install dependencies
npm install

# Point to local backend
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# Run Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 👨‍💻 Author

**Rupesh Tripathi**
- **LinkedIn**: [rupesh-tripathi](https://linkedin.com/in/rupesh-tripathi-b62583328)
- **GitHub**: [@rupeshhh007](https://github.com/rupeshhh007)
- **LeetCode**: [@rupeshhh007](https://leetcode.com/u/rupeshhh007/)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
