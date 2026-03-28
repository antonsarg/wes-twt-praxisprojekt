# ==========================================
# Stage 1: Build the Go binary
# ==========================================
FROM golang:1.26.1-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the Go module files and download dependencies
# Doing this before copying the code caches the dependencies and speeds up future builds!
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the application statically (CGO_ENABLED=0 makes it perfectly standalone)
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/api-server ./cmd/api/main.go

# ==========================================
# Stage 2: Create the minimal production image
# ==========================================
FROM alpine:latest

WORKDIR /app

# We need CA certificates if our app ever makes external HTTPS requests
RUN apk --no-cache add ca-certificates

# Copy ONLY the compiled binary from the builder stage
COPY --from=builder /app/api-server .

# Expose the port your API runs on
EXPOSE 8080

# Command to run the executable
CMD ["./api-server"]