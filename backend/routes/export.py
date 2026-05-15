from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import StudentProfile

export_bp = Blueprint('export', __name__)

@export_bp.route('/student/export', methods=['POST'])
@jwt_required()
def export_csv():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    if claims.get('role') != 'student':
        return jsonify({'message': 'Student access required'}), 403

    student = StudentProfile.query.filter_by(user_id=user_id).first()
    if not student:
        return jsonify({'message': 'Student profile not found'}), 404

    # trigger celery task
    try:
        from tasks import export_applications_csv
        task = export_applications_csv.delay(student.id)
        return jsonify({'message': 'Export started. You will be notified when done.', 'task_id': task.id}), 202
    except Exception as e:
        return jsonify({'message': f'Export failed: {str(e)}'}), 500

@export_bp.route('/student/export/status/<task_id>', methods=['GET'])
@jwt_required()
def export_status(task_id):
    try:
        from tasks import celery_app
        task = celery_app.AsyncResult(task_id)
        if task.state == 'SUCCESS':
            return jsonify({'status': 'completed', 'result': task.result}), 200
        elif task.state == 'FAILURE':
            return jsonify({'status': 'failed'}), 500
        else:
            return jsonify({'status': 'processing'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
