FROM node:22-alpine AS build

WORKDIR /app

# Copy shared folder
COPY shared ./shared

# Copy client folder
COPY client ./client

WORKDIR /app/client

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_SEPAY_BANK_ID
ENV NEXT_PUBLIC_SEPAY_BANK_ID=$NEXT_PUBLIC_SEPAY_BANK_ID

ARG NEXT_PUBLIC_SEPAY_BANK_ACC
ENV NEXT_PUBLIC_SEPAY_BANK_ACC=$NEXT_PUBLIC_SEPAY_BANK_ACC

ARG NEXT_PUBLIC_SEPAY_BANK_HOLDER
ENV NEXT_PUBLIC_SEPAY_BANK_HOLDER=$NEXT_PUBLIC_SEPAY_BANK_HOLDER

ARG NEXT_PUBLIC_VIETMAP_KEY
ENV NEXT_PUBLIC_VIETMAP_KEY=$NEXT_PUBLIC_VIETMAP_KEY

# Install dependencies and build
RUN npm ci
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/client/.next/standalone ./
COPY --from=build --chown=node:node /app/client/.next/static ./client/.next/static
COPY --from=build --chown=node:node /app/client/public ./client/public
USER node
EXPOSE 3000
CMD ["node", "client/server.js"]
