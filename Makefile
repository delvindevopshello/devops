.PHONY: help setup start stop restart logs clean test build

# Default target
help:
	@echo "DevOps Job Board - Available Commands:"
	@echo ""
	@echo "  setup     - Set up the development environment"
	@echo "  start     - Start all services with Docker Compose"
	@echo "  stop      - Stop all services"
	@echo "  restart   - Restart all services"
	@echo "  logs      - View logs from all services"
	@echo "  clean     - Clean up containers and volumes"
	@echo "  test      - Run tests"
	@echo "  build     - Build all Docker images"
	@echo ""

# Set up development environment
setup:
	@echo "Setting up development environment..."
	@cp .env.example .env
	@echo "Created .env file from template"
	@echo "Please edit .env file with your configuration"
	@echo ""
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install
	@echo ""
	@echo "Installing backend dependencies..."
	@cd backend && pip install -r requirements.txt
	@echo ""
	@echo "Setup complete! Edit .env file and run 'make start'"

# Start all services
start:
	@echo "Starting DevOps Job Board..."
	@docker-compose up -d
	@echo ""
	@echo "Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:5000"
	@echo "Nginx: http://localhost:80"
	@echo ""
	@echo "Run 'make logs' to view logs"

# Stop all services
stop:
	@echo "Stopping all services..."
	@docker-compose down

# Restart all services
restart: stop start

# View logs
logs:
	@docker-compose logs -f

# Clean up
clean:
	@echo "Cleaning up containers and volumes..."
	@docker-compose down -v
	@docker system prune -f
	@echo "Cleanup complete!"

# Run tests
test:
	@echo "Running backend tests..."
	@cd backend && python -m pytest tests/ -v
	@echo ""
	@echo "Running frontend tests..."
	@cd frontend && npm test

# Build Docker images
build:
	@echo "Building Docker images..."
	@docker-compose build --no-cache

# Development mode (without Docker)
dev-backend:
	@echo "Starting backend in development mode..."
	@cd backend && python app.py

dev-frontend:
	@echo "Starting frontend in development mode..."
	@cd frontend && npm run dev

# Database operations
db-reset:
	@echo "Resetting database..."
	@docker-compose exec mysql mysql -u root -prootpassword -e "DROP DATABASE IF EXISTS devops_jobs; CREATE DATABASE devops_jobs;"
	@docker-compose restart backend

# View application status
status:
	@echo "Service Status:"
	@docker-compose ps