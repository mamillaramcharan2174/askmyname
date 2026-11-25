# Production Dockerfile for AskMyData (Deployable on Render, Railway, Fly.io)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definitions
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies across monorepo
RUN npm install && npm --prefix server install && npm --prefix client install

# Copy source trees
COPY . .

# Build production assets
RUN npm run build

# Production execution container
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

COPY package.json ./
COPY server/package.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/src/data/samples ./server/dist/data/samples

EXPOSE 10000

CMD ["node", "server/dist/index.js"]
