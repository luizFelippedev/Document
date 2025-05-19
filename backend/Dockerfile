# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

# Set environment variables
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy built files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/templates ./src/templates

# Create uploads directory
RUN mkdir -p uploads/projects uploads/certificates/images uploads/certificates/files uploads/users logs

# Set user for security
USER node

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -qO- http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]