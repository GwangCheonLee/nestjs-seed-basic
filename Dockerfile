# Stage 1: Build the application
# Use a Node.js Alpine image for a smaller final image and faster build times
FROM node:alpine as builder

# Set the working directory in the Docker image
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for utilising Docker cache
# to save re-installing dependencies if unchanged
COPY package*.json ./

# Install dependencies using npm
RUN npm install

# Copy rest of the application code to the Docker image
COPY . .

# Build the application using Webpack, generated files go the the dist folder
RUN npm run build

# Stage 2: Run the application
# Start from a new stage to keep our final image clean and small
FROM node:alpine

# Set the working directory in this new stage
WORKDIR /usr/src/app

# Copy only the built app and node_modules to keep the image size small
# Using the multi-stage build to only copy necessary files
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./

# Expose port 3000 for the application
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]