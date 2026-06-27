FROM node:20-slim

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy source files (in dev, this is overridden by volume mounts)
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
