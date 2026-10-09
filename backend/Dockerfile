FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./

# Development: all deps, source is bind-mounted by docker compose, hot reload.
FROM base AS dev
RUN npm ci --legacy-peer-deps
COPY . .
# Folder of the profile pictures (compose mounts a volume on it).
RUN mkdir -p /data/avatars
CMD ["npm", "run", "start:dev"]

FROM base AS build
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Production: runtime deps and compiled output only.
FROM node:22-alpine AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps
COPY --from=build /app/dist ./dist
# The volume mounted here keeps this owner, so the node user can write to it.
RUN mkdir -p /data/avatars && chown node:node /data/avatars
USER node
CMD ["node", "dist/main"]
