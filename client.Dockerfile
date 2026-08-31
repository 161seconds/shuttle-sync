FROM node:22-alpine AS build

WORKDIR /app

# Copy shared folder
COPY shared ./shared

# Copy client folder
COPY client ./client

WORKDIR /app/client

# Accept build arguments for environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_SEPAY_BANK_ID
ENV VITE_SEPAY_BANK_ID=$VITE_SEPAY_BANK_ID

ARG VITE_SEPAY_BANK_ACC
ENV VITE_SEPAY_BANK_ACC=$VITE_SEPAY_BANK_ACC

ARG VITE_SEPAY_BANK_HOLDER
ENV VITE_SEPAY_BANK_HOLDER=$VITE_SEPAY_BANK_HOLDER

ARG VITE_VIETMAP_KEY
ENV VITE_VIETMAP_KEY=$VITE_VIETMAP_KEY

ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

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
