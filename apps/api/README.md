# FinEase API (Backend)

The backend service for **FinEase**, built with [NestJS](https://nestjs.com/). This RESTful API handles authentication, data aggregation, and transactions logic, orchestrating interactions between the Next.js frontend and Firebase Firestore.

## 🚀 Overview

- **Framework**: NestJS 11 (Node.js)
- **Database**: Firebase Admin SDK (Firestore)
- **Authentication**: JWT-based security integrated with Firebase (`@nestjs/jwt`, `passport-jwt`)
- **Role**: Serves as the central intelligence node, managing all complex aggregation logic, business rules, and secure data access for the FinEase ecosystem.

## 📥 Getting Started

### Prerequisites

- Node.js (v20+)
- npm (v10+)
- Firebase Admin setup (credentials and configuration)

### Installation

```bash
$ npm install
```

### Running the API

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## 🧪 Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## 🏗 Architecture & Modules

The API is structured in a modular fashion to ensure scalability and maintainability. Key functional areas include:

- **Auth**: Handles user authentication, session validation, and Firebase token verification.
- **Finance/Transactions**: Manages ledger entries, categories, and synchronization logic.
- **Simulation**: Provides the engine for budget simulations and perspective calculations logic.
- **Activity/Reports**: Aggregates data and logs platform events for activity feeds and analytics.

## 📝 License

This project is part of FinEase — UNLICENSED.
