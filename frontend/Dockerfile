# Etapa 1: construir el frontend Vite
FROM node:20-alpine AS build

WORKDIR /app

# En Docker el frontend y la API comparten origen: Nginx hace el proxy.
ARG VITE_API_URL=/
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: servir los archivos con Nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443
