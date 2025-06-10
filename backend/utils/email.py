import boto3
from botocore.exceptions import ClientError
import os
import logging

logger = logging.getLogger(__name__)

# AWS SES client
ses_client = boto3.client(
    'ses',
    region_name=os.getenv('AWS_REGION', 'us-east-1'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@devopsjobs.com')
COMPANY_NAME = 'DevOps Jobs'

def send_email(to_email, subject, html_body, text_body=None):
    """Send email using AWS SES"""
    try:
        if not text_body:
            text_body = html_body
        
        response = ses_client.send_email(
            Source=FROM_EMAIL,
            Destination={'ToAddresses': [to_email]},
            Message={
                'Subject': {'Data': subject},
                'Body': {
                    'Html': {'Data': html_body},
                    'Text': {'Data': text_body}
                }
            }
        )
        
        logger.info(f"Email sent successfully to {to_email}. Message ID: {response['MessageId']}")
        return True
        
    except ClientError as e:
        logger.error(f"Failed to send email to {to_email}: {e.response['Error']['Message']}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending email to {to_email}: {str(e)}")
        return False

def send_welcome_email(email, first_name):
    """Send welcome email to new users"""
    subject = f"Welcome to {COMPANY_NAME}!"
    
    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #3B82F6;">Welcome to {COMPANY_NAME}!</h1>
            
            <p>Hi {first_name},</p>
            
            <p>Thank you for joining {COMPANY_NAME}! We're excited to have you as part of our community.</p>
            
            <p>Here's what you can do next:</p>
            <ul>
                <li>Browse our latest DevOps job opportunities</li>
                <li>Complete your profile to attract employers</li>
                <li>Set up job alerts for positions that match your skills</li>
            </ul>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Best regards,<br>
            The {COMPANY_NAME} Team</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
                This email was sent to {email}. If you didn't create an account with us, please ignore this email.
            </p>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    Welcome to {COMPANY_NAME}!
    
    Hi {first_name},
    
    Thank you for joining {COMPANY_NAME}! We're excited to have you as part of our community.
    
    Here's what you can do next:
    - Browse our latest DevOps job opportunities
    - Complete your profile to attract employers
    - Set up job alerts for positions that match your skills
    
    If you have any questions, feel free to reach out to our support team.
    
    Best regards,
    The {COMPANY_NAME} Team
    """
    
    return send_email(email, subject, html_body, text_body)

def send_job_application_email(email, first_name, job_title, company, recipient_type, applicant_name=None):
    """Send job application confirmation emails"""
    
    if recipient_type == 'applicant':
        subject = f"Application Submitted: {job_title} at {company}"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #3B82F6;">Application Submitted Successfully!</h1>
                
                <p>Hi {first_name},</p>
                
                <p>Your application for the <strong>{job_title}</strong> position at <strong>{company}</strong> has been submitted successfully.</p>
                
                <p>What happens next:</p>
                <ul>
                    <li>The employer will review your application</li>
                    <li>You'll receive an email if they're interested in moving forward</li>
                    <li>You can track your application status in your dashboard</li>
                </ul>
                
                <p>Good luck with your application!</p>
                
                <p>Best regards,<br>
                The {COMPANY_NAME} Team</p>
            </div>
        </body>
        </html>
        """
        
    else:  # employer
        subject = f"New Application: {job_title}"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #3B82F6;">New Job Application Received</h1>
                
                <p>Hi {first_name},</p>
                
                <p>You have received a new application for your <strong>{job_title}</strong> position.</p>
                
                <p><strong>Applicant:</strong> {applicant_name}</p>
                
                <p>You can review the application and the candidate's details in your employer dashboard.</p>
                
                <p>Best regards,<br>
                The {COMPANY_NAME} Team</p>
            </div>
        </body>
        </html>
        """
    
    return send_email(email, subject, html_body)

def send_job_approval_email(email, first_name, job_title, status, reason=None):
    """Send job approval/rejection notification emails"""
    
    if status == 'approved':
        subject = f"Job Approved: {job_title}"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10B981;">Job Posting Approved!</h1>
                
                <p>Hi {first_name},</p>
                
                <p>Great news! Your job posting for <strong>{job_title}</strong> has been approved and is now live on our platform.</p>
                
                <p>Your job posting is now visible to all job seekers, and you'll start receiving applications soon.</p>
                
                <p>You can manage your job posting and view applications in your employer dashboard.</p>
                
                <p>Best regards,<br>
                The {COMPANY_NAME} Team</p>
            </div>
        </body>
        </html>
        """
        
    else:  # rejected
        subject = f"Job Posting Update: {job_title}"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #EF4444;">Job Posting Requires Revision</h1>
                
                <p>Hi {first_name},</p>
                
                <p>Your job posting for <strong>{job_title}</strong> requires some revisions before it can be published.</p>
                
                {f'<p><strong>Reason:</strong> {reason}</p>' if reason else ''}
                
                <p>Please review and update your job posting in your employer dashboard. Once you make the necessary changes, it will be reviewed again.</p>
                
                <p>If you have any questions, please don't hesitate to contact our support team.</p>
                
                <p>Best regards,<br>
                The {COMPANY_NAME} Team</p>
            </div>
        </body>
        </html>
        """
    
    return send_email(email, subject, html_body)