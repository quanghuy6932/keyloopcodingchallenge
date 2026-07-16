# Deployment Guide - Keyloop Unified Document Viewer

This document provides comprehensive instructions for deploying the Keyloop application using Docker and Docker Compose.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Architecture Overview](#architecture-overview)
4. [Configuration](#configuration)
5. [Running Services](#running-services)
6. [Health Checks](#health-checks)
7. [Database Management](#database-management)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)
10. [Monitoring & Logging](#monitoring--logging)

---

## Prerequisites

### System Requirements
- **Docker Desktop** (v4.0+) or Docker Engine (v20.10+)
- **Docker Compose** (v1.29+)
- **Git** for cloning the repository
- **Minimum 2GB RAM** for containers
- **Minimum 5GB disk space** for images and volumes

### Supported Operating Systems
- Windows 10/11 (with WSL 2)
- macOS (Intel or Apple Silicon)
- Linux (Ubuntu 18.04+, Debian 10+, CentOS 7+)

### Installation

#### macOS
```bash
# Using Homebrew
brew install docker docker-compose

# Or download Docker Desktop from docker.com
```

#### Windows
```powershell
# Using Windows Package Manager
winget install Docker.DockerDesktop

# Or download Docker Desktop from docker.com
```

#### Linux (Ubuntu/Debian)
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose

# Add user to docker group (optional)
sudo usermod -aG docker $USER
```

---

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/keyloop/unified-document-viewer.git
cd unified-document-viewer
```

### 2. Create .env File
```bash
cp .env.example .env
```

Update `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secure_password_here
DB_NAME=keyloop_db
LOG_LEVEL=info
```

### 3. Start All Services
```bash
# Build and start containers in the background
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Verify Services are Running
```bash
# Check container status
docker-compose ps

# Test application health
curl http://localhost:3000/health

# Test database connection
docker-compose exec postgres psql -U postgres -d keyloop_db -c "SELECT version();"
```

### 5. Access Application
- **API Base URL**: http://localhost:3000
- **API Health**: http://localhost:3000/health
- **Swagger UI**: http://localhost:3000/api-docs (when enabled)
- **PostgreSQL**: localhost:5432

---

## Architecture Overview

### Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Docker Compose Network                    │
│                  (keyloop-network)                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Sales API    │  │ Service API  │  │ PostgreSQL   │   │
│  │ (Mock)       │  │ (Mock)       │  │ Database     │   │
│  │ Port: 3001   │  │ Port: 3002   │  │ Port: 5432   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         ▲                  ▲                  ▲           │
│         │                  │                  │           │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  Node.js App                      │   │
│  │         (Keyloop Document Viewer)               │   │
│  │         Port: 3000 → Host: 3000                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Container Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `app` | Node.js 20-Alpine | 3000 | Main application |
| `postgres` | PostgreSQL 16-Alpine | 5432 | Document database |
| `sales-api` | Node.js 20-Alpine | 3001 | Mock Sales API |
| `service-api` | Node.js 20-Alpine | 3002 | Mock Service API |

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=keyloop_db

# External APIs
SALES_API_URL=http://sales-api:3001
SERVICE_API_URL=http://service-api:3002

# Optional
API_TIMEOUT=5000
MAX_RETRIES=3
```

### Docker Compose Overrides

For development-specific settings, create `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  app:
    environment:
      DEBUG: 'true'
      NODE_ENV: development
    command: npm run dev
    volumes:
      - ./src:/app/src
      - /app/node_modules
```

---

## Running Services

### Start Services

#### Development Mode (All services running)
```bash
# Start in foreground (useful for debugging)
docker-compose up

# Start in background
docker-compose up -d
```

#### Production Mode
```bash
# Build production image
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Stop Services

```bash
# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop app

# Stop and remove all containers
docker-compose down

# Also remove volumes
docker-compose down -v
```

### View Logs

```bash
# View all logs (last 100 lines)
docker-compose logs --tail=100

# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres

# View logs since specific time
docker-compose logs --since 2024-01-15T10:00:00
```

### Execute Commands in Containers

```bash
# Run command in app container
docker-compose exec app npm test

# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres

# Run shell in app container
docker-compose exec app sh

# View environment variables
docker-compose exec app env
```

### Rebuild Services

```bash
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build app

# Rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

---

## Health Checks

### Application Health Endpoint

```bash
# Check application status
curl -i http://localhost:3000/health

# Expected response (200 OK)
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "externalAPIs": {
    "sales": "available",
    "service": "available"
  }
}
```

### Service-Level Health Checks

Each service includes built-in health checks:

```bash
# Check container health status
docker-compose ps

# View health check logs
docker ps --format "table {{.Names}}\t{{.Status}}"

# Get detailed health information
docker inspect keyloop-app | grep -A 5 '"Health"'
```

### Manual Health Verification

```bash
# Verify database connectivity
docker-compose exec postgres pg_isready -U postgres

# Verify application startup
docker-compose logs app | grep "Server running"

# Test API endpoints
curl -s http://localhost:3000/health | jq .
curl -s http://localhost:3001/health | jq .
curl -s http://localhost:3002/health | jq .
```

---

## Database Management

### Database Initialization

The database is automatically initialized on first startup using `scripts/init-db.sql`:

```bash
# View initialization logs
docker-compose logs postgres

# Verify tables were created
docker-compose exec postgres psql -U postgres -d keyloop_db -c "\dt"
```

### Backup Database

```bash
# Dump database to SQL file
docker-compose exec postgres pg_dump -U postgres keyloop_db > backup.sql

# Backup with compression
docker-compose exec postgres pg_dump -U postgres -Fc keyloop_db > backup.dump
```

### Restore Database

```bash
# Restore from SQL file
docker-compose exec -T postgres psql -U postgres keyloop_db < backup.sql

# Restore from compressed dump
docker-compose exec -T postgres pg_restore -U postgres -d keyloop_db backup.dump
```

### Access Database Directly

```bash
# Connect to PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d keyloop_db

# Within psql:
# List tables: \dt
# Describe table: \d table_name
# Run query: SELECT * FROM search_logs LIMIT 5;
```

### Reset Database

```bash
# Stop services
docker-compose down

# Remove volume
docker volume rm keyloop_postgres_data

# Restart services (recreates database)
docker-compose up -d
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process (example)
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

#### 2. Container Fails to Start

```bash
# View detailed logs
docker-compose logs app

# Check container status
docker-compose ps

# Inspect container
docker-compose inspect app

# Restart container
docker-compose restart app
```

#### 3. Database Connection Failures

```bash
# Check database service
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U postgres

# Verify network connectivity
docker-compose exec app ping postgres

# Check environment variables
docker-compose exec app env | grep DB_
```

#### 4. Out of Memory Errors

```bash
# Check Docker resource usage
docker stats

# Increase Docker memory limit:
# - Docker Desktop: Settings → Resources → Memory
# - Command line: docker run -m 4g (for 4GB limit)

# Clean up unused images/volumes
docker system prune -a
```

#### 5. Permissions Issues

```bash
# Fix file permissions (Linux)
sudo chown -R $USER:$USER .

# Run docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

### Debug Mode

Enable comprehensive debugging:

```bash
# Set debug environment
docker-compose exec app npm run dev

# Enable Docker debug logging
DOCKER_BUILDKIT=1 docker-compose build --progress=plain

# Enable verbose docker-compose output
docker-compose -f docker-compose.yml -v up
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database password
- [ ] Configure external API endpoints
- [ ] Enable HTTPS/TLS
- [ ] Set up logging aggregation
- [ ] Configure backup strategy
- [ ] Plan disaster recovery
- [ ] Test failover procedures
- [ ] Review security policies

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    environment:
      NODE_ENV: production
      LOG_LEVEL: warn
    restart: always
    healthcheck:
      interval: 60s
      timeout: 10s
      retries: 5

  postgres:
    environment:
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=en_US.UTF-8"
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Deploy to Production

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Push to registry (if using)
docker tag keyloop-app:latest myregistry.com/keyloop-app:latest
docker push myregistry.com/keyloop-app:latest

# Deploy on production server
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Scaling & Load Balancing

```yaml
# In production docker-compose
services:
  app:
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

---

## Monitoring & Logging

### Application Logs

```bash
# Stream logs in real-time
docker-compose logs -f --timestamps

# Filter logs
docker-compose logs app | grep "error"

# Export logs to file
docker-compose logs > deployment.log

# Structured logging (JSON)
docker-compose logs --format json
```

### System Metrics

```bash
# Monitor resource usage
docker stats

# View detailed container info
docker inspect keyloop-app

# Check network usage
docker stats --no-stream
```

### Prometheus Metrics (Optional)

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### Log Aggregation (Optional)

```bash
# Using ELK Stack
docker run -d --name elasticsearch docker.elastic.co/elasticsearch/elasticsearch:8.0.0
docker run -d --name kibana docker.elastic.co/kibana/kibana:8.0.0
```

---

## Performance Optimization

### Container Optimization

```bash
# Multi-stage build (already in Dockerfile)
# - Reduces image size ~60%

# Alpine Linux base
# - Reduces image size to ~150MB

# Non-root user execution
# - Improves security
```

### Database Optimization

```bash
# Create indexes
docker-compose exec postgres psql -U postgres -d keyloop_db -c "CREATE INDEX idx_vin ON documents(vin);"

# Analyze query performance
docker-compose exec postgres psql -U postgres -d keyloop_db -c "EXPLAIN ANALYZE SELECT * FROM documents WHERE vin = 'WBADT43452G808140';"

# Monitor slow queries
docker-compose exec postgres psql -U postgres -d keyloop_db -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
```

### Network Optimization

```bash
# Use internal Docker network
# Services communicate via container names

# Enable compression for API responses
# Add gzip middleware in Express
```

---

## Cleanup & Maintenance

### Regular Maintenance

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Complete system cleanup
docker system prune -a --volumes
```

### Update Services

```bash
# Update base images
docker-compose pull

# Rebuild with latest base images
docker-compose build --pull

# Update and restart
docker-compose up -d
```

---

## Support & Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Node.js Docker Hub](https://hub.docker.com/_/node)
- [Best Practices for Node.js in Docker](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0
