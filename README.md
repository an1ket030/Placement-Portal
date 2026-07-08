# Placement Portal  - Complete Setup & Testing Guide

This guide will walk you through exactly how to start this project from scratch and test all its features, written in simple, easy-to-follow steps.

---

## Part 1: First-Time Setup

Before running the project for the first time, you need to install the required software.

### 1. Install Redis (Background Task Manager)
Redis is required for the background jobs like CSV exports and automated emails.
*   **Because you are on Windows:** Go to [Memurai](https://www.memurai.com/get-memurai) and download the free Developer edition.
*   Install it like a normal program. It will run in the background automatically.

### 2. Install Python Dependencies
You need to install the Python libraries that power the app (like Flask and Celery).
1. Open PowerShell or Command Prompt.
2. Go to your backend folder:
   ```cmd
   cd C:\Users\singh\OneDrive\Desktop\MAD2\backend
   ```
3. Install the requirements:
   ```cmd
   pip install -r requirements.txt
   ```

---

## Part 1: Starting the Services
You will need to open 4 separate terminal windows (you can use PowerShell, Command Prompt, or VS Code terminals). You must keep all 4 windows open and running for the app to fully work.

### Terminal 1: Start Redis (The message broker)
Redis is required for background tasks (like CSV exports and daily emails). Since you have WSL (Windows Subsystem for Linux) active on your computer, the easiest way is to use it.

1. Open a terminal and type: `wsl` (Press Enter)
2. Inside WSL, install Redis by typing: `sudo apt update && sudo apt install redis-server -y`
3. After it installs, start it by typing: `redis-server` (Leave this window open. You should see a giant Redis logo or text saying it's ready to accept connections).

### Terminal 2: Start the Flask Server (The Backend + Frontend)
This runs the core application.

1. Open a new terminal window.
2. Navigate to your backend folder: `cd C:\Users\singh\OneDrive\Desktop\MAD2\backend`
3. Activate your virtual environment if you have one (optional, depends on your setup).
4. Run the server: `python app.py` (Leave this window open. It should say "Running on http://127.0.0.1:5000").

### Terminal 3: Start the Celery Worker (The Task Processor)
This process actually executes the heavy background jobs (like generating the CSV file).

1. Open a new terminal window.
2. Navigate to the backend: `cd C:\Users\singh\OneDrive\Desktop\MAD2\backend`
3. Start the worker: `celery -A tasks.celery_app worker --loglevel=info --pool=solo` (Leave this window open. It will say "celery@... ready").

### Terminal 4: Start Celery Beat (The Scheduler)
This acts as a timer, waking up daily/monthly to trigger automated reports.

1. Open a new terminal window.
2. Navigate to the backend: `cd C:\Users\singh\OneDrive\Desktop\MAD2\backend`
3. Start the beat scheduler: `celery -A tasks.celery_app beat --loglevel=info` (Leave this window open. It will print occasional log messages).

---

## Part 2: Testing the Application (Step-by-Step)
Now that everything is running, open your web browser (Chrome, Edge, Safari) and go to: `http://127.0.0.1:5000`

### Step 1: The Initial Look & Admin Login
1. You should see the placement portal login screen. Notice the very basic Bootstrap styling.
2. We created a default Admin account for you.
3. Enter Email: `admin@placement.com`
4. Enter Password: `admin123`
5. Click **Login**.
6. **Evaluate:** You are now on the Admin Dashboard. Look at the layout, the tables, and the styling. Does this look like a beginner student project to you? (Take mental notes!)
7. Click **Logout** in the top right.

### Step 2: Company Registration & Approval
1. On the login page, click **Register here**.
2. Select **Company** from the dropdown.
3. Fill out the form with dummy data (e.g., Email: `hr@google.com`, Password: `pass`, Name: `Google`).
4. Click **Register**. (It will redirect you to login).
5. Log back in as Admin (`admin@placement.com` / `admin123`).
6. Click the **Companies** tab on the dashboard.
7. You should see "Google" listed as "Pending". Click the **Approve** button. It will change to "Approved".
8. Click **Logout**.

### Step 3: Company Creates a Drive
1. Now, login as the Company (`hr@google.com` / `pass`).
2. You are on the Company Dashboard. Evaluate this layout.
3. Fill out the "Create New Drive" form (Job Title: `Software Intern`, Branch: `CSE`, CGPA: `7`).
4. Click **Create Drive**. It will appear in "Your Drives" as "Pending".
5. **Logout**.

### Step 4: Admin Approves the Drive
1. Log in as Admin again (`admin@placement.com`).
2. Go to the **Drives** tab.
3. Approve the "Software Intern" drive.
4. **Logout**.

### Step 5: Student Flow and Celery Test
This is the final and most important test, as it checks if your background tasks work.

1. On the login page, click **Register here**.
2. Select **Student**. Fill out dummy data (Email: `student@college.edu`, Password: `123`, Name: `Alex`).
3. Login as the Student (`student@college.edu` / `123`).
4. **Evaluate the Student Dashboard:** You can fill out a profile here.
5. Scroll down to "Available Placement Drives". You should see the "Software Intern" drive.
6. Click **Apply**. It should say successfully applied.
7. Scroll down to "Your Applications". You will see it listed there.
8. **Test Background task:** Below the applications table, click the **Export Applications (CSV)** button.
9. Look at your **Terminal 3** (the Celery Worker). You should suddenly see new text pop up saying `Task tasks.export_applications_csv[...] succeeded`.
10. Check the folder `C:\Users\singh\OneDrive\Desktop\MAD2\backend\static\exports\`. You will see a newly generated CSV file!
# Placement-Portal
