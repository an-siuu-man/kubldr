# Use an official Node runtime as a parent image (build stage)
FROM node:21-bullseye-slim AS builder

# Set working directory
WORKDIR /app

# Copy package manifests and install dependencies
# This leverages Docker cache: only re-run npm install when package files change
COPY package*.json ./

# Prefer npm install; if project uses yarn or pnpm, replace accordingly
RUN npm ci --only=production --silent || npm install --silent

# Copy rest of the app
COPY . .

# Build the Next.js app
RUN npm run build

# Production image
FROM node:21-bullseye-slim AS runner

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose the port Next.js will listen on (default 3000)
EXPOSE 3000

# Default environment variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=3000

# Use a non-root user for better security
RUN useradd --user-group --create-home --shell /bin/false nextuser
USER nextuser

# Start the Next.js server
CMD ["npm", "run", "start"]
