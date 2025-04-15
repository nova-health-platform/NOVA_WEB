# Utiliser une image légère de Node.js
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement les fichiers package.json et package-lock.json pour optimiser la mise en cache des dépendances
COPY package*.json ./

# Installer Angular CLI globalement et les dépendances avec --legacy-peer-deps pour éviter les conflits
RUN npm install -g @angular/cli && npm install --legacy-peer-deps

# Copier le reste du projet
COPY . .

# Exposer le port d'Angular
EXPOSE 4200

# Lancer l'application Angular
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"]
