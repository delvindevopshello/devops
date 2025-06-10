from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import db, Job, User, Application
from utils.email import send_job_approval_email
import logging

admin_bp = Blueprint('admin', __name__)
logger = logging.getLogger(__name__)

def require_admin():
    """Decorator to require admin role"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    return None

@admin_bp.route('/jobs/pending', methods=['GET'])
@jwt_required()
def get_pending_jobs():
    """Get all pending job approvals"""
    try:
        error_response = require_admin()
        if error_response:
            return error_response
        
        pending_jobs = Job.query.filter_by(status='pending')\
            .order_by(Job.created_at.desc()).all()
        
        jobs_data = []
        for job in pending_jobs:
            job_dict = job.to_dict()
            # Include employer information
            employer = User.query.get(job.employer_id)
            if employer:
                job_dict['employer'] = employer.to_dict()
            jobs_data.append(job_dict)
        
        return jsonify(jobs_data), 200
        
    except Exception as e:
        logger.error(f"Get pending jobs error: {str(e)}")
        return jsonify({'message': 'Failed to fetch pending jobs'}), 500

@admin_bp.route('/jobs/<int:job_id>/approve', methods=['POST'])
@jwt_required()
def approve_job(job_id):
    """Approve a job posting"""
    try:
        error_response = require_admin()
        if error_response:
            return error_response
        
        job = Job.query.get(job_id)
        
        if not job:
            return jsonify({'message': 'Job not found'}), 404
        
        if job.status != 'pending':
            return jsonify({'message': 'Job is not pending approval'}), 400
        
        job.status = 'approved'
        db.session.commit()
        
        # Send approval email to employer
        try:
            employer = User.query.get(job.employer_id)
            if employer:
                send_job_approval_email(
                    employer.email,
                    employer.first_name,
                    job.title,
                    'approved'
                )
        except Exception as e:
            logger.warning(f"Failed to send approval email: {str(e)}")
        
        return jsonify({
            'message': 'Job approved successfully',
            'job': job.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Approve job error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to approve job'}), 500

@admin_bp.route('/jobs/<int:job_id>/reject', methods=['POST'])
@jwt_required()
def reject_job(job_id):
    """Reject a job posting"""
    try:
        error_response = require_admin()
        if error_response:
            return error_response
        
        job = Job.query.get(job_id)
        
        if not job:
            return jsonify({'message': 'Job not found'}), 404
        
        if job.status != 'pending':
            return jsonify({'message': 'Job is not pending approval'}), 400
        
        data = request.get_json()
        rejection_reason = data.get('reason', 'No reason provided')
        
        job.status = 'rejected'
        db.session.commit()
        
        # Send rejection email to employer
        try:
            employer = User.query.get(job.employer_id)
            if employer:
                send_job_approval_email(
                    employer.email,
                    employer.first_name,
                    job.title,
                    'rejected',
                    reason=rejection_reason
                )
        except Exception as e:
            logger.warning(f"Failed to send rejection email: {str(e)}")
        
        return jsonify({
            'message': 'Job rejected successfully',
            'job': job.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Reject job error: {str(e)}")
        db.session.rollback()
        return jsonify({'message': 'Failed to reject job'}), 500

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    """Get platform statistics"""
    try:
        error_response = require_admin()
        if error_response:
            return error_response
        
        # Total counts
        total_users = User.query.count()
        total_jobs = Job.query.count()
        total_applications = Application.query.count()
        pending_jobs = Job.query.filter_by(status='pending').count()
        
        # Users by role
        users_by_role = db.session.query(
            User.role,
            func.count(User.id)
        ).group_by(User.role).all()
        
        users_by_role_dict = {role: count for role, count in users_by_role}
        
        # Jobs by status
        jobs_by_status = db.session.query(
            Job.status,
            func.count(Job.id)
        ).group_by(Job.status).all()
        
        jobs_by_status_dict = {status: count for status, count in jobs_by_status}
        
        # Applications by status
        applications_by_status = db.session.query(
            Application.status,
            func.count(Application.id)
        ).group_by(Application.status).all()
        
        applications_by_status_dict = {status: count for status, count in applications_by_status}
        
        # Recent activity (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        recent_users = User.query.filter(User.created_at >= thirty_days_ago).count()
        recent_jobs = Job.query.filter(Job.created_at >= thirty_days_ago).count()
        recent_applications = Application.query.filter(Application.created_at >= thirty_days_ago).count()
        
        stats = {
            'totalUsers': total_users,
            'totalJobs': total_jobs,
            'totalApplications': total_applications,
            'pendingJobs': pending_jobs,
            'usersByRole': users_by_role_dict,
            'jobsByStatus': jobs_by_status_dict,
            'applicationsByStatus': applications_by_status_dict,
            'recentActivity': {
                'users': recent_users,
                'jobs': recent_jobs,
                'applications': recent_applications
            }
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Get admin stats error: {str(e)}")
        return jsonify({'message': 'Failed to fetch statistics'}), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users (admin only)"""
    try:
        error_response = require_admin()
        if error_response:
            return error_response
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        # Limit the maximum number of results per page
        limit = min(limit, 100)
        
        users = User.query.order_by(User.created_at.desc())\
            .paginate(page=page, per_page=limit, error_out=False)
        
        users_data = [user.to_dict() for user in users.items]
        
        return jsonify({
            'users': users_data,
            'total': users.total,
            'page': page,
            'totalPages': users.pages,
            'hasNext': users.has_next,
            'hasPrev': users.has_prev
        }), 200
        
    except Exception as e:
        logger.error(f"Get all users error: {str(e)}")
        return jsonify({'message': 'Failed to fetch users'}), 500