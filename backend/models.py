from extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin, company, student
    is_blacklisted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # relationships
    company_profile = db.relationship('CompanyProfile', backref='user', uselist=False)
    student_profile = db.relationship('StudentProfile', backref='user', uselist=False)

class CompanyProfile(db.Model):
    __tablename__ = 'company_profile'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    company_name = db.Column(db.String(200), nullable=False)
    hr_contact = db.Column(db.String(100))
    website = db.Column(db.String(200))
    description = db.Column(db.Text)
    approval_status = db.Column(db.String(20), default='Pending')  # Pending, Approved, Rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # relationships
    placement_drives = db.relationship('PlacementDrive', backref='company', lazy=True)

class StudentProfile(db.Model):
    __tablename__ = 'student_profile'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    roll_no = db.Column(db.String(50))
    branch = db.Column(db.String(100))
    cgpa = db.Column(db.Float)
    year = db.Column(db.Integer)
    phone = db.Column(db.String(15))
    resume_filename = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # relationships
    applications = db.relationship('Application', backref='student', lazy=True)

class PlacementDrive(db.Model):
    __tablename__ = 'placement_drive'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('company_profile.id'), nullable=False)
    job_title = db.Column(db.String(200), nullable=False)
    job_description = db.Column(db.Text)
    eligibility_branch = db.Column(db.String(200))
    eligibility_cgpa = db.Column(db.Float, default=0.0)
    eligibility_year = db.Column(db.Integer)
    application_deadline = db.Column(db.String(20))
    status = db.Column(db.String(20), default='Pending')  # Pending, Approved, Closed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # relationships
    applications = db.relationship('Application', backref='drive', lazy=True)

class Application(db.Model):
    __tablename__ = 'application'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student_profile.id'), nullable=False)
    drive_id = db.Column(db.Integer, db.ForeignKey('placement_drive.id'), nullable=False)
    application_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='Applied')  # Applied, Shortlisted, Selected, Rejected

    # prevent duplicate applications
    __table_args__ = (db.UniqueConstraint('student_id', 'drive_id', name='unique_application'),)
