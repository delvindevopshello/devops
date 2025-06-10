from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import redis
import boto3
from botocore.exceptions import ClientError
import json
import logging
import time
import sys

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql+pymysql://root:password@localhost/devops_jobs')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def wait_for_db():
    """Wait for database to be available"""
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Test database connection
            db.session.execute('SELECT 1')
            logger.info("Database connection successful")
            return True
        except Exception as e:
            retry_count += 1
            logger.warning(f"Database connection attempt {retry_count}/{max_retries} failed: {str(e)}")
            if retry_count < max_retries:
                time.sleep(2)
            else:
                logger.error("Failed to connect to database after maximum retries")
                return False

def wait_for_redis():
    """Wait for Redis to be available"""
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                db=0,
                decode_responses=True
            )
            redis_client.ping()
            logger.info("Redis connection successful")
            return redis_client
        except Exception as e:
            retry_count += 1
            logger.warning(f"Redis connection attempt {retry_count}/{max_retries} failed: {str(e)}")
            if retry_count < max_retries:
                time.sleep(2)
            else:
                logger.error("Failed to connect to Redis after maximum retries")
                return None

# Wait for dependencies
logger.info("Waiting for database...")
if not wait_for_db():
    logger.error("Could not connect to database. Exiting.")
    sys.exit(1)

logger.info("Waiting for Redis...")
redis_client = wait_for_redis()
if not redis_client:
    logger.warning("Could not connect to Redis. Continuing without Redis.")
    redis_client = None

# AWS SES client (optional)
try:
    ses_client = boto3.client(
        'ses',
        region_name=os.getenv('AWS_REGION', 'us-east-1'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
except Exception as e:
    logger.warning(f"AWS SES not configured: {str(e)}")
    ses_client = None

# Import models and routes
from models import User, Job, Application
from routes.auth import auth_bp
from routes.jobs import jobs_bp
from routes.applications import applications_bp
from routes.admin import admin_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
app.register_blueprint(applications_bp, url_prefix='/api/applications')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        
        # Test Redis connection
        redis_status = 'connected'
        if redis_client:
            try:
                redis_client.ping()
            except:
                redis_status = 'disconnected'
        else:
            redis_status = 'not_configured'
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'redis': redis_status,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'message': 'Internal server error'}), 500

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'message': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'message': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'message': 'Authorization token is required'}), 401

if __name__ == '__main__':
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Create admin user if it doesn't exist
        try:
            admin_user = User.query.filter_by(email='admin@devopsjobs.com').first()
            if not admin_user:
                admin_user = User(
                    email='admin@devopsjobs.com',
                    password_hash=generate_password_hash('admin123'),
                    first_name='Admin',
                    last_name='User',
                    role='admin'
                )
                db.session.add(admin_user)
                db.session.commit()
                logger.info("Admin user created")
        except Exception as e:
            logger.error(f"Failed to create admin user: {str(e)}")
    
    logger.info("Starting Flask application...")
    app.run(debug=True, host='0.0.0.0', port=5000)