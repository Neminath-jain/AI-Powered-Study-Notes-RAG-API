# Stage 1: Build React Assets
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Pass build environment variables if needed
ENV VITE_API_URL=http://localhost:8000/api/v1
RUN npm run build

# Stage 2: Serve Static Assets with Nginx
FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom Nginx configuration if desired, otherwise default is used

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
