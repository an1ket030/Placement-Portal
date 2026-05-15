const StudentDashboard = {
    template: `
    <div>
        <h2>Student Dashboard</h2>
        <div v-if="message" class="alert" :class="msgType === 'success' ? 'alert-success' : 'alert-danger'">
            {{ message }}
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs">
            <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'drives' }" href="#" @click.prevent="tab='drives'; loadDrives()">Placement Drives</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'applications' }" href="#" @click.prevent="tab='applications'; loadApplications()">My Applications</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'profile' }" href="#" @click.prevent="tab='profile'; loadProfile()">My Profile</a>
            </li>
        </ul>

        <!-- Drives -->
        <div v-if="tab === 'drives'" class="mt-3">
            <div class="mb-3">
                <input type="text" class="form-control" placeholder="Search drives by title or company..." v-model="driveSearch" @input="loadDrives()">
            </div>
            <div class="row">
                <div class="col-md-6 mb-3" v-for="d in drives" :key="d.id">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">{{ d.job_title }}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">{{ d.company_name }}</h6>
                            <p class="card-text">{{ d.job_description }}</p>
                            <p><small><strong>Branch:</strong> {{ d.eligibility_branch }} | <strong>Min CGPA:</strong> {{ d.eligibility_cgpa }} | <strong>Year:</strong> {{ d.eligibility_year }}</small></p>
                            <p><small><strong>Deadline:</strong> {{ d.application_deadline }}</small></p>
                            <button class="btn btn-primary" @click="applyDrive(d.id)" v-if="!d.already_applied">Apply</button>
                            <span class="badge bg-secondary" v-else>Already Applied</span>
                        </div>
                    </div>
                </div>
                <div v-if="drives.length === 0" class="col-12 text-center">
                    <p>No approved placement drives available.</p>
                </div>
            </div>
        </div>

        <!-- My Applications -->
        <div v-if="tab === 'applications'" class="mt-3">
            <div class="mb-3">
                <button class="btn btn-secondary" @click="exportCSV">Export as CSV</button>
                <span v-if="exportMsg" class="ms-2 text-info">{{ exportMsg }}</span>
            </div>
            <table class="table table-bordered">
                <thead class="table-dark">
                    <tr>
                        <th>Company</th>
                        <th>Job Title</th>
                        <th>Date Applied</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="a in applications" :key="a.id">
                        <td>{{ a.company_name }}</td>
                        <td>{{ a.job_title }}</td>
                        <td>{{ a.application_date }}</td>
                        <td>
                            <span class="badge" :class="a.status === 'Selected' ? 'bg-success' : a.status === 'Rejected' ? 'bg-danger' : a.status === 'Shortlisted' ? 'bg-info' : 'bg-secondary'">
                                {{ a.status }}
                            </span>
                        </td>
                    </tr>
                    <tr v-if="applications.length === 0"><td colspan="4" class="text-center">No applications yet</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Profile -->
        <div v-if="tab === 'profile'" class="mt-3">
            <div class="card">
                <div class="card-body">
                    <h5>Edit Profile</h5>
                    <form @submit.prevent="updateProfile">
                        <div class="mb-3">
                            <label class="form-label">Name</label>
                            <input type="text" class="form-control" v-model="profile.name">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Roll Number</label>
                            <input type="text" class="form-control" v-model="profile.roll_no">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Branch</label>
                            <input type="text" class="form-control" v-model="profile.branch">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">CGPA</label>
                            <input type="number" step="0.01" class="form-control" v-model="profile.cgpa">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Year</label>
                            <input type="number" class="form-control" v-model="profile.year">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Phone</label>
                            <input type="text" class="form-control" v-model="profile.phone">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Upload Resume (PDF)</label>
                            <input type="file" class="form-control" @change="handleResume" accept=".pdf">
                            <small v-if="profile.resume" class="text-muted">Current: {{ profile.resume }}</small>
                        </div>
                        <button type="submit" class="btn btn-primary">Update Profile</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            tab: 'drives',
            drives: [],
            applications: [],
            profile: {},
            driveSearch: '',
            resumeFile: null,
            message: '',
            msgType: 'success',
            exportMsg: ''
        };
    },
    mounted() {
        this.loadDrives();
    },
    methods: {
        getHeaders() {
            return {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            };
        },
        async loadDrives() {
            try {
                const res = await fetch('http://localhost:5000/api/student/drives?q=' + this.driveSearch, { headers: this.getHeaders() });
                this.drives = await res.json();
            } catch (e) { console.error(e); }
        },
        async applyDrive(driveId) {
            try {
                const res = await fetch('http://localhost:5000/api/student/apply/' + driveId, {
                    method: 'POST',
                    headers: this.getHeaders()
                });
                const data = await res.json();
                if (res.ok) {
                    this.msgType = 'success';
                    this.message = data.message;
                    this.loadDrives();
                } else {
                    this.msgType = 'error';
                    this.message = data.message;
                }
            } catch (e) {
                this.msgType = 'error';
                this.message = 'Server error';
            }
        },
        async loadApplications() {
            try {
                const res = await fetch('http://localhost:5000/api/student/applications', { headers: this.getHeaders() });
                this.applications = await res.json();
            } catch (e) { console.error(e); }
        },
        async loadProfile() {
            try {
                const res = await fetch('http://localhost:5000/api/student/profile', { headers: this.getHeaders() });
                this.profile = await res.json();
            } catch (e) { console.error(e); }
        },
        handleResume(event) {
            this.resumeFile = event.target.files[0];
        },
        async updateProfile() {
            const formData = new FormData();
            formData.append('name', this.profile.name || '');
            formData.append('roll_no', this.profile.roll_no || '');
            formData.append('branch', this.profile.branch || '');
            formData.append('cgpa', this.profile.cgpa || '');
            formData.append('year', this.profile.year || '');
            formData.append('phone', this.profile.phone || '');
            if (this.resumeFile) {
                formData.append('resume', this.resumeFile);
            }

            try {
                const res = await fetch('http://localhost:5000/api/student/profile', {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    },
                    body: formData
                });
                const data = await res.json();
                if (res.ok) {
                    this.msgType = 'success';
                    this.message = data.message;
                } else {
                    this.msgType = 'error';
                    this.message = data.message;
                }
            } catch (e) {
                this.msgType = 'error';
                this.message = 'Server error';
            }
        },
        async exportCSV() {
            try {
                const res = await fetch('http://localhost:5000/api/student/export', {
                    method: 'POST',
                    headers: this.getHeaders()
                });
                const data = await res.json();
                this.exportMsg = data.message;
            } catch (e) {
                this.exportMsg = 'Export failed. Make sure Redis and Celery are running.';
            }
        }
    }
};
