#!/bin/sh
# Creates a self-signed certificate the first time the proxy starts. The
# certificate lives in a Docker volume (/etc/nginx/certs), so it is created
# once and survives restarts: the browser's "continue anyway" choice for it
# stays valid. Delete the volume (docker compose down -v) to get a new one.
set -e

CERT_DIR=/etc/nginx/certs
mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_DIR/server.crt" ] || [ ! -f "$CERT_DIR/server.key" ]; then
  echo "proxy: generating a self-signed certificate for localhost"
  # subjectAltName is what modern browsers check (the CN alone is ignored).
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.crt" \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
fi
