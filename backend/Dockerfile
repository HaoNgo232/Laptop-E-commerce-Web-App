# Sử dụng Node.js 22 Alpine cho image nhẹ
FROM node:22-alpine

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

# Copy startup script
COPY start.sh /app/start.sh
RUN sed -i 's/\r$//' /app/start.sh && chmod +x /app/start.sh

# Expose port 3000
EXPOSE 3000

# Chạy ứng dụng với script khởi động
CMD ["/app/start.sh"]
