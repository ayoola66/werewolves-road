FROM node:20-slim

# Install PostgreSQL client
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY drizzle.config.ts ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Run Jest tests during build; fail the build if tests fail
RUN npm test

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY db/ ./db/

# Build the application
RUN npm run build

# Expose the port
EXPOSE 8080

# Start the server
CMD ["npm", "run", "start"]