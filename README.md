# 🔥 FocusForge

> A focus-tracking productivity API with rule-based burnout detection and pattern analytics.

FocusForge is a full-stack MERN application that helps users track focus sessions, analyze their work patterns, and detect burnout risk through a rule-based intelligence engine. Built as a B.Tech CSE 3rd-year project at Invertis University, Bareilly.

---

## ✨ What Makes This Project Different

Most student productivity projects stop at CRUD — saving and listing data. FocusForge goes further by **analyzing behavior over time**:

- **Streak tracking** counts consecutive days of focus.
- **Burnout risk engine** uses a 6-rule scoring system to detect overworking patterns and surface *transparent reasoning*.
- **Weekly insights** are computed via MongoDB aggregation pipelines — peak focus hour, peak day-of-week, abandonment rate, daily breakdown.

The system tells users *why* it's concerned, not just *that* it's concerned. Decisions are explainable, not black-box.

---

## 🛠️ Tech Stack

| Layer            | Technology                           |
|------------------|--------------------------------------|
| Frontend         | React 19, Vite, React Router, Axios  |
| Backend          | Node.js, Express                     |
| Database         | MongoDB Atlas (cloud) + Mongoose ODM |
| Authentication   | JWT + bcrypt password hashing        |
| State management | React Context + Hooks                |
| Styling          | Vanilla CSS (custom design system)   |

---

## 🏗️ Architecture
┌─────────────────────────────┐
│        React Frontend       │
│     (Vite, Port 5173)       │
│                             │
│  Pages → Components         │
│       ↓                     │
│  Service layer (Axios)      │
└─────────────┬───────────────┘
│ HTTP + JWT
▼
┌─────────────────────────────┐
│       Express Backend       │
│       (Port 5000)           │
│                             │
│  Routes  → Middleware       │
│    ↓                        │
│  Controllers                │
│    ↓                        │
│  Services (business logic)  │
│    ↓                        │
│  Models (Mongoose)          │
└─────────────┬───────────────┘
│
▼
┌─────────────────────────────┐
│      MongoDB Atlas          │
│    (Cloud Database)         │
└─────────────────────────────┘

The backend follows a **layered architecture**:

- **Routes** handle HTTP wiring.
- **Middleware** handles cross-cutting concerns (auth, error handling).
- **Controllers** parse requests and orchestrate responses.
- **Services** hold pure business logic (insights engine).
- **Models** define schemas and validation rules.

This separation makes the codebase testable, maintainable, and easy to extend.

---

## 📂 Project Structure
focusforge/
├── backend/
│   ├── config/             # DB connection
│   ├── controllers/        # Request handlers
│   │   ├── authController.js
│   │   ├── sessionController.js
│   │   └── insightsController.js
│   ├── middleware/         # Auth + error handling
│   ├── models/             # Mongoose schemas
│   │   ├── User.js
│   │   └── Session.js
│   ├── routes/             # URL-to-controller mapping
│   ├── services/           # Pure business logic
│   │   └── insightsEngine.js
│   ├── utils/              # JWT helpers
│   ├── server.js           # Express entry point
│   └── .env                # Environment variables (not committed)
│
└── frontend/
└── src/
├── components/     # Reusable UI components
├── context/        # AuthContext
├── pages/          # Login, Register, Dashboard
├── services/       # API clients (Axios)
└── App.jsx         # Router setup

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js v18+ and npm
- MongoDB Atlas account (free tier works)

### 1. Clone the repository
git clone <your-repo-url>
cd focusforge

### 2. Backend setup
cd backend
npm install

Create a `.env` file in `backend/` with:
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/focusforge?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development

Start the backend:
npm run dev

You should see:
🔥 Server running on port 5000 in development mode
✅ MongoDB Connected: ...

### 3. Frontend setup

In a **second terminal**:
cd frontend
npm install
npm run dev

Open `http://localhost:5173` in your browser.

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Authenticated routes require a `Bearer <token>` Authorization header.

### Authentication

| Method |     Endpoint     |       Description         | Auth |
|--------|------------------|---------------------------|------|
| POST   | `/auth/register` | Create a new user account | No   |
| POST   | `/auth/login`    | Log in and receive JWT    | No   |
| GET    | `/auth/me`       | Get current user info     | Yes  |

### Sessions

| Method | Endpoint              | Description                                 | Auth |
|--------|-----------------------|---------------------------------------------|------|
| POST   | `/sessions/start`     | Start a new focus session                   | Yes  |
| GET    | `/sessions`           | List user's sessions (filters + pagination) | Yes  |
| GET    | `/sessions/:id`       | Get a single session by ID                  | Yes  |
| PATCH  | `/sessions/:id/end`   | End an active session                       | Yes  |
| PATCH  | `/sessions/:id/break` | Log a break (atomic increment)              | Yes  |

### Insights (Intelligence Engine)

| Method | Endpoint                  | Description                           | Auth |
|--------|---------------------------|---------------------------------------|------|
|  GET   | `/insights/streak`        | Current consecutive-day streak        | Yes  |
|  GET   | `/insights/burnout-check` | 24-hour burnout risk analysis         | Yes  |
|  GET   | `/insights/weekly`        | 7-day stats via aggregation pipelines | Yes  |

### Sample Request — Start a Session
POST /api/sessions/start
Authorization: Bearer <token>
Content-Type: application/json
{
"goal": "Study sorting algorithms",
"plannedDuration": 45,
"tags": ["DSA", "deep-work"]
}

### Sample Response — Burnout Check
{
"success": true,
"data": {
"riskLevel": "medium",
"score": 5,
"reasons": [
"You've focused for 280 minutes today (over 4 hours)",
"Only 1 break in 4.7 hours of focus"
],
"recommendation": "Consider a 15-minute break before your next session.",
"sessionsAnalyzed": 6,
"windowHours": 24
}
}

---

## 🧠 The Intelligence Engine

The burnout checker uses a **rule-based scoring engine**. Each rule encodes a behavioral concern. Triggered rules contribute to a risk score, which maps to a risk level.

| Rule                | Trigger                        | Score |
|---------------------|--------------------------------|-------|
| Heavy focus day     | > 4 hours focused today        |   +3  |
| Extreme focus day   | > 6 hours focused today        |   +2  |
| Insufficient breaks | < 0.5 breaks per hour          |   +2  |
| Recent abandonment  | Last session was abandoned     |   +2  |
| Late-night session  | Session started 11 PM – 5 AM   |   +2  |
| Fragmented work     | 3+ sessions averaging < 15 min |   +2  |

| Total Score | Risk Level |
|-------------|------------|
|     0–2     |     Low    |
|     3–5     |   Medium   |
|      6+     |    High    |

This approach is **explainable by design** — the system always returns the reasons that triggered the score, making the AI's decision transparent.

---

## 📊 MongoDB Aggregation Pipelines

The weekly insights endpoint uses four aggregation pipelines:

1. **Totals pipeline** — `$match` recent sessions, `$group` with `$sum` and conditional accumulators.
2. **Daily breakdown** — `$dateToString` formats dates, `$group` by date string.
3. **Hourly breakdown** — `$hour` operator extracts hour-of-day, used to find peak focus hour.
4. **Day-of-week breakdown** — `$dayOfWeek` operator finds peak productive day.

Aggregations run database-side, returning only summarized results — far faster than fetching documents and computing in JavaScript.

---

## 🖼️ Screenshots

### Login & Registration
![Login](<img width="684" height="693" alt="01-login" src="https://github.com/user-attachments/assets/8be89397-0ef5-44f5-8907-628e9f388d43" />)

![Register](<img width="680" height="792" alt="02-register" src="https://github.com/user-attachments/assets/c41647a1-15a4-4336-84ed-fcb285214148" />
)

### Dashboard
![Empty dashboard](<img width="942" height="981" alt="03-dashboard-empty" src="https://github.com/user-attachments/assets/17291b5b-495d-4796-a5ea-fe20d2048359" />
)
![Active session](<img width="985" height="480" alt="04-active-session" src="https://github.com/user-attachments/assets/d43c26dc-2933-46aa-a5a5-30d532cd6bef" />
)

### Insights & History
![Weekly stats](<img width="932" height="984" alt="05-weekly-stats" src="https://github.com/user-attachments/assets/0ca7fc56-c403-4d53-8232-036cf790965c" />
)

### API Test (Postman)
![Weekly insights endpoint](<img width="1432" height="971" alt="06-api-postman" src="https://github.com/user-attachments/assets/4eba61fb-90f8-40a5-9e66-b1faa19bd7ec" />
)

---

## 🔐 Security Considerations

- **Password hashing** with bcrypt (salt rounds: 10).
- **JWT-based stateless authentication** — no server-side session storage.
- **Per-user data scoping** — every protected endpoint verifies ownership before returning data.
- **Schema-level validation** via Mongoose enums and required fields.
- **Centralized 401 handling** — expired tokens trigger automatic logout on the frontend.
- **Environment variables** for secrets (`.env` is git-ignored).

---

## 🚧 Future Improvements

- Email verification on registration
- Password reset flow
- User-configurable timezone (currently UTC)
- Real-time session sync across devices via WebSocket
- Pomodoro timer mode
- Export weekly reports as PDF
- Mobile-first redesign
- **Reliable break-end notifications** — current implementation works in some browsers/contexts but requires a Service Worker for full background reliability. Planned for v1.3.

---

## 👨‍💻 Author

**Mohd Saqlain Hussain**
B.Tech Computer Science Engineering, VI Semester
Invertis University, Bareilly

---

## 📜 License

This project was built for academic purposes as part of B.Tech curriculum. Code is available for learning and reference.
