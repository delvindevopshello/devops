import pytest
import json
from app import app, db
from models import User, Job

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

@pytest.fixture
def auth_headers(client):
    """Create authenticated user and return auth headers"""
    # Register employer
    response = client.post('/api/auth/register', 
        json={
            'email': 'employer@example.com',
            'password': 'password123',
            'firstName': 'Jane',
            'lastName': 'Smith',
            'role': 'employer',
            'company': 'Tech Corp'
        })
    
    data = json.loads(response.data)
    token = data['token']
    
    return {'Authorization': f'Bearer {token}'}

def test_create_job(client, auth_headers):
    """Test job creation"""
    response = client.post('/api/jobs', 
        headers=auth_headers,
        json={
            'title': 'Senior DevOps Engineer',
            'description': 'We are looking for an experienced DevOps engineer...',
            'requirements': 'Experience with Docker, Kubernetes, AWS...',
            'location': 'San Francisco, CA',
            'skills': ['Docker', 'Kubernetes', 'AWS'],
            'salaryMin': 120000,
            'salaryMax': 150000,
            'type': 'full-time',
            'experienceLevel': 'senior',
            'remote': True
        })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['job']['title'] == 'Senior DevOps Engineer'
    assert data['job']['status'] == 'pending'

def test_get_jobs(client, auth_headers):
    """Test getting jobs list"""
    # Create a job first
    client.post('/api/jobs', 
        headers=auth_headers,
        json={
            'title': 'DevOps Engineer',
            'description': 'Job description...',
            'requirements': 'Job requirements...',
            'location': 'Remote',
            'skills': ['Docker', 'AWS']
        })
    
    # Approve the job (simulate admin approval)
    with app.app_context():
        job = Job.query.first()
        job.status = 'approved'
        db.session.commit()
    
    response = client.get('/api/jobs')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['jobs']) == 1
    assert data['jobs'][0]['title'] == 'DevOps Engineer'

def test_job_search(client, auth_headers):
    """Test job search functionality"""
    # Create multiple jobs
    jobs_data = [
        {
            'title': 'Senior DevOps Engineer',
            'description': 'Docker and Kubernetes experience required',
            'requirements': 'Requirements...',
            'location': 'San Francisco, CA',
            'skills': ['Docker', 'Kubernetes']
        },
        {
            'title': 'Cloud Engineer',
            'description': 'AWS cloud infrastructure',
            'requirements': 'Requirements...',
            'location': 'New York, NY',
            'skills': ['AWS', 'Terraform']
        }
    ]
    
    for job_data in jobs_data:
        client.post('/api/jobs', headers=auth_headers, json=job_data)
    
    # Approve all jobs
    with app.app_context():
        jobs = Job.query.all()
        for job in jobs:
            job.status = 'approved'
        db.session.commit()
    
    # Search for Docker
    response = client.get('/api/jobs?search=Docker')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['jobs']) == 1
    assert 'Docker' in data['jobs'][0]['title']

def test_unauthorized_job_creation(client):
    """Test job creation without authentication"""
    response = client.post('/api/jobs', 
        json={
            'title': 'DevOps Engineer',
            'description': 'Job description...',
            'requirements': 'Job requirements...',
            'location': 'Remote',
            'skills': ['Docker']
        })
    
    assert response.status_code == 401