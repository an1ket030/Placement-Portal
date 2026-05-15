from flask import Flask, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash
from config import Config
from extensions import db, jwt, cache
import os

# path to frontend folder
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')

def create_app():
    app = Flask(__name__, static_folder=os.path.join(FRONTEND_DIR, 'src'), static_url_path='/src')
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    cache.init_app(app)
    CORS(app)

    # make sure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'instance'), exist_ok=True)

    # Serve frontend index.html
    @app.route('/')
    def serve_frontend():
        return send_from_directory(FRONTEND_DIR, 'index.html')

    # register blueprints
    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.company import company_bp
    from routes.student import student_bp
    from routes.export import export_bp

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(company_bp, url_prefix='/api/company')
    app.register_blueprint(student_bp, url_prefix='/api/student')
    app.register_blueprint(export_bp, url_prefix='/api')

    with app.app_context():
        from models import User, CompanyProfile, StudentProfile, PlacementDrive, Application
        db.create_all()
        seed_admin()

    return app

def seed_admin():
    """Create admin user if not exists"""
    from models import User
    admin = User.query.filter_by(role='admin').first()
    if not admin:
        admin = User(
            email='admin@placement.com',
            password=generate_password_hash('admin123'),
            name='Admin',
            role='admin',
            is_blacklisted=False
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin user created: admin@placement.com / admin123")

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
