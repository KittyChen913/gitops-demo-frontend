# ── Build stage (optional — only needed if you add a build step later) ──────
# For a pure-HTML app we skip the build stage and go straight to nginx.

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove the default nginx vhost
RUN rm /etc/nginx/conf.d/default.conf

# Copy static assets
COPY index.html App.jsx style.css /usr/share/nginx/html/

# The official nginx image automatically runs envsubst on every *.template
# file placed under /etc/nginx/templates/ and writes the result to
# /etc/nginx/conf.d/.  BACKEND_URL is substituted at container start.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY nginx.proxy_params  /etc/nginx/proxy_params

# Default backend service address (override with -e BACKEND_URL=...)
ENV BACKEND_URL=backend:8080

EXPOSE 80

# Inherits the default nginx entrypoint (handles envsubst + nginx -g daemon off)
