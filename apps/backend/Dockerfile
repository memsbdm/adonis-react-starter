
# Base
FROM node:26-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN npm install -g pnpm@12.21.0

WORKDIR /app

# Dependencies
FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile \
    --filter @api-starter-kit/backend... \
    --ignore-scripts

# Build
FROM dependencies AS build

COPY . .

RUN pnpm --filter @api-starter-kit/backend build

# Production dependencies
FROM base AS production-dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile \
    --filter @api-starter-kit/backend... \
    --ignore-scripts

# Production image
FROM node:26-bookworm-slim AS production

ENV NODE_ENV=production

WORKDIR /app/apps/backend

COPY --from=production-dependencies /app/node_modules /app/node_modules
COPY --from=production-dependencies /app/apps/backend/node_modules ./node_modules
COPY --from=build /app/apps/backend/build ./

EXPOSE 3333

CMD ["node", "bin/server.js"]
