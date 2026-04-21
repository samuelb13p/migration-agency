FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN npm install
RUN npm run prisma:generate -w @migration-agency/api
RUN npm run build -w @migration-agency/api

WORKDIR /app/apps/api
CMD ["npm", "run", "start"]
