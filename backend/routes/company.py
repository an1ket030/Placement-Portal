from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db
from models import User, CompanyProfile, PlacementDrive, Application, StudentProfile

company_bp = Blueprint('company', __name__)

def get_company_profile():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') != 'company':
        return None
    return CompanyProfile.query.filter_by(user_id=user_id).first()

@company_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    company = get_company_profile()
    if not company:
        return jsonify({'message': 'Company access required'}), 403

    drives = PlacementDrive.query.filter_by(company_id=company.id).all()
    drives_data = []
    for d in drives:
        drives_data.append({
            'id': d.id,
            'job_title': d.job_title,
            'job_description': d.job_description,
            'eligibility_branch': d.eligibility_branch,
            'eligibility_cgpa': d.eligibility_cgpa,
            'eligibility_year': d.eligibility_year,
            'application_deadline': d.application_deadline,
            'status': d.status,
            'applications_count': Application.query.filter_by(drive_id=d.id).count()
        })

    return jsonify({
        'company': {
            'id': company.id,
            'company_name': company.company_name,
            'hr_contact': company.hr_contact,
            'website': company.website,
            'description': company.description,
            'approval_status': company.approval_status
        },
        'drives': drives_data
    }), 200

@company_bp.route('/drives', methods=['POST'])
@jwt_required()
def create_drive():
    company = get_company_profile()
    if not company:
        return jsonify({'message': 'Company access required'}), 403

    if company.approval_status != 'Approved':
        return jsonify({'message': 'Your company is not yet approved'}), 403

    data = request.get_json()
    drive = PlacementDrive(
        company_id=company.id,
        job_title=data.get('job_title', ''),
        job_description=data.get('job_description', ''),
        eligibility_branch=data.get('eligibility_branch', ''),
        eligibility_cgpa=data.get('eligibility_cgpa', 0.0),
        eligibility_year=data.get('eligibility_year', 0),
        application_deadline=data.get('application_deadline', ''),
        status='Pending'
    )
    db.session.add(drive)
    db.session.commit()
    return jsonify({'message': 'Placement drive created. Waiting for admin approval.'}), 201

@company_bp.route('/drives/<int:drive_id>', methods=['PUT'])
@jwt_required()
def edit_drive(drive_id):
    company = get_company_profile()
    if not company:
        return jsonify({'message': 'Company access required'}), 403

    drive = PlacementDrive.query.get(drive_id)
    if not drive or drive.company_id != company.id:
        return jsonify({'message': 'Drive not found'}), 404

    data = request.get_json()
    drive.job_title = data.get('job_title', drive.job_title)
    drive.job_description = data.get('job_description', drive.job_description)
    drive.eligibility_branch = data.get('eligibility_branch', drive.eligibility_branch)
    drive.eligibility_cgpa = data.get('eligibility_cgpa', drive.eligibility_cgpa)
    drive.eligibility_year = data.get('eligibility_year', drive.eligibility_year)
    drive.application_deadline = data.get('application_deadline', drive.application_deadline)
    db.session.commit()
    return jsonify({'message': 'Drive updated'}), 200

@company_bp.route('/drives/<int:drive_id>', methods=['DELETE'])
@jwt_required()
def delete_drive(drive_id):
    company = get_company_profile()
    if not company:
        return jsonify({'message': 'Company access required'}), 403

    drive = PlacementDrive.query.get(drive_id)
    if not drive or drive.company_id != company.id:
        return jsonify({'message': 'Drive not found'}), 404

    # delete related applications first
    Application.query.filter_by(drive_id=drive_id).delete()
    db.session.delete(drive)
    db.session.commit()
    return jsonify({'message': 'Drive deleted'}), 200

@company_bp.route('/drives/<int:drive_id>/close', methods=['POST'])
@jwt_required()
def close_drive(drive_id):
    company = get_company_profile()
    if not company:
        return jsonify({'message': 'Company access required'}), 403

    drive = PlacementDrive.query.get(drive_id)
    if not drive or drive.company_id != company.id:
        return jsonify({'message': 'Drive not found'}), 404

    drive.status = 'Closed'
    db.session.commit()
    return jsonify({'message': 'Drive closed'}), 200

@company_bp.route('/drives/<int:drive_id>/applications', methods=['GET'])
@jwt_required()
def view_applications(drive_id):
    company = get_company_profile()
    if not company:
        return jsonify({'message': 'Company access required'}), 403

    drive = PlacementDrive.query.get(drive_id)
    if not drive or drive.company_id != company.id:
        return jsonify({'message': 'Drive not found'}), 404

    applications = db.session.query(Application, StudentProfile, User).join(
        StudentProfile, Application.student_id == StudentProfile.id
    ).join(
        User, StudentProfile.user_id == User.id
    ).filter(Application.drive_id == drive_id).all()

    result = []
    for app, student, user in applications:
        result.append({
            'id': app.id,
            'student_name': user.name,
            'email': user.email,
            'roll_no': student.roll_no,
            'branch': student.branch,
            'cgpa': student.cgpa,
            'year': student.year,
            'phone': student.phone,
            'resume': student.resume_filename,
            'application_date': app.application_date.strftime('%Y-%m-%d') if app.application_date else '',
            'status': app.status
        })
    return jsonify(result), 200

@company_bp.route('/applications/<int:app_id>/status', methods=['POST'])
@jwt_required()
def update_application_status(app_id):
    company = get_company_profile()
    if not company:
        return jsonify({'message': 'Company access required'}), 403

    application = Application.query.get(app_id)
    if not application:
        return jsonify({'message': 'Application not found'}), 404

    # verify this application belongs to a drive owned by this company
    drive = PlacementDrive.query.get(application.drive_id)
    if not drive or drive.company_id != company.id:
        return jsonify({'message': 'Not authorized'}), 403

    data = request.get_json()
    new_status = data.get('status')
    if new_status not in ['Applied', 'Shortlisted', 'Selected', 'Rejected']:
        return jsonify({'message': 'Invalid status'}), 400

    application.status = new_status
    db.session.commit()
    return jsonify({'message': f'Application status updated to {new_status}'}), 200
