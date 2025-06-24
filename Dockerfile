#still a work in progress

FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache --virtual .build-deps openssl python3 make g++ \
    && apk add --no-cache tini

COPY package*.json ./
COPY prisma ./prisma

RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

RUN npx prisma generate 

RUN npm run build 

RUN npm prune --production

RUN apk del .build-deps

FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nestjs

ENV NODE_ENV=production

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "dist/main.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1