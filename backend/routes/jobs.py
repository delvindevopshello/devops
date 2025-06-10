from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import or_, and_
from models import db, Job, User, Application
from utils.email import send_job_application_email
import logging

jobs_bp = Blueprint('jobs', __name__)
logger = logging.getLogger(__name__)

@jobs_bp.route('', methods=['GET'])
def get_jobs():
    """Get all approved jobs with pagination and filtering"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '').strip()
        location = request.args.get('location', '').strip()
        
        # Limit the maximum number of results per page
        limit = min(limit, 50)
        
        # Base query - only approved jobs
        query = Job.query.filter(Job.status == 'approved')
        
        # Apply search filters
        if search:
            search_filter = or_(
                Job.title.ilike(f'%{search}%'),
                Job.description.ilike(f'%{search}%'),
                Job.company.ilike(f'%{search}%'),
                Job.skills.contains([search])
            )
            query = query.filter(search_filter)
        
        if location:
            query = query.filter(Job.location.ilike(f'%{location}%'))
        
        # Order by creation date (newest first)
        query = query.order_by(Job.created_at.desc())
        
        # Paginate
        paginated = query.paginate(
            page=page, 
            per_page=limit, 
            error_out=False
        )
        
        jobs = [job.to_dict() for job in paginated.items]
        
        return jsonify({
            'jobs': jobs,
            'total': paginated.total,
            'page': page,
            'totalPages': paginated.pages,
            'hasNext': paginated.has_next,
            'hasPrev': paginated.has_prev
        }), 200
        
    except Exception as e:
        logger.error(f"Get jobs error: {str(e)}")
        return jsonify({'message': 'Failed to fetch jobs'}), 500

@jobs_bp.route('/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get a specific job by ID"""
    try:
        job = Job.query.get(job_id)
        
        if not job:
            return jsonify({'message': 'Job not found'}), 404
        
        # Include applications if user is the employer or admin
        include_applications = False
        try:
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if user_id:
                user = User.query.get(user_id)
                if user and (user.role == 'admin' or job.employer_id == user_id):
                    include_applications = True
        except:
            pass
        
        return jsonify(job.to_dict(include_applications=include_applications)), 200
        
    except Exception as e:
        logger.error(f"Get job error: {str(e)}")
        return jsonify({'message': 'Failed to fetch job'}), 500

@jobs_bp.route('', methods=['POST'])
@jwt_required()
def create_job():
    """Create a new job posting (employers only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'employer':
            return jsonify({'message': 'Only employers can create jobs'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'requirements', 'location', 'skills']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        # Validate skills is a list
        if not isinstance(data['skills'], list) or len(data['skills']) == 0:
            return jsonify({'message': 'At least one skill is required'}), 400
        
        # Validate salary range
        salary_min = data.get('salaryMin')
        salary_max = data.get('salaryMax')
        if salary_min and salary_max and salary_max < salary_min:
            return jsonify({'message': 'Maximum salary must be greater than minimum salary'}), 400
        
        # Create new job
        job = Job(
            title=data['title'],
            description=data['description'],
            requirements=data['requirements'],
            benefits=data.get('benefits'),
            location=data['location'],
            salary_min=salary_min,
            salary_max=salary_max,
            skills=data['skills'],
            type=data.get('type', 'full-time'),
            experience_level=data.get('experienceLevel', 'mid'),
            remote=data.get('remote', False),
            company=user.company,
            employer_id=user_id
        )
        
        db.session.add(job)
        db.session.commit()
        
        return jsonify({
            'message': 'Job created successfully and is pending approval',
            'job': job.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Create job error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to create job'}), 500

@jobs_bp.route('/<int:job_id>', methods=['PUT'])
@jwt_required()
def update_job(job_id):
    """Update a job posting (employer only, own jobs)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'employer':
            return jsonify({'message': 'Only employers can update jobs'}), 403
        
        job = Job.query.get(job_id)
        
        if not job:
            return jsonify({'message': 'Job not found'}), 404
        
        if job.employer_id != user_id:
            return jsonify({'message': 'You can only update your own jobs'}), 403
        
        data = request.get_json()
        
        # Update allowed fields
        updatable_fields = {
            'title': 'title',
            'description': 'description',
            'requirements': 'requirements',
            'benefits': 'benefits',
            'location': 'location',
            'salaryMin': 'salary_min',
            'salaryMax': 'salary_max',
            'skills': 'skills',
            'type': 'type',
            'experienceLevel': 'experience_level',
            'remote': 'remote'
        }
        
        for frontend_field, db_field in updatable_fields.items():
            if frontend_field in data:
                setattr(job, db_field, data[frontend_field])
        
        # Reset status to pending if job was previously rejected/approved
        if job.status in ['approved', 'rejected']:
            job.status = 'pending'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Job updated successfully',
            'job': job.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Update job error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to update job'}), 500

@jobs_bp.route('/<int:job_id>', methods=['DELETE'])
@jwt_required()
def delete_job(job_id):
    """Delete a job posting (employer only, own jobs)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'employer':
            return jsonify({'message': 'Only employers can delete jobs'}), 403
        
        job = Job.query.get(job_id)
        
        if not job:
            return jsonify({'message': 'Job not found'}), 404
        
        if job.employer_id != user_id:
            return jsonify({'message': 'You can only delete your own jobs'}), 403
        
        db.session.delete(job)
        db.session.commit()
        
        return jsonify({'message': 'Job deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Delete job error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to delete job'}), 500

@jobs_bp.route('/<int:job_id>/apply', methods=['POST'])
@jwt_required()
def apply_to_job(job_id):
    """Apply to a job (users only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'user':
            return jsonify({'message': 'Only job seekers can apply to jobs'}), 403
        
        job = Job.query.get(job_id)
        
        if not job:
            return jsonify({'message': 'Job not found'}), 404
        
        if job.status != 'approved':
            return jsonify({'message': 'This job is not available for applications'}), 400
        
        # Check if user already applied
        existing_application = Application.query.filter_by(
            user_id=user_id,
            job_id=job_id
        ).first()
        
        if existing_application:
            return jsonify({'message': 'You have already applied to this job'}), 400
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('coverLetter') or not data.get('resume'):
            return jsonify({'message': 'Cover letter and resume URL are required'}), 400
        
        # Create application
        application = Application(
            user_id=user_id,
            job_id=job_id,
            cover_letter=data['coverLetter'],
            resume_url=data['resume']
        )
        
        db.session.add(application)
        db.session.commit()
        
        # Send email notifications
        try:
            # Email to applicant
            send_job_application_email(
                user.email,
                user.first_name,
                job.title,
                job.company,
                'applicant'
            )
            
            # Email to employer
            employer = User.query.get(job.employer_id)
            if employer:
                send_job_application_email(
                    employer.email,
                    employer.first_name,
                    job.title,
                    job.company,
                    'employer',
                    applicant_name=f"{user.first_name} {user.last_name}"
                )
        except Exception as e:
            logger.warning(f"Failed to send application emails: {str(e)}")
        
        return jsonify({
            'message': 'Application submitted successfully',
            'application': application.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Apply to job error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to submit application'}), 500