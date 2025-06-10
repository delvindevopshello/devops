from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Application, Job, User
import logging

applications_bp = Blueprint('applications', __name__)
logger = logging.getLogger(__name__)

@applications_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_applications():
    """Get all applications for the current user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'user':
            return jsonify({'message': 'Only job seekers can view their applications'}), 403
        
        applications = Application.query.filter_by(user_id=user_id)\
            .order_by(Application.created_at.desc()).all()
        
        applications_data = [app.to_dict(include_job=True) for app in applications]
        
        return jsonify(applications_data), 200
        
    except Exception as e:
        logger.error(f"Get user applications error: {str(e)}")
        return jsonify({'message': 'Failed to fetch applications'}), 500

@applications_bp.route('/job/<int:job_id>', methods=['GET'])
@jwt_required()
def get_job_applications(job_id):
    """Get all applications for a specific job (employer/admin only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        job = Job.query.get(job_id)
        
        if not job:
            return jsonify({'message': 'Job not found'}), 404
        
        # Check permissions
        if user.role == 'employer' and job.employer_id != user_id:
            return jsonify({'message': 'You can only view applications for your own jobs'}), 403
        elif user.role not in ['employer', 'admin']:
            return jsonify({'message': 'Insufficient permissions'}), 403
        
        applications = Application.query.filter_by(job_id=job_id)\
            .order_by(Application.created_at.desc()).all()
        
        applications_data = [app.to_dict(include_user=True) for app in applications]
        
        return jsonify(applications_data), 200
        
    except Exception as e:
        logger.error(f"Get job applications error: {str(e)}")
        return jsonify({'message': 'Failed to fetch applications'}), 500

@applications_bp.route('/<int:application_id>/status', methods=['PUT'])
@jwt_required()
def update_application_status(application_id):
    """Update application status (employer/admin only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        application = Application.query.get(application_id)
        
        if not application:
            return jsonify({'message': 'Application not found'}), 404
        
        job = Job.query.get(application.job_id)
        
        # Check permissions
        if user.role == 'employer' and job.employer_id != user_id:
            return jsonify({'message': 'You can only update applications for your own jobs'}), 403
        elif user.role not in ['employer', 'admin']:
            return jsonify({'message': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['pending', 'approved', 'rejected', 'interview']:
            return jsonify({'message': 'Invalid status'}), 400
        
        application.status = new_status
        db.session.commit()
        
        return jsonify({
            'message': 'Application status updated successfully',
            'application': application.to_dict(include_user=True, include_job=True)
        }), 200
        
    except Exception as e:
        logger.error(f"Update application status error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to update application status'}), 500

@applications_bp.route('/<int:application_id>', methods=['GET'])
@jwt_required()
def get_application(application_id):
    """Get a specific application"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        application = Application.query.get(application_id)
        
        if not application:
            return jsonify({'message': 'Application not found'}), 404
        
        # Check permissions
        job = Job.query.get(application.job_id)
        
        if user.role == 'user' and application.user_id != user_id:
            return jsonify({'message': 'You can only view your own applications'}), 403
        elif user.role == 'employer' and job.employer_id != user_id:
            return jsonify({'message': 'You can only view applications for your own jobs'}), 403
        elif user.role not in ['user', 'employer', 'admin']:
            return jsonify({'message': 'Insufficient permissions'}), 403
        
        include_user = user.role in ['employer', 'admin']
        include_job = user.role == 'user'
        
        return jsonify(application.to_dict(
            include_user=include_user,
            include_job=include_job
        )), 200
        
    except Exception as e:
        logger.error(f"Get application error: {str(e)}")
        return jsonify({'message': 'Failed to fetch application'}), 500