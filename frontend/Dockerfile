# Builds the app, then serves the built files with nginx. In the full stack
# the HTTPS proxy (../proxy) sends /api and /socket.io to the backend and
# every other request here (see README.md, "Running with Docker").

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Read by Vite at build time (see .env.example): "socket" turns live updates on.
ARG VITE_REALTIME=
# "off" leaves the 3D board out of the build; anything else keeps it.
ARG VITE_BOARD_3D=on
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
