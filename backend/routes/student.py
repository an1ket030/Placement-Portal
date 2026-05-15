from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename
from extensions import db, cache
from models import User, StudentProfile, PlacementDrive, Application, CompanyProfile
import os

student_bp = Blueprint('student', __name__)

def get_student_profile():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') != 'student':
        return None
    return StudentProfile.query.filter_by(user_id=user_id).first()

@student_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    student = get_student_profile()
    if not student:
        return jsonify({'message': 'Student access required'}), 403

    user = User.query.get(student.user_id)
    return jsonify({
        'id': student.id,
        'name': user.name,
        'email': user.email,
        'roll_no': student.roll_no,
        'branch': student.branch,
        'cgpa': student.cgpa,
        'year': student.year,
        'phone': student.phone,
        'resume': student.resume_filename
    }), 200

@student_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    student = get_student_profile()
    if not student:
        return jsonify({'message': 'Student access required'}), 403

    # handle form data (because of file upload)
    student.roll_no = request.form.get('roll_no', student.roll_no)
    student.branch = request.form.get('branch', student.branch)
    student.phone = request.form.get('phone', student.phone)
    
    cgpa = request.form.get('cgpa')
    if cgpa:
        try:
            student.cgpa = float(cgpa)
        except ValueError:
            pass
    
    year = request.form.get('year')
    if year:
        try:
            student.year = int(year)
        except ValueError:
            pass

    # handle resume upload
    if 'resume' in request.files:
        file = request.files['resume']
        if file and file.filename:
            filename = secure_filename(f"resume_{student.user_id}_{file.filename}")
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            student.resume_filename = filename

    # also update name if provided
    name = request.form.get('name')
    if name:
        user = User.query.get(student.user_id)
        user.name = name

    db.session.commit()
    return jsonify({'message': 'Profile updated'}), 200

@student_bp.route('/drives', methods=['GET'])
@jwt_required()
@cache.cached(timeout=60, query_string=True)
def list_drives():
    student = get_student_profile()
    if not student:
        return jsonify({'message': 'Student access required'}), 403

    search = request.args.get('q', '')
    query = db.session.query(PlacementDrive, CompanyProfile).join(
        CompanyProfile, PlacementDrive.company_id == CompanyProfile.id
    ).filter(PlacementDrive.status == 'Approved')

    if search:
        query = query.filter(
            db.or_(
                PlacementDrive.job_title.ilike(f'%{search}%'),
                CompanyProfile.company_name.ilike(f'%{search}%')
            )
        )

    drives = query.all()
    result = []
    for d, c in drives:
        # check if student already applied
        existing = Application.query.filter_by(student_id=student.id, drive_id=d.id).first()
        result.append({
            'id': d.id,
            'company_name': c.company_name,
            'job_title': d.job_title,
            'job_description': d.job_description,
            'eligibility_branch': d.eligibility_branch,
            'eligibility_cgpa': d.eligibility_cgpa,
            'eligibility_year': d.eligibility_year,
            'application_deadline': d.application_deadline,
            'already_applied': existing is not None
        })
    return jsonify(result), 200

@student_bp.route('/apply/<int:drive_id>', methods=['POST'])
@jwt_required()
def apply_drive(drive_id):
    student = get_student_profile()
    if not student:
        return jsonify({'message': 'Student access required'}), 403

    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({'message': 'Drive not found'}), 404

    if drive.status != 'Approved':
        return jsonify({'message': 'This drive is not open for applications'}), 400

    # check duplicate
    existing = Application.query.filter_by(student_id=student.id, drive_id=drive_id).first()
    if existing:
        return jsonify({'message': 'You have already applied for this drive'}), 409

    application = Application(
        student_id=student.id,
        drive_id=drive_id,
        status='Applied'
    )
    db.session.add(application)
    db.session.commit()

    # clear cache for drives listing
    cache.clear()

    return jsonify({'message': 'Application submitted successfully'}), 201

@student_bp.route('/applications', methods=['GET'])
@jwt_required()
def my_applications():
    student = get_student_profile()
    if not student:
        return jsonify({'message': 'Student access required'}), 403

    applications = db.session.query(Application, PlacementDrive, CompanyProfile).join(
        PlacementDrive, Application.drive_id == PlacementDrive.id
    ).join(
        CompanyProfile, PlacementDrive.company_id == CompanyProfile.id
    ).filter(Application.student_id == student.id).all()

    result = []
    for app, drive, company in applications:
        result.append({
            'id': app.id,
            'company_name': company.company_name,
            'job_title': drive.job_title,
            'application_date': app.application_date.strftime('%Y-%m-%d') if app.application_date else '',
            'status': app.status
        })
    return jsonify(result), 200
