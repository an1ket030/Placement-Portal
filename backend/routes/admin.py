from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from extensions import db, cache
from models import User, CompanyProfile, StudentProfile, PlacementDrive, Application

admin_bp = Blueprint('admin', __name__)

# helper to check admin role
def is_admin():
    claims = get_jwt()
    return claims.get('role') == 'admin'

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), 403

    stats = {
        'total_students': StudentProfile.query.count(),
        'total_companies': CompanyProfile.query.count(),
        'total_drives': PlacementDrive.query.count(),
        'total_applications': Application.query.count()
    }
    return jsonify(stats), 200

@admin_bp.route('/companies', methods=['GET'])
@jwt_required()
def list_companies():
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), 403

    search = request.args.get('q', '')
    query = CompanyProfile.query
    if search:
        query = query.filter(CompanyProfile.company_name.ilike(f'%{search}%'))

    companies = query.all()
    result = []
    for c in companies:
        user = User.query.get(c.user_id)
        result.append({
            'id': c.id,
            'user_id': c.user_id,
            'company_name': c.company_name,
            'hr_contact': c.hr_contact,
            'website': c.website,
            'description': c.description,
            'approval_status': c.approval_status,
            'is_blacklisted': user.is_blacklisted if user else False,
            'email': user.email if user else ''
        })
    return jsonify(result), 200

@admin_bp.route('/companies/<int:company_id>/approve', methods=['POST'])
@jwt_required()
def approve_company(company_id):
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), 403

    company = CompanyProfile.query.get(company_id)
    if not company:
        return jsonify({'message': 'Company not found'}), 404

    company.approval_status = 'Approved'
    db.session.commit()
    return jsonify({'message': 'Company approved'}), 200

@admin_bp.route('/companies/<int:company_id>/reject', methods=['POST'])
@jwt_required()
def reject_company(company_id):
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), 403

    company = CompanyProfile.query.get(company_id)
    if not company:
        return jsonify({'message': 'Company not found'}), 404

    company.approval_status = 'Rejected'
    db.session.commit()
    return jsonify({'message': 'Company rejected'}), 200

@admin_bp.route('/companies/<int:company_id>/blacklist', methods=['POST'])
@jwt_required()
def blacklist_company(company_id):
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), 403

    company = CompanyProfile.query.get(company_id)
    if not company:
        return jsonify({'message': 'Company not found'}), 404

    user = User.query.get(company.user_id)
    if user:
        user.is_blacklisted = not user.is_blacklisted
        db.session.commit()
    return jsonify({'message': 'Company blacklist status updated'}), 200

@admin_bp.route('/students', methods=['GET'])
@jwt_required()
def list_students():
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), 403

    search = request.args.get('q', '')
    query = db.session.query(StudentProfile, User).join(User, StudentProfile.user_id == User.id)
    if search:
        query = query.filter(
            db.or_(
                User.name.ilike(f'%{search}%'),
                StudentProfile.roll_no.ilike(f'%{search}%'),
                StudentProfile.phone.ilike(f'%{search}%')
            )
        )

    students = query.all()
    result = []
    for s, u in students:
        result.append({
            'id': s.id,
            'user_id': s.user_id,
            'name': u.name,
            'email': u.email,
            'roll_no': s.roll_no,
            'branch': s.branch,
            'cgpa': s.cgpa,
            'year': s.year,
            'phone': s.phone,
            'is_blacklisted': u.is_blacklisted
        })
    return jsonify(result), 200

@admin_bp.route('/students/<int:student_id>/blacklist', methods=['POST'])
@jwt_required()
def blacklist_student(student_id):
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), 403

    student = StudentProfile.query.get(student_id)
    if not student:
        return jsonify({'message': 'Student not found'}), 404

    user = User.query.get(student.user_id)
    if user:
        user.is_blacklisted = not user.is_blacklisted
        db.session.commit()
    return jsonify({'message': 'Student blacklist status updated'}), 200

@admin_bp.route('/drives', methods=['GET'])
@jwt_required()
def list_drives():
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), 403

    drives = PlacementDrive.query.all()
    result = []
    for d in drives:
        company = CompanyProfile.query.get(d.company_id)
        result.append({
            'id': d.id,
            'company_name': company.company_name if company else 'Unknown',
            'job_title': d.job_title,
            'job_description': d.job_description,
            'eligibility_branch': d.eligibility_branch,
            'eligibility_cgpa': d.eligibility_cgpa,
            'eligibility_year': d.eligibility_year,
            'application_deadline': d.application_deadline,
            'status': d.status,
            'applications_count': Application.query.filter_by(drive_id=d.id).count()
        })
    return jsonify(result), 200

@admin_bp.route('/drives/<int:drive_id>/approve', methods=['POST'])
@jwt_required()
def approve_drive(drive_id):
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), 403

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({'message': 'Drive not found'}), 404

    drive.status = 'Approved'
    db.session.commit()
    return jsonify({'message': 'Drive approved'}), 200

@admin_bp.route('/drives/<int:drive_id>/reject', methods=['POST'])
@jwt_required()
def reject_drive(drive_id):
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), 403

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({'message': 'Drive not found'}), 404

    drive.status = 'Rejected'
    db.session.commit()
    return jsonify({'message': 'Drive rejected'}), 200

@admin_bp.route('/applications', methods=['GET'])
@jwt_required()
def list_applications():
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), 403

    applications = db.session.query(Application, StudentProfile, PlacementDrive, CompanyProfile).join(
        StudentProfile, Application.student_id == StudentProfile.id
    ).join(
        PlacementDrive, Application.drive_id == PlacementDrive.id
    ).join(
        CompanyProfile, PlacementDrive.company_id == CompanyProfile.id
    ).all()

    result = []
    for app, student, drive, company in applications:
        user = User.query.get(student.user_id)
        result.append({
            'id': app.id,
            'student_name': user.name if user else 'Unknown',
            'roll_no': student.roll_no,
            'company_name': company.company_name,
            'job_title': drive.job_title,
            'application_date': app.application_date.strftime('%Y-%m-%d') if app.application_date else '',
            'status': app.status
        })
    return jsonify(result), 200
