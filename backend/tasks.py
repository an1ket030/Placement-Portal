from celery import Celery
import csv
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

celery_app = Celery('tasks')
celery_app.config_from_object({
    'broker_url': 'redis://localhost:6379/1',
    'result_backend': 'redis://localhost:6379/2',
    'timezone': 'Asia/Kolkata'
})

# We need Flask app context for DB operations
def get_flask_app():
    from app import create_app
    return create_app()

@celery_app.task
def export_applications_csv(student_id):
    """Export student applications to CSV"""
    app = get_flask_app()
    with app.app_context():
        from models import Application, PlacementDrive, CompanyProfile, StudentProfile
        from app import db

        student = StudentProfile.query.get(student_id)
        if not student:
            return {'error': 'Student not found'}

        applications = db.session.query(Application, PlacementDrive, CompanyProfile).join(
            PlacementDrive, Application.drive_id == PlacementDrive.id
        ).join(
            CompanyProfile, PlacementDrive.company_id == CompanyProfile.id
        ).filter(Application.student_id == student_id).all()

        # create exports folder
        export_dir = os.path.join(os.path.dirname(__file__), 'static', 'exports')
        os.makedirs(export_dir, exist_ok=True)

        filename = f'applications_{student_id}_{datetime.now().strftime("%Y%m%d%H%M%S")}.csv'
        filepath = os.path.join(export_dir, filename)

        with open(filepath, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Student ID', 'Company Name', 'Drive Title', 'Application Status', 'Application Date'])
            for app_record, drive, company in applications:
                writer.writerow([
                    student_id,
                    company.company_name,
                    drive.job_title,
                    app_record.status,
                    app_record.application_date.strftime('%Y-%m-%d') if app_record.application_date else ''
                ])

        return {'filename': filename, 'message': 'Export completed'}

@celery_app.task
def send_daily_reminders():
    """Send daily reminders about upcoming deadlines"""
    app = get_flask_app()
    with app.app_context():
        from models import PlacementDrive, CompanyProfile
        
        # find drives with deadlines in next 3 days
        today = datetime.now().strftime('%Y-%m-%d')
        three_days = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')
        
        drives = PlacementDrive.query.filter(
            PlacementDrive.status == 'Approved',
            PlacementDrive.application_deadline >= today,
            PlacementDrive.application_deadline <= three_days
        ).all()

        for drive in drives:
            company = CompanyProfile.query.get(drive.company_id)
            print(f"REMINDER: Drive '{drive.job_title}' by {company.company_name if company else 'Unknown'} deadline: {drive.application_deadline}")
        
        return {'message': f'Sent reminders for {len(drives)} drives'}

@celery_app.task
def generate_monthly_report():
    """Generate monthly placement activity report"""
    app = get_flask_app()
    with app.app_context():
        from models import PlacementDrive, Application
        from app import db

        # get last month stats
        now = datetime.now()
        first_day_this_month = now.replace(day=1)
        last_month_end = first_day_this_month - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)

        drives_count = PlacementDrive.query.filter(
            PlacementDrive.created_at >= last_month_start,
            PlacementDrive.created_at <= last_month_end
        ).count()

        applications_count = Application.query.filter(
            Application.application_date >= last_month_start,
            Application.application_date <= last_month_end
        ).count()

        selected_count = Application.query.filter(
            Application.application_date >= last_month_start,
            Application.application_date <= last_month_end,
            Application.status == 'Selected'
        ).count()

        # create HTML report
        report_html = f"""
        <html>
        <head><title>Monthly Placement Report</title></head>
        <body>
            <h1>Monthly Placement Activity Report</h1>
            <p>Period: {last_month_start.strftime('%B %Y')}</p>
            <table border="1" cellpadding="8">
                <tr><td><b>Total Drives Conducted</b></td><td>{drives_count}</td></tr>
                <tr><td><b>Total Applications</b></td><td>{applications_count}</td></tr>
                <tr><td><b>Students Selected</b></td><td>{selected_count}</td></tr>
            </table>
            <p>Report generated on {now.strftime('%Y-%m-%d %H:%M')}</p>
        </body>
        </html>
        """

        # save report
        report_dir = os.path.join(os.path.dirname(__file__), 'static', 'reports')
        os.makedirs(report_dir, exist_ok=True)
        report_file = os.path.join(report_dir, f'report_{last_month_start.strftime("%Y_%m")}.html')
        with open(report_file, 'w') as f:
            f.write(report_html)

        print(f"Monthly report generated: {report_file}")
        return {'message': 'Monthly report generated', 'file': report_file}

# Celery Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    'daily-reminders': {
        'task': 'tasks.send_daily_reminders',
        'schedule': 86400.0,  # every 24 hours
    },
    'monthly-report': {
        'task': 'tasks.generate_monthly_report',
        'schedule': 2592000.0,  # roughly every 30 days
    },
}
