# easyplay-Server für Deploio (nine.ch): Website, Anmeldung und Daten in einem Programm.
# Deploio baut dieses Abbild bei jedem Push auf main. Einstellungen: ANLEITUNG-SERVER.md
FROM node:22-alpine
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY server/package.json server/
RUN cd server && npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY . .
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
CMD ["node", "server/index.js"]
