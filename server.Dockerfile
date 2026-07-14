FROM node:22-alpine

WORKDIR /app

# Copy root package.json if it exists (for workspace compatibility)
COPY package.json package-lock.json* ./

# Copy shared folder which is required by server
COPY shared ./shared

# Copy server folder
COPY server ./server

# Install dependencies and build
WORKDIR /app/server
RUN npm install
RUN npm run build

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
