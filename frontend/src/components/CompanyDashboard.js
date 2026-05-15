const CompanyDashboard = {
    template: `
    <div>
        <h2>Company Dashboard</h2>
        <div v-if="message" class="alert" :class="msgType === 'success' ? 'alert-success' : 'alert-danger'">
            {{ message }}
        </div>

        <!-- Company Info -->
        <div class="card mb-3" v-if="company">
            <div class="card-body">
                <h5>{{ company.company_name }}</h5>
                <p><strong>HR Contact:</strong> {{ company.hr_contact }}</p>
                <p><strong>Website:</strong> {{ company.website }}</p>
                <p><strong>Status:</strong> 
                    <span class="badge" :class="company.approval_status === 'Approved' ? 'bg-success' : 'bg-warning'">{{ company.approval_status }}</span>
                </p>
            </div>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs">
            <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'drives' }" href="#" @click.prevent="tab='drives'">My Drives</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'create' }" href="#" @click.prevent="tab='create'">Create Drive</a>
            </li>
            <li class="nav-item" v-if="selectedDrive">
                <a class="nav-link" :class="{ active: tab === 'apps' }" href="#" @click.prevent="tab='apps'">Applications</a>
            </li>
        </ul>

        <!-- Drives List -->
        <div v-if="tab === 'drives'" class="mt-3">
            <table class="table table-bordered">
                <thead class="table-dark">
                    <tr>
                        <th>Job Title</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th>Applicants</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="d in drives" :key="d.id">
                        <td>{{ d.job_title }}</td>
                        <td>{{ d.application_deadline }}</td>
                        <td>
                            <span class="badge" :class="d.status === 'Approved' ? 'bg-success' : d.status === 'Closed' ? 'bg-secondary' : 'bg-warning'">{{ d.status }}</span>
                        </td>
                        <td>{{ d.applications_count }}</td>
                        <td>
                            <button class="btn btn-sm btn-primary me-1" @click="viewApplications(d)">View Apps</button>
                            <button class="btn btn-sm btn-warning me-1" @click="closeDrive(d.id)" v-if="d.status === 'Approved'">Close</button>
                            <button class="btn btn-sm btn-danger" @click="deleteDrive(d.id)">Delete</button>
                        </td>
                    </tr>
                    <tr v-if="drives.length === 0"><td colspan="5" class="text-center">No drives created yet</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Create Drive -->
        <div v-if="tab === 'create'" class="mt-3">
            <div class="card">
                <div class="card-body">
                    <h5>Create New Placement Drive</h5>
                    <form @submit.prevent="createDrive">
                        <div class="mb-3">
                            <label class="form-label">Job Title</label>
                            <input type="text" class="form-control" v-model="newDrive.job_title" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Job Description</label>
                            <textarea class="form-control" v-model="newDrive.job_description" rows="3"></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Eligibility Branch</label>
                            <input type="text" class="form-control" v-model="newDrive.eligibility_branch" placeholder="e.g. CSE, ECE, ME">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Minimum CGPA</label>
                            <input type="number" step="0.01" class="form-control" v-model="newDrive.eligibility_cgpa">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Eligibility Year</label>
                            <input type="number" class="form-control" v-model="newDrive.eligibility_year">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Application Deadline</label>
                            <input type="date" class="form-control" v-model="newDrive.application_deadline">
                        </div>
                        <button type="submit" class="btn btn-primary">Create Drive</button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Applications for a drive -->
        <div v-if="tab === 'apps'" class="mt-3">
            <h5>Applications for: {{ selectedDrive ? selectedDrive.job_title : '' }}</h5>
            <table class="table table-bordered">
                <thead class="table-dark">
                    <tr>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Roll No</th>
                        <th>Branch</th>
                        <th>CGPA</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="a in driveApplications" :key="a.id">
                        <td>{{ a.student_name }}</td>
                        <td>{{ a.email }}</td>
                        <td>{{ a.roll_no }}</td>
                        <td>{{ a.branch }}</td>
                        <td>{{ a.cgpa }}</td>
                        <td>
                            <span class="badge" :class="a.status === 'Selected' ? 'bg-success' : a.status === 'Rejected' ? 'bg-danger' : a.status === 'Shortlisted' ? 'bg-info' : 'bg-secondary'">
                                {{ a.status }}
                            </span>
                        </td>
                        <td>
                            <select class="form-select form-select-sm" @change="updateStatus(a.id, $event.target.value)" :value="a.status">
                                <option value="Applied">Applied</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Selected">Selected</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </td>
                    </tr>
                    <tr v-if="driveApplications.length === 0"><td colspan="7" class="text-center">No applications yet</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    `,
    data() {
        return {
            company: null,
            drives: [],
            tab: 'drives',
            selectedDrive: null,
            driveApplications: [],
            newDrive: {
                job_title: '',
                job_description: '',
                eligibility_branch: '',
                eligibility_cgpa: 0,
                eligibility_year: 0,
                application_deadline: ''
            },
            message: '',
            msgType: 'success'
        };
    },
    mounted() {
        this.loadDashboard();
    },
    methods: {
        getHeaders() {
            return {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            };
        },
        async loadDashboard() {
            try {
                const res = await fetch('http://localhost:5000/api/company/dashboard', { headers: this.getHeaders() });
                const data = await res.json();
                this.company = data.company;
                this.drives = data.drives;
            } catch (e) { console.error(e); }
        },
        async createDrive() {
            try {
                const res = await fetch('http://localhost:5000/api/company/drives', {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(this.newDrive)
                });
                const data = await res.json();
                if (res.ok) {
                    this.msgType = 'success';
                    this.message = data.message;
                    this.newDrive = { job_title: '', job_description: '', eligibility_branch: '', eligibility_cgpa: 0, eligibility_year: 0, application_deadline: '' };
                    this.tab = 'drives';
                    this.loadDashboard();
                } else {
                    this.msgType = 'error';
                    this.message = data.message;
                }
            } catch (e) {
                this.msgType = 'error';
                this.message = 'Server error';
            }
        },
        async closeDrive(id) {
            await fetch('http://localhost:5000/api/company/drives/' + id + '/close', { method: 'POST', headers: this.getHeaders() });
            this.message = 'Drive closed';
            this.msgType = 'success';
            this.loadDashboard();
        },
        async deleteDrive(id) {
            if (confirm('Are you sure you want to delete this drive?')) {
                await fetch('http://localhost:5000/api/company/drives/' + id, { method: 'DELETE', headers: this.getHeaders() });
                this.message = 'Drive deleted';
                this.msgType = 'success';
                this.loadDashboard();
            }
        },
        async viewApplications(drive) {
            this.selectedDrive = drive;
            this.tab = 'apps';
            try {
                const res = await fetch('http://localhost:5000/api/company/drives/' + drive.id + '/applications', { headers: this.getHeaders() });
                this.driveApplications = await res.json();
            } catch (e) { console.error(e); }
        },
        async updateStatus(appId, status) {
            await fetch('http://localhost:5000/api/company/applications/' + appId + '/status', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ status: status })
            });
            this.message = 'Status updated to ' + status;
            this.msgType = 'success';
            if (this.selectedDrive) {
                this.viewApplications(this.selectedDrive);
            }
        }
    }
};
