FROM node:18-alpine AS build

WORKDIR /app

# Copy shared folder
COPY shared ./shared

# Copy client folder
COPY client ./client

WORKDIR /app/client

# Accept build arguments for environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies and build
RUN npm install
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the built assets to nginx
COPY --from=build /app/client/dist /usr/share/nginx/html

# Copy the custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
