# DevOps Job Board

A comprehensive full-stack job board application specifically designed for DevOps professionals, built with modern technologies and production-ready architecture.

## 🚀 Features

### Frontend (React)
- **User Authentication**: JWT-based login/registration with role management
- **Job Browsing**: Advanced search and filtering capabilities
- **Application Management**: Track application status and history
- **Role-Based Dashboards**: Customized interfaces for job seekers, employers, and admins
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Feedback**: Toast notifications and loading states

### Backend (Flask)
- **RESTful API**: Comprehensive API with proper error handling
- **Database**: MySQL with SQLAlchemy ORM
- **Caching**: Redis for session management and performance
- **Email Service**: AWS SES integration for notifications
- **Authentication**: JWT tokens with role-based access control
- **Admin Panel**: Job moderation and platform statistics

### Infrastructure
- **Containerized**: Docker and Docker Compose setup
- **Database**: MySQL 8.0 with proper indexing
- **Caching**: Redis for session storage and application stats
- **Reverse Proxy**: Nginx configuration included
- **Health Checks**: Comprehensive monitoring endpoints

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Flask)       │◄──►│   (MySQL)       │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │     Redis       │              │
         └──────────────►│   (Cache)       │◄─────────────┘
                        │   Port: 6379    │
                        └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for data fetching
- **React Hook Form** with Zod validation
- **Axios** for API communication

### Backend
- **Flask** with Python 3.11
- **SQLAlchemy** ORM with MySQL
- **Flask-JWT-Extended** for authentication
- **Redis** for caching and sessions
- **Boto3** for AWS SES email service
- **pytest** for testing

### Infrastructure
- **Docker & Docker Compose**
- **MySQL 8.0**
- **Redis 7**
- **Nginx** (reverse proxy)

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd devops-job-board
make setup
```

### 2. Configure Environment
Edit the `.env` file with your configuration:
```bash
# AWS SES Configuration (for email notifications)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
FROM_EMAIL=noreply@yourdomain.com

# Change these in production!
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
```

### 3. Start the Application
```bash
make start
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Full Application**: http://localhost (via Nginx)

## 📋 Available Commands

```bash
make help      # Show all available commands
make setup     # Set up development environment
make start     # Start all services
make stop      # Stop all services
make restart   # Restart all services
make logs      # View service logs
make test      # Run tests
make clean     # Clean up containers and volumes
make build     # Build Docker images
```

## 🔧 Development

### Local Development (without Docker)

#### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
# All tests
make test

# Backend only
cd backend && python -m pytest tests/ -v

# Frontend only
cd frontend && npm test
```

## 🗄️ Database Schema

### Users Table
- User authentication and profile information
- Role-based access (user, employer, admin)
- Company information for employers

### Jobs Table
- Job postings with detailed information
- Skills array, salary ranges, location
- Status tracking (pending, approved, rejected)

### Applications Table
- Job applications with cover letters and resumes
- Application status tracking
- Unique constraint to prevent duplicate applications

## 🔐 Authentication & Authorization

### Roles
- **User**: Can browse jobs and submit applications
- **Employer**: Can post jobs and manage applications
- **Admin**: Can approve/reject jobs and view platform statistics

### JWT Tokens
- 7-day expiration
- Role-based access control
- Secure token validation

## 📧 Email Notifications

The application sends automated emails for:
- Welcome messages for new users
- Application confirmations
- Job approval/rejection notifications
- Application status updates

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Jobs
- `GET /api/jobs` - List jobs with pagination and search
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job (employers only)
- `PUT /api/jobs/:id` - Update job (employers only)
- `DELETE /api/jobs/:id` - Delete job (employers only)
- `POST /api/jobs/:id/apply` - Apply to job (users only)

### Applications
- `GET /api/applications/user` - Get user's applications
- `GET /api/applications/job/:id` - Get job applications (employers/admin)
- `PUT /api/applications/:id/status` - Update application status

### Admin
- `GET /api/admin/jobs/pending` - Get pending job approvals
- `POST /api/admin/jobs/:id/approve` - Approve job
- `POST /api/admin/jobs/:id/reject` - Reject job
- `GET /api/admin/stats` - Get platform statistics

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Update all secret keys and credentials
2. **Database**: Use managed MySQL service (AWS RDS, Google Cloud SQL)
3. **Redis**: Use managed Redis service (AWS ElastiCache, Redis Cloud)
4. **Email**: Configure AWS SES with verified domain
5. **SSL**: Add SSL certificates for HTTPS
6. **Monitoring**: Implement logging and monitoring solutions

### Docker Production Build
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testing

### Backend Tests
- Unit tests for all API endpoints
- Authentication and authorization tests
- Database model tests
- Email service tests

### Frontend Tests
- Component unit tests
- Integration tests for user flows
- API integration tests

## 📊 Monitoring & Health Checks

### Health Check Endpoint
`GET /api/health` - Returns system status including database and Redis connectivity

### Logging
- Structured logging with different levels
- Request/response logging
- Error tracking and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints and examples

## 🔮 Future Enhancements

- Real-time notifications with WebSockets
- Advanced search with Elasticsearch
- File upload for resumes
- Video interview scheduling
- Salary insights and analytics
- Mobile application
- Integration with LinkedIn and other job boards