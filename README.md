# Adonis Starter Kit

A full-stack TypeScript starter built with AdonisJS and React.

## Tech Stack

- **Backend:** AdonisJS 7, TypeScript, Lucid, PostgreSQL, VineJS, Tuyau
- **Frontend:** React 19, Vite, TanStack Router, Tailwind CSS 4
- **Tooling:** pnpm, Turborepo, Oxlint, Oxfmt
- **Infrastructure:** Docker, GitHub Actions, GitHub Container Registry

## Getting Started

### Requirements

- Node.js 26.13.1+
- pnpm 12.21.0
- Docker

### Installation

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
```

Generate the application key:

```bash
cd apps/backend
node ace generate:key
cd ../..
```

### Start PostgreSQL

```bash
docker compose up -d
```

### Start development

```bash
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3333
