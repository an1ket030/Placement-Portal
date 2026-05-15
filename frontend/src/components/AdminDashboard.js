const AdminDashboard = {
    template: `
    <div>
        <h2>Admin Dashboard</h2>
        <div v-if="message" class="alert alert-info">{{ message }}</div>

        <!-- Stats -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5>Students</h5>
                        <h3>{{ stats.total_students }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5>Companies</h5>
                        <h3>{{ stats.total_companies }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5>Drives</h5>
                        <h3>{{ stats.total_drives }}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5>Applications</h5>
                        <h3>{{ stats.total_applications }}</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs">
            <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'companies' }" href="#" @click.prevent="tab='companies'; loadCompanies()">Companies</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'students' }" href="#" @click.prevent="tab='students'; loadStudents()">Students</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'drives' }" href="#" @click.prevent="tab='drives'; loadDrives()">Drives</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" :class="{ active: tab === 'applications' }" href="#" @click.prevent="tab='applications'; loadApplications()">Applications</a>
            </li>
        </ul>

        <!-- Companies Tab -->
        <div v-if="tab === 'companies'" class="mt-3">
            <div class="mb-3">
                <input type="text" class="form-control" placeholder="Search companies..." v-model="companySearch" @input="loadCompanies()">
            </div>
            <table class="table table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Company Name</th>
                        <th>Email</th>
                        <th>HR Contact</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="c in companies" :key="c.id">
                        <td>{{ c.company_name }}</td>
                        <td>{{ c.email }}</td>
                        <td>{{ c.hr_contact }}</td>
                        <td>
                            <span class="badge" :class="c.approval_status === 'Approved' ? 'bg-success' : c.approval_status === 'Rejected' ? 'bg-danger' : 'bg-warning'">
                                {{ c.approval_status }}
                            </span>
                            <span v-if="c.is_blacklisted" class="badge bg-dark ms-1">Blacklisted</span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-success me-1" @click="approveCompany(c.id)" v-if="c.approval_status === 'Pending'">Approve</button>
                            <button class="btn btn-sm btn-danger me-1" @click="rejectCompany(c.id)" v-if="c.approval_status === 'Pending'">Reject</button>
                            <button class="btn btn-sm btn-dark" @click="blacklistCompany(c.id)">
                                {{ c.is_blacklisted ? 'Unblock' : 'Blacklist' }}
                            </button>
                        </td>
                    </tr>
                    <tr v-if="companies.length === 0"><td colspan="5" class="text-center">No companies found</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Students Tab -->
        <div v-if="tab === 'students'" class="mt-3">
            <div class="mb-3">
                <input type="text" class="form-control" placeholder="Search students..." v-model="studentSearch" @input="loadStudents()">
            </div>
            <table class="table table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Roll No</th>
                        <th>Branch</th>
                        <th>CGPA</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="s in students" :key="s.id">
                        <td>{{ s.name }}</td>
                        <td>{{ s.email }}</td>
                        <td>{{ s.roll_no }}</td>
                        <td>{{ s.branch }}</td>
                        <td>{{ s.cgpa }}</td>
                        <td>
                            <span class="badge" :class="s.is_blacklisted ? 'bg-danger' : 'bg-success'">
                                {{ s.is_blacklisted ? 'Deactivated' : 'Active' }}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-dark" @click="blacklistStudent(s.id)">
                                {{ s.is_blacklisted ? 'Activate' : 'Deactivate' }}
                            </button>
                        </td>
                    </tr>
                    <tr v-if="students.length === 0"><td colspan="7" class="text-center">No students found</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Drives Tab -->
        <div v-if="tab === 'drives'" class="mt-3">
            <table class="table table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Job Title</th>
                        <th>Company</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th>Applications</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="d in drives" :key="d.id">
                        <td>{{ d.job_title }}</td>
                        <td>{{ d.company_name }}</td>
                        <td>{{ d.application_deadline }}</td>
                        <td>
                            <span class="badge" :class="d.status === 'Approved' ? 'bg-success' : d.status === 'Rejected' ? 'bg-danger' : 'bg-warning'">
                                {{ d.status }}
                            </span>
                        </td>
                        <td>{{ d.applications_count }}</td>
                        <td>
                            <button class="btn btn-sm btn-success me-1" @click="approveDrive(d.id)" v-if="d.status === 'Pending'">Approve</button>
                            <button class="btn btn-sm btn-danger" @click="rejectDrive(d.id)" v-if="d.status === 'Pending'">Reject</button>
                        </td>
                    </tr>
                    <tr v-if="drives.length === 0"><td colspan="6" class="text-center">No drives found</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Applications Tab -->
        <div v-if="tab === 'applications'" class="mt-3">
            <table class="table table-bordered table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Student</th>
                        <th>Roll No</th>
                        <th>Company</th>
                        <th>Job Title</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="a in applications" :key="a.id">
                        <td>{{ a.student_name }}</td>
                        <td>{{ a.roll_no }}</td>
                        <td>{{ a.company_name }}</td>
                        <td>{{ a.job_title }}</td>
                        <td>{{ a.application_date }}</td>
                        <td>
                            <span class="badge" :class="a.status === 'Selected' ? 'bg-success' : a.status === 'Rejected' ? 'bg-danger' : a.status === 'Shortlisted' ? 'bg-info' : 'bg-secondary'">
                                {{ a.status }}
                            </span>
                        </td>
                    </tr>
                    <tr v-if="applications.length === 0"><td colspan="6" class="text-center">No applications found</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    `,
    data() {
        return {
            stats: { total_students: 0, total_companies: 0, total_drives: 0, total_applications: 0 },
            tab: 'companies',
            companies: [],
            students: [],
            drives: [],
            applications: [],
            companySearch: '',
            studentSearch: '',
            message: ''
        };
    },
    mounted() {
        this.loadStats();
        this.loadCompanies();
    },
    methods: {
        getHeaders() {
            return {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            };
        },
        async loadStats() {
            try {
                const res = await fetch('http://localhost:5000/api/admin/dashboard', { headers: this.getHeaders() });
                this.stats = await res.json();
            } catch (e) { console.error(e); }
        },
        async loadCompanies() {
            try {
                const res = await fetch('http://localhost:5000/api/admin/companies?q=' + this.companySearch, { headers: this.getHeaders() });
                this.companies = await res.json();
            } catch (e) { console.error(e); }
        },
        async loadStudents() {
            try {
                const res = await fetch('http://localhost:5000/api/admin/students?q=' + this.studentSearch, { headers: this.getHeaders() });
                this.students = await res.json();
            } catch (e) { console.error(e); }
        },
        async loadDrives() {
            try {
                const res = await fetch('http://localhost:5000/api/admin/drives', { headers: this.getHeaders() });
                this.drives = await res.json();
            } catch (e) { console.error(e); }
        },
        async loadApplications() {
            try {
                const res = await fetch('http://localhost:5000/api/admin/applications', { headers: this.getHeaders() });
                this.applications = await res.json();
            } catch (e) { console.error(e); }
        },
        async approveCompany(id) {
            await fetch('http://localhost:5000/api/admin/companies/' + id + '/approve', { method: 'POST', headers: this.getHeaders() });
            this.message = 'Company approved';
            this.loadCompanies();
            this.loadStats();
        },
        async rejectCompany(id) {
            await fetch('http://localhost:5000/api/admin/companies/' + id + '/reject', { method: 'POST', headers: this.getHeaders() });
            this.message = 'Company rejected';
            this.loadCompanies();
        },
        async blacklistCompany(id) {
            await fetch('http://localhost:5000/api/admin/companies/' + id + '/blacklist', { method: 'POST', headers: this.getHeaders() });
            this.message = 'Company status updated';
            this.loadCompanies();
        },
        async blacklistStudent(id) {
            await fetch('http://localhost:5000/api/admin/students/' + id + '/blacklist', { method: 'POST', headers: this.getHeaders() });
            this.message = 'Student status updated';
            this.loadStudents();
        },
        async approveDrive(id) {
            await fetch('http://localhost:5000/api/admin/drives/' + id + '/approve', { method: 'POST', headers: this.getHeaders() });
            this.message = 'Drive approved';
            this.loadDrives();
            this.loadStats();
        },
        async rejectDrive(id) {
            await fetch('http://localhost:5000/api/admin/drives/' + id + '/reject', { method: 'POST', headers: this.getHeaders() });
            this.message = 'Drive rejected';
            this.loadDrives();
        }
    }
};
