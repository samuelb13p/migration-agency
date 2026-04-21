FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN npm install
RUN npm run build -w @migration-agency/web

WORKDIR /app/apps/web
CMD ["npm", "run", "start"]
