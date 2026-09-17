FROM node:22-alpine
RUN apk add --no-cache git
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY bin ./bin
COPY public ./public
COPY examples ./examples
COPY docs ./docs
COPY test ./test
ENV NODE_ENV=production PORT=3000 FREE_SCAN_LIMIT=3
EXPOSE 3000
CMD ["node", "./src/server.js"]
