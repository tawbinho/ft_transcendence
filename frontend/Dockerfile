# Builds the app, then serves the built files with nginx. In the full stack
# the HTTPS proxy (../proxy) sends /api and /socket.io to the backend and
# every other request here (see README.md, "Running with Docker").

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Read by Vite at build time (see .env.example). An empty
# VITE_DEMO_FEATURES turns the demo off: every request goes to the backend.
ARG VITE_DEMO_FEATURES=users,friends,chat,spectate,tournaments
ARG VITE_REALTIME=
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
