# Vite dev server. Source is bind-mounted by docker-compose; deps are baked into the image.
FROM node:24-trixie-slim

USER node
WORKDIR /app
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

EXPOSE 5173
CMD ["npm", "run", "dev:emulator", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
