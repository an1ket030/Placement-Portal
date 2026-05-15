import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'instance', 'placement.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret-key')
    
    # Redis
    REDIS_URL = 'redis://localhost:6379/0'
    
    # Celery
    CELERY_BROKER_URL = 'redis://localhost:6379/1'
    CELERY_RESULT_BACKEND = 'redis://localhost:6379/2'
    
    # Upload
    UPLOAD_FOLDER = os.path.join(basedir, 'static', 'resumes')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB max
    
    # Cache
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = 'redis://localhost:6379/0'
    CACHE_DEFAULT_TIMEOUT = 300

    # Mail (for celery tasks)
    SMTP_SERVER = 'localhost'
    SMTP_PORT = 1025
    ADMIN_EMAIL = 'admin@placement.com'
