# FinEase Web App (Frontend)

The main user interface for **FinEase**, providing a premium Wealth Command Center experience. Built with [Next.js](https://nextjs.org/) (App Router).

## 🚀 Overview

- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4 with custom glassmorphism, Framer Motion for dynamics.
- **State Management**: Redux Toolkit (global state), localized React state.
- **Icons**: Lucide React
- **Data Visualization**: Recharts

## 📥 Getting Started

### Prerequisites

- Node.js (v20+)
- npm (v10+)
- Backend API running locally for full functionality

### Installation

Navigate to this directory (or run from the monorepo root) and install dependencies:

```bash
$ npm install
```

### Running the App

Ensure your environment variables (Firebase config, API endpoints) are correctly set up in a `.env.local` file.

```bash
$ npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

### Building for Production

```bash
$ npm run build
$ npm run start
```

## 🎨 UI/UX Philosophy

The frontend prioritizes a premium, low-latency user experience. Heavy emphasis is placed on:
- **Responsive Layouts**: Consistent experiences across Desktop and Mobile viewports.
- **Subtle Animations**: Leveraging `framer-motion` to guide user attention and interactions seamlessly.
- **Glassmorphism**: Minimalist aesthetics avoiding visual clutter while retaining depth and structure.

## 📝 License

This project is part of FinEase — UNLICENSED.
