from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.Enum('user', 'employer', 'admin'), nullable=False, default='user')
    company = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    jobs = db.relationship('Job', backref='employer', lazy=True, cascade='all, delete-orphan')
    applications = db.relationship('Application', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'role': self.role,
            'company': self.company,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<User {self.email}>'

class Job(db.Model):
    __tablename__ = 'jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    requirements = db.Column(db.Text, nullable=False)
    benefits = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(200), nullable=False, index=True)
    salary_min = db.Column(db.Integer, nullable=True)
    salary_max = db.Column(db.Integer, nullable=True)
    skills = db.Column(db.JSON, nullable=False)  # Array of skills
    type = db.Column(db.Enum('full-time', 'part-time', 'contract', 'freelance'), nullable=False, default='full-time')
    experience_level = db.Column(db.Enum('entry', 'mid', 'senior', 'lead'), nullable=False, default='mid')
    remote = db.Column(db.Boolean, default=False)
    status = db.Column(db.Enum('pending', 'approved', 'rejected'), nullable=False, default='pending', index=True)
    company = db.Column(db.String(200), nullable=False)  # Denormalized for easier querying
    
    # Foreign keys
    employer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    applications = db.relationship('Application', backref='job', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_applications=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'requirements': self.requirements,
            'benefits': self.benefits,
            'location': self.location,
            'salaryMin': self.salary_min,
            'salaryMax': self.salary_max,
            'skills': self.skills,
            'type': self.type,
            'experienceLevel': self.experience_level,
            'remote': self.remote,
            'status': self.status,
            'company': self.company,
            'employerId': self.employer_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_applications:
            data['applications'] = [app.to_dict() for app in self.applications]
        else:
            data['applicationCount'] = len(self.applications)
            
        return data
    
    def __repr__(self):
        return f'<Job {self.title} at {self.company}>'

class Application(db.Model):
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    cover_letter = db.Column(db.Text, nullable=False)
    resume_url = db.Column(db.String(500), nullable=False)
    status = db.Column(db.Enum('pending', 'approved', 'rejected', 'interview'), nullable=False, default='pending', index=True)
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False, index=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint to prevent duplicate applications
    __table_args__ = (db.UniqueConstraint('user_id', 'job_id', name='unique_user_job_application'),)
    
    def to_dict(self, include_job=False, include_user=False):
        data = {
            'id': self.id,
            'coverLetter': self.cover_letter,
            'resumeUrl': self.resume_url,
            'status': self.status,
            'userId': self.user_id,
            'jobId': self.job_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_job and self.job:
            data['job'] = self.job.to_dict()
            
        if include_user and self.user:
            data['user'] = self.user.to_dict()
            
        return data
    
    def __repr__(self):
        return f'<Application {self.user_id} -> {self.job_id}>'