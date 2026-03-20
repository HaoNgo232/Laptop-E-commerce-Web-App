# Stage 1: Build stage
FROM node:22-alpine AS build

# Thiết lập thư mục làm việc
WORKDIR /app

# Cài đặt pnpm globally
RUN npm install -g pnpm

# Copy package.json và pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Cài đặt dependencies
RUN pnpm install --frozen-lockfile

# Copy toàn bộ source code
COPY . .

# Build ứng dụng
RUN pnpm run build

# Stage 2: Production stage với Nginx
FROM nginx:alpine

# Copy build files từ stage trước
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config (tùy chọn)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set default API URL (can be overridden at runtime)
ENV VITE_API_URL=http://localhost:3000

# Expose port 80
EXPOSE 80

# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
