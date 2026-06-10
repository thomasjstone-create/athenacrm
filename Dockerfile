FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package manifests first to leverage layer caching
COPY package.json package-lock.json* ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
