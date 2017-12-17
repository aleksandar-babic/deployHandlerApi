# Use Debian Stretch with NodeJS 9 preinstalled as base
FROM node:9-stretch

# Create app directory on container, copy all project files
WORKDIR /api
COPY . .

# Install all project dependencies
RUN npm install

# Open port 8080
EXPOSE 8080

# Start Web API
CMD ["npm", "start"]