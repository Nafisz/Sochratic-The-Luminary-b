FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy seluruh project (termasuk folder src/)
COPY . .

# Pindah ke src untuk menjalankan index.js
WORKDIR /app/src

# Jalankan app dari src/index.js
CMD ["node", "index.js"]
