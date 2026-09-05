FROM node:alpine3.24 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run test
RUN npm run build
RUN rm -rf tests
RUN npm prune --omit=dev


FROM node:alpine3.24 AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
USER node
EXPOSE 3001
CMD ["node", "dist/server.js"]