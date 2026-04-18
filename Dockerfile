# Added by muaz on 2026-04-02
# We use Node.js version 20 (Alpine is a lightweight Linux distribution) to keep the image small.
FROM node:20-alpine

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and related files first to leverage Docker cache for dependencies
COPY package*.json ./

# Install the backend dependencies defined in package.json
RUN npm install

# Copy the rest of the backend source code into the container
COPY . .

# Expose port 5000 to the host machine so we can access the backend via localhost:5000
EXPOSE 5000

# We use "npm run dev" to start the server with nodemon, enabling automatic restarts when files change
CMD ["npm", "run", "dev"]
