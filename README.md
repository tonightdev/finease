# FinEase — Wealth Architect & Goal Navigator

A monorepo personal finance application built with **Next.js**, **NestJS**, **Firebase**, and **Turborepo**.

---

## 🗂️ Project Structure

```
finease/
├── apps/
│   ├── api/          # NestJS backend REST API
│   └── web/          # Next.js frontend application
└── packages/
    ├── types/        # Shared TypeScript interfaces & types
    ├── ui/           # Shared UI components
    ├── eslint-config/ # Shared ESLint config
    └── typescript-config/ # Shared TS config
```

---

## ✅ Prerequisites

- **Node.js**: v20+
- **npm**: v10+
- A [Firebase](https://firebase.google.com/) project with **Authentication** and **Firestore** enabled

---

## 🔐 Environment Configuration

> ⚠️ **Never commit `.env` files or Firebase service account JSON files to Git.**

### API (`apps/api`)

Copy `.env.example` to `.env` and fill in your values:

```bash
cp apps/api/.env.example apps/api/.env
```

| Variable                | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `PORT`                  | Port for the NestJS API (default: 3001)             |
| `JWT_SECRET`            | Secret key used to sign JWT tokens                  |
| `FIREBASE_PROJECT_ID`   | Your Firebase project ID                            |
| `FIREBASE_CLIENT_EMAIL` | Service account client email                        |
| `FIREBASE_PRIVATE_KEY`  | Service account private key (use `\n` for newlines) |

### Web (`apps/web`)

Copy `.env.example` to `.env.local` and fill in your Firebase web config:

```bash
cp apps/web/.env.example apps/web/.env.local
```

| Variable                                   | Description                                        |
| ------------------------------------------ | -------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase web API key                               |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain                               |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase project ID                                |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket                            |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID                       |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase app ID                                    |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`      | Firebase measurement ID (Analytics)                |
| `NEXT_PUBLIC_API_URL`                      | Backend API URL (default: `http://localhost:3001`) |

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit both files with your actual credentials
```

### 3. Run in development mode

```bash
# Run both the API and Web simultaneously
npm run dev

# Or run individually:
npm run dev --filter=api     # API at http://localhost:3001
npm run dev --filter=web     # Web at http://localhost:3000
```

---

## 🛠️ Available Scripts

| Command               | Description                   |
| --------------------- | ----------------------------- |
| `npm run dev`         | Start all apps in watch mode  |
| `npm run build`       | Build all apps for production |
| `npm run lint`        | Lint all packages             |
| `npm run check-types` | Run TypeScript type checking  |

---

## 🏗️ Architecture

### Backend (NestJS)

- **Auth Module** — JWT-based authentication with Firebase user lookup. Tokens expire in 24h.
- **Finance Module** — REST endpoints for Accounts, Transactions, Goals, Categories, and Asset Classes.
- **Analytics Module** — Aggregated stats for dashboards.

### Frontend (Next.js 16 App Router)

- **Store** — Redux Toolkit slices for all domains (accounts, transactions, goals, categories, assetClasses, stats).
- **Auth** — Firebase Auth with JWT exchange to the NestJS backend.
- **Pages** — Dashboard, Transactions, Goals, Portfolio, Reports, Settings.

### Key Features

- 📊 **Dashboard** — Net worth, asset allocation, goal velocity, and financial freedom score.
- 💳 **Transactions** — Manual and automated recurring transactions with pending confirmation flow.
- 🎯 **Goals** — Financial goal tracking with progress and monthly requirement calculations.
- 📈 **Reports** — Income/expense charts, savings velocity, and category breakdown.
- 🏦 **Portfolio** — Investment account management with asset class breakdown.

---

## 🔥 Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password provider)
3. Enable **Firestore** in Native mode
4. Generate a **Service Account Key** from Project Settings → Service Accounts → Generate new private key
5. Extract values from the downloaded JSON and place them in `apps/api/.env`

### Required Firestore Indexes

For optimal transaction query performance, create this composite index in the Firebase Console:

| Collection     | Fields                        | Order |
| -------------- | ----------------------------- | ----- |
| `transactions` | `userId` (ASC), `date` (DESC) | —     |

---

## 🔒 Security Notes

- **`.env` files** are listed in `.gitignore` and should **never** be committed.
- **Firebase service account JSON** should also never be committed — all credentials are now read from environment variables.
- The JWT secret (`JWT_SECRET`) should be a strong, random string in production.
- All API endpoints are protected by the `AuthGuard` which validates the JWT on every request.

---

## 📝 License

UNLICENSED — Private project.
