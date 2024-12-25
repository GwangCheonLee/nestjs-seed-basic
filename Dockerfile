# Stage 1: Build the application
# Use a lightweight Node.js Alpine image for faster builds
FROM node:alpine AS builder

# Set working directory for the build process
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml to install dependencies
# Utilizing Docker cache to avoid redundant installs if unchanged
COPY package.json pnpm-lock.yaml ./

# Install dependencies with pnpm
# The frozen-lockfile option ensures the lockfile is respected
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application, placing the output in the dist folder
RUN pnpm run build

# Stage 2: Prepare the production environment
# Use a new Node.js Alpine image for a clean, minimal production image
FROM node:alpine

# Set working directory for the runtime environment
WORKDIR /usr/src/app

# Copy only the built files and production dependencies
COPY --from=builder /usr/src/app/dist ./dist
COPY package.json pnpm-lock.yaml ./

# Ensure production-only dependencies are installed
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

# Expose the application port
EXPOSE 3000

# Run the application in production mode
CMD ["npm", "run", "start:prod"]
