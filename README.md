# Wordle Arena

<p align="center">
  <strong>A full-stack Wordle platform with daily puzzles, practice games, live 1v1 arena duels, private challenges, Elo ratings, leaderboards, and a bold neobrutalist interface.</strong>
</p>

<p align="center">
  <a href="https://wordle-arena-two.vercel.app/"><strong>Live App</strong></a>
  ·
  <a href="https://wordle-arena-api.onrender.com"><strong>Backend API</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 21" />
  <img src="https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot 4.1.1" />
  <img src="https://img.shields.io/badge/Next.js-16.3.4-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 16.3.4" />
  <img src="https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=111111" alt="React 19.2.8" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Ready" />
</p>

---

## Screenshots

A look at the live Wordle Arena interface — the dashboard and daily puzzle.

<table>
  <tr>
    <td width="50%" align="center">
      <a href="https://github.com/user-attachments/assets/663042d0-0b01-4f41-b533-c642dcbdd6c2">
        <img src="https://github.com/user-attachments/assets/663042d0-0b01-4f41-b533-c642dcbdd6c2" alt="Wordle Arena dashboard screenshot" width="100%" />
      </a>
      <br />
      <sub><strong>Dashboard</strong> — game modes and player overview</sub>
    </td>
    <td width="50%" align="center">
      <a href="https://github.com/user-attachments/assets/1ac4f804-647c-4b80-893b-6817d7cb81ae">
        <img src="https://github.com/user-attachments/assets/1ac4f804-647c-4b80-893b-6817d7cb81ae" alt="Wordle Arena daily puzzle screenshot" width="100%" />
      </a>
      <br />
      <sub><strong>Daily challenge</strong> — five-letter puzzle board</sub>
    </td>
  </tr>
</table>

<sub>Images originally shared in the <a href="https://github.com/rupeshhh007/rupeshhh007#-wordle-with-a-competitive-streak">GitHub profile README</a>.</sub>

---

## Overview

Wordle Arena turns the familiar five-letter puzzle loop into a competitive web app. Players can train in practice mode, solve a shared daily puzzle, challenge friends in private rooms, queue into live arena matches, spectate active duels, track personal stats, and climb an Elo-powered leaderboard.

The project is split into two deployable apps:

| App | Path | Role |
| --- | --- | --- |
| Backend | `wordle-arena/` | Java 21 Spring Boot API with JWT auth, JPA persistence, WebSocket events, game logic, ratings, stats, and leaderboards |
| Frontend | `wordle-frontend/` | Next.js App Router UI with TypeScript, React 19, Tailwind CSS v4, Zustand auth state, and STOMP WebSocket subscriptions |

---

## What It Does

### Game Modes

- **Daily Challenge**: one shared daily word for all players, selected deterministically by date.
- **Practice Mode**: unlimited solo games using the active word dictionary.
- **Arena 1v1**: live competitive matches with shared answers, hidden opponent guesses, attempt tracking, forfeits, rematches, and result events.
- **Private Rooms**: invite-code rooms for friend matches.
- **Direct Challenges**: challenge a specific user and notify them in real time.
- **Spectator Mode**: watch active public arena matches without revealing hidden information too early.

### Player Systems

- JWT-based registration, login, and authenticated profile loading.
- Public user profiles with player stats.
- Global leaderboard ordered by competitive rating.
- Personal history across practice, daily, and arena games.
- Presence tracking for online/offline status.
- Elo-style rating updates with safeguards against duplicate rating application.

### UI Style

- Neobrutalist visual system with thick borders, hard shadows, stamped labels, tactile cards, visible state colors, and grid-paper texture.
- Responsive authenticated shell with sidebar and mobile navigation.
- Wordle keyboard and tiles with result-aware colors.
- Dashboard mode cards, stat panels, loading states, modals, and challenge notifications.

---

## Architecture

```text
┌────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                         │
│  App Router · React 19 · TypeScript · Tailwind v4 · Zustand      │
└───────────────────────────────┬────────────────────────────────┘
                                │
                         HTTPS JSON + JWT
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                       Spring Boot Backend                       │
│ Auth · Games · Daily · Arena · Stats · Leaderboard · WebSocket   │
└───────────────────────────────┬────────────────────────────────┘
                                │
                         JPA / Hibernate
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                         PostgreSQL                             │
│ Users · Words · Games · Guesses · Arena Matches · Arena Guesses  │
└────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16.3.4, React 19.2.8, TypeScript, Tailwind CSS v4 |
| Client State | Zustand |
| Realtime Client | `@stomp/stompjs` |
| UI Icons | Lucide React |
| Backend | Java 21, Spring Boot 4.1.1 |
| API & Security | Spring Web MVC, Spring Security, JWT |
| Persistence | Spring Data JPA, Hibernate, PostgreSQL |
| Realtime Server | Spring WebSocket/STOMP |
| Testing | Maven Surefire, JUnit, ESLint, Next production build |
| DevOps | Docker, Docker Compose, Vercel frontend, Render backend |

---

## Repository Layout

```text
.
├── docker-compose.yml
├── README.md
├── wordle-arena/
│   ├── Dockerfile
│   ├── pom.xml
│   ├── db/migrations/
│   └── src/
│       ├── main/java/com/wordlearena/
│       │   ├── arena/
│       │   ├── auth/
│       │   ├── common/
│       │   ├── config/
│       │   ├── daily/
│       │   ├── game/
│       │   ├── leaderboard/
│       │   ├── stats/
│       │   ├── user/
│       │   └── websocket/
│       ├── main/resources/
│       │   ├── answers.txt
│       │   ├── words.txt
│       │   └── application.properties
│       └── test/java/com/wordlearena/
└── wordle-frontend/
    ├── Dockerfile
    ├── package.json
    ├── src/app/
    ├── src/components/
    ├── src/hooks/
    ├── src/lib/
    ├── src/stores/
    └── src/types/
```

---

## Backend Highlights

- **Duplicate-safe Wordle evaluation**: two-pass scoring handles repeated letters correctly by resolving correct letters before present letters.
- **Transactional game updates**: guess submission, attempt counting, terminal state updates, and rating application happen inside service transactions.
- **Optimistic locking**: arena matches use a JPA `@Version` field to reduce concurrent update hazards.
- **Private challenge authorization**: direct challenges are restricted so only the challenged user can respond or join.
- **Rating protection**: the arena match tracks whether rating changes have already been applied.
- **WebSocket event fanout**: match, challenge, and presence updates are pushed to subscribed clients.
- **Container-aware runtime**: the backend Docker image uses a small Java 21 Alpine runtime and JVM memory flags for hosted environments.

---

## Frontend Highlights

- **App Router pages** for dashboard, daily, practice, arena, match details, history, stats, leaderboard, login, register, and profiles.
- **Auth persistence** through Zustand and local storage.
- **Central API client** with bearer-token injection, timeout handling, parsed backend errors, and automatic auth clearing on `401`.
- **STOMP client manager** for match events, challenges, and presence.
- **Reusable game components** for boards, rows, tiles, and keyboard state.
- **Neobrutalist design primitives** including brutal cards, buttons, inputs, stamps, ink-strip accents, and tactile hover states.

---

## API Reference

### Auth

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create a player account |
| `POST` | `/api/auth/login` | Authenticate and return a JWT |

### Users & Stats

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/users/me` | Get the authenticated user |
| `GET` | `/api/users/{username}` | Get a public user profile |
| `GET` | `/api/users/me/stats` | Get authenticated user stats |
| `GET` | `/api/users/{username}/stats` | Get public user stats |

### Games

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/games` | Start a practice or daily-backed game |
| `POST` | `/api/games/{gameId}/guesses` | Submit a solo game guess |
| `GET` | `/api/games/{gameId}` | Get game details |
| `GET` | `/api/games` | Get authenticated game history |
| `POST` | `/api/games/{gameId}/abandon` | Mark a game as abandoned |

### Daily

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/daily` | Get or create today's daily game |
| `POST` | `/api/daily/guesses` | Submit a daily guess |
| `GET` | `/api/daily/result` | Get today's daily result |

### Arena

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/arena/match` | Join public matchmaking or create a waiting match |
| `POST` | `/api/arena/private` | Create a private invite-code room |
| `POST` | `/api/arena/join-private` | Join a private room by invite code |
| `GET` | `/api/arena/active` | Get the authenticated user's active arena match |
| `GET` | `/api/arena/live` | List public live matches for spectators |
| `GET` | `/api/arena/{matchId}` | Get arena match summary |
| `GET` | `/api/arena/{matchId}/details` | Get match boards and guess history |
| `POST` | `/api/arena/{matchId}/guesses` | Submit an arena guess |
| `POST` | `/api/arena/{matchId}/cancel` | Cancel a waiting match |
| `POST` | `/api/arena/{matchId}/forfeit` | Forfeit an active match |
| `POST` | `/api/arena/{matchId}/rematch` | Request a private rematch |
| `POST` | `/api/arena/{matchId}/rematch/cancel` | Cancel a rematch request |
| `POST` | `/api/arena/{matchId}/leave` | Leave or close a private lobby |

### Challenges

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/arena/challenge/pending` | List pending direct challenges |
| `POST` | `/api/arena/challenge/{targetUsername}` | Challenge a user |
| `POST` | `/api/arena/challenge/{matchId}/respond` | Accept or decline a challenge |

### Leaderboard, Presence, Health

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/leaderboard` | Get global leaderboard |
| `GET` | `/api/leaderboard/me` | Get the authenticated user's leaderboard position |
| `GET` | `/api/presence/online` | Get online users |
| `GET` | `/api/presence/status/{username}` | Get one user's online status |
| `GET` | `/api/health` | Backend health check |

---

## Local Development

### Prerequisites

- Java 21
- Node.js 20 or newer
- npm
- Docker Desktop, or a local PostgreSQL instance

### Run Everything With Docker Compose

```bash
git clone https://github.com/rupeshhh007/wordle-rupesh.git
cd wordle-rupesh
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`

The compose file uses local development credentials and a development JWT secret. Replace those values before using this setup outside your machine.

### Run Backend Manually

```bash
cd wordle-arena

export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/wordle_arena
export SPRING_DATASOURCE_USERNAME=wordle_user
export SPRING_DATASOURCE_PASSWORD=wordle_password
export JWT_SECRET=replace_with_a_long_random_secret_at_least_32_bytes
export JWT_EXPIRATION=86400000

./mvnw spring-boot:run
```

### Run Frontend Manually

```bash
cd wordle-frontend
npm install

echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8080" > .env.local
npm run dev
```

Open `http://localhost:3000`.

---

## Environment Variables

### Backend

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | HTTP server port |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/wordle_arena` | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | local username | Database username |
| `SPRING_DATASOURCE_PASSWORD` | empty | Database password |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `update` | Hibernate schema mode |
| `SPRING_JPA_SHOW_SQL` | `false` | SQL logging |
| `JWT_SECRET` | development fallback | JWT signing secret |
| `JWT_EXPIRATION` | `86400000` | JWT lifetime in milliseconds |

### Frontend

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | derived from API URL | Optional explicit WebSocket URL |

---

## Verification

Use these before opening a pull request or deploying:

```bash
cd wordle-frontend
npm run lint
npm run build
```

```bash
cd wordle-arena
./mvnw test
```

Current verified baseline:

- Frontend lint passes.
- Frontend production build passes.
- Backend tests pass.

---

## Deployment Notes

- The frontend is designed for Vercel-style deployment.
- The backend Dockerfile builds a Spring Boot jar and runs it with Java 21.
- PostgreSQL is required in production.
- Always provide a strong production `JWT_SECRET`; do not rely on local defaults.
- For hosted frontend builds, set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend origin.
- For WebSocket deployments behind a separate host or proxy, set `NEXT_PUBLIC_WS_URL` explicitly.

---

## Author

**Rupesh Tripathi**

- GitHub: [@rupeshhh007](https://github.com/rupeshhh007)
- LinkedIn: [rupesh-tripathi](https://linkedin.com/in/rupesh-tripathi-b62583328)
- LeetCode: [@rupeshhh007](https://leetcode.com/u/rupeshhh007/)

---

## License

No license file is currently included in this repository. Add a license before distributing or reusing the project outside personal/demo use.
