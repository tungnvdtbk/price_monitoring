# Use a Node.js base image
FROM node:latest AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies

RUN npm install
RUN npm install tsc -g
# Copy the rest of the application code
COPY . .

# Build TypeScript files
RUN npm run build

# Second stage for a smaller image size
FROM node:alpine

# Set working directory
WORKDIR /app

# Copy built files from the previous stage

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/*.js ./
# Expose the port
EXPOSE 3000

# Command to run the application
CMD ["node", "./yahooGoldPriceCrawler.js"]
