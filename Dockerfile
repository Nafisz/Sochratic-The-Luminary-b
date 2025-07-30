FROM node:18

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies with verbose output
RUN npm install --verbose

# Verify express is installed
RUN node -e "console.log(require.resolve('express'))"

# Copy source code
COPY . .

# Create .env file if it doesn't exist (with default values)
RUN echo "POSTGRES_USER=postgres\nPOSTGRES_PASSWORD=novax\nPOSTGRES_DB=scientiax\nDATABASE_URL=postgresql://postgres:novax@postgres:5432/scientiax\nREDIS_URL=redis://redis:6379\nPORT=3000\nNODE_ENV=development" > .env

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"]