FROM node:16-slim

# Install packages
RUN apt-get update
RUN apt-get install -y openssl wait-for-it

# Working directory
WORKDIR /app

# Package
COPY package.json yarn.lock .

# Shared
COPY shared/models/package.json shared/models/
COPY shared/crypto/package.json shared/crypto/
COPY shared/access/package.json shared/access/

# Services
COPY services/gateway/package.json services/gateway/
COPY services/products/package.json services/products/
COPY services/users/package.json services/users/

# Install
RUN yarn install --pure-lockfile
COPY . .

# Build
RUN yarn build

# Generate Prisma Client
RUN yarn workspace @shared/models prisma generate
