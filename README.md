# Battleforge

An experimental turn-based strategy game built with AI-assisted development.

## What is this?

Battleforge is a 2D top-down turn-based strategy game where players command armies of units on a continuous play area. This repository is an experiment in building a game using AI coding tools.

## Tech Stack

- **Monorepo** — pnpm workspaces with three packages
- **Language** — TypeScript (strict mode)
- **Frontend** — React, Vite, react-konva, Zustand, Tailwind CSS
- **Backend** — Node.js, Express, Socket.IO
- **Shared** — Zod schemas and pure game logic
- **AI Tools** — GitHub Copilot

## Project Structure

```
packages/
  shared/    — Game types, Zod schemas, and pure game logic
  backend/   — Express + Socket.IO game server
  frontend/  — React + Vite + react-konva client
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Install & Run

```bash
pnpm install
pnpm dev
```

This starts both the frontend (http://localhost:5173) and backend (http://localhost:3000) in development mode.
