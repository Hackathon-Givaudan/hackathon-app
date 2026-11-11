# L'API et le front de la tranche lancée par « docker compose up ».
# Le dev container a sa propre image : .devcontainer/Dockerfile.
FROM node:24-trixie-slim

WORKDIR /app
# husky installe les hooks git : sans objet dans une image
ENV HUSKY=0

COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci

COPY api api
COPY web web

EXPOSE 3000 5173
CMD ["npm", "run", "dev"]
