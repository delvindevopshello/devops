import pytest
import json
from app import app, db
from models import User

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

def test_register_user(client):
    """Test user registration"""
    response = client.post('/api/auth/register', 
        json={
            'email': 'test@example.com',
            'password': 'password123',
            'firstName': 'John',
            'lastName': 'Doe',
            'role': 'user'
        })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'token' in data
    assert data['user']['email'] == 'test@example.com'

def test_register_employer(client):
    """Test employer registration"""
    response = client.post('/api/auth/register', 
        json={
            'email': 'employer@example.com',
            'password': 'password123',
            'firstName': 'Jane',
            'lastName': 'Smith',
            'role': 'employer',
            'company': 'Tech Corp'
        })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['user']['role'] == 'employer'
    assert data['user']['company'] == 'Tech Corp'

def test_login(client):
    """Test user login"""
    # First register a user
    client.post('/api/auth/register', 
        json={
            'email': 'test@example.com',
            'password': 'password123',
            'firstName': 'John',
            'lastName': 'Doe',
            'role': 'user'
        })
    
    # Then login
    response = client.post('/api/auth/login', 
        json={
            'email': 'test@example.com',
            'password': 'password123'
        })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'token' in data
    assert data['user']['email'] == 'test@example.com'

def test_invalid_login(client):
    """Test login with invalid credentials"""
    response = client.post('/api/auth/login', 
        json={
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        })
    
    assert response.status_code == 401
    data = json.loads(response.data)
    assert 'Invalid email or password' in data['message']

def test_duplicate_email(client):
    """Test registration with duplicate email"""
    # Register first user
    client.post('/api/auth/register', 
        json={
            'email': 'test@example.com',
            'password': 'password123',
            'firstName': 'John',
            'lastName': 'Doe',
            'role': 'user'
        })
    
    # Try to register with same email
    response = client.post('/api/auth/register', 
        json={
            'email': 'test@example.com',
            'password': 'password456',
            'firstName': 'Jane',
            'lastName': 'Smith',
            'role': 'user'
        })
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'User already exists' in data['message']