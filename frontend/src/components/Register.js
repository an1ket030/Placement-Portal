const RegisterComponent = {
    template: `
    <div class="row justify-content-center mt-5">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header bg-success text-white">
                    <h4 class="mb-0">Register</h4>
                </div>
                <div class="card-body">
                    <div v-if="message" class="alert" :class="success ? 'alert-success' : 'alert-danger'">
                        {{ message }}
                    </div>
                    <form @submit.prevent="register">
                        <div class="mb-3">
                            <label class="form-label">Register as</label>
                            <select class="form-select" v-model="role">
                                <option value="student">Student</option>
                                <option value="company">Company</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Name</label>
                            <input type="text" class="form-control" v-model="name" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-control" v-model="email" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-control" v-model="password" required>
                        </div>

                        <!-- Student fields -->
                        <div v-if="role === 'student'">
                            <div class="mb-3">
                                <label class="form-label">Roll Number</label>
                                <input type="text" class="form-control" v-model="roll_no">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Branch</label>
                                <input type="text" class="form-control" v-model="branch">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">CGPA</label>
                                <input type="number" step="0.01" class="form-control" v-model="cgpa">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Year</label>
                                <input type="number" class="form-control" v-model="year">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Phone</label>
                                <input type="text" class="form-control" v-model="phone">
                            </div>
                        </div>

                        <!-- Company fields -->
                        <div v-if="role === 'company'">
                            <div class="mb-3">
                                <label class="form-label">Company Name</label>
                                <input type="text" class="form-control" v-model="company_name">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">HR Contact</label>
                                <input type="text" class="form-control" v-model="hr_contact">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Website</label>
                                <input type="text" class="form-control" v-model="website">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" v-model="description" rows="3"></textarea>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-success w-100">Register</button>
                    </form>
                    <p class="mt-3 text-center">
                        Already have an account? <router-link to="/login">Login here</router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            role: 'student',
            name: '',
            email: '',
            password: '',
            roll_no: '',
            branch: '',
            cgpa: '',
            year: '',
            phone: '',
            company_name: '',
            hr_contact: '',
            website: '',
            description: '',
            message: '',
            success: false
        };
    },
    methods: {
        async register() {
            let body = {
                name: this.name,
                email: this.email,
                password: this.password,
                role: this.role
            };

            if (this.role === 'student') {
                body.roll_no = this.roll_no;
                body.branch = this.branch;
                body.cgpa = parseFloat(this.cgpa) || 0;
                body.year = parseInt(this.year) || 1;
                body.phone = this.phone;
            } else {
                body.company_name = this.company_name;
                body.hr_contact = this.hr_contact;
                body.website = this.website;
                body.description = this.description;
            }

            try {
                const response = await fetch('http://localhost:5000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                if (response.ok) {
                    this.success = true;
                    this.message = data.message;
                } else {
                    this.success = false;
                    this.message = data.message || 'Registration failed';
                }
            } catch (error) {
                this.success = false;
                this.message = 'Server error. Please try again.';
            }
        }
    }
};
