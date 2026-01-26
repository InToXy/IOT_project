# Étape 1 : Construction
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# En production, Vite utilisera le fichier .env copié
# (Les ARG/ENV ont été retirés pour laisser la priorité au fichier .env)

RUN npm run build

# Étape 2 : Serveur Production
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
