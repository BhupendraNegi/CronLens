# Local dev / build image. NOT the production artifact — GitHub Pages is served
# from a static export built in CI (see .github/workflows/deploy.yml).
FROM node:22-alpine

RUN corepack enable

WORKDIR /app

# Install deps first for layer caching. node_modules is mounted as a named
# volume in docker-compose so it survives the source bind-mount.
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
