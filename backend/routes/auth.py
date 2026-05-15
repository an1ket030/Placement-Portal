from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from models import User, CompanyProfile, StudentProfile

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid email or password'}), 401

    if user.is_blacklisted:
        return jsonify({'message': 'Your account has been deactivated. Contact admin.'}), 403

    # check if company is approved
    if user.role == 'company':
        company = CompanyProfile.query.filter_by(user_id=user.id).first()
        if company and company.approval_status != 'Approved':
            return jsonify({'message': 'Your company registration is pending admin approval.'}), 403

    access_token = create_access_token(identity=str(user.id), additional_claims={
        'role': user.role,
        'name': user.name,
        'email': user.email
    })

    return jsonify({
        'access_token': access_token,
        'role': user.role,
        'name': user.name,
        'user_id': user.id
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role')  # 'student' or 'company'

    if not email or not password or not name or not role:
        return jsonify({'message': 'All fields are required'}), 400

    if role not in ['student', 'company']:
        return jsonify({'message': 'Invalid role'}), 400

    # check if email already exists
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'message': 'Email already registered'}), 409

    user = User(
        email=email,
        password=generate_password_hash(password),
        name=name,
        role=role
    )
    db.session.add(user)
    db.session.flush()  # get user.id

    if role == 'student':
        profile = StudentProfile(
            user_id=user.id,
            roll_no=data.get('roll_no', ''),
            branch=data.get('branch', ''),
            cgpa=data.get('cgpa', 0.0),
            year=data.get('year', 1),
            phone=data.get('phone', '')
        )
        db.session.add(profile)
    elif role == 'company':
        profile = CompanyProfile(
            user_id=user.id,
            company_name=data.get('company_name', name),
            hr_contact=data.get('hr_contact', ''),
            website=data.get('website', ''),
            description=data.get('description', ''),
            approval_status='Pending'
        )
        db.session.add(profile)

    db.session.commit()

    return jsonify({'message': 'Registration successful. ' + ('Please wait for admin approval.' if role == 'company' else 'You can now login.')}), 201
