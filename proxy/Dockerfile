# The only container reachable from outside. It terminates HTTPS and forwards
# requests to the backend over plain HTTP inside the Docker network (the
# subject only requires HTTPS for connections TO the backend).
FROM nginx:1.27-alpine

# openssl is needed to create the self-signed certificate.
RUN apk add --no-cache openssl

# Replace the default site with ours.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Scripts in /docker-entrypoint.d/ run before nginx starts.
COPY generate-cert.sh /docker-entrypoint.d/40-generate-cert.sh
RUN chmod +x /docker-entrypoint.d/40-generate-cert.sh
