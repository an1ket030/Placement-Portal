const LoginComponent = {
    template: `
    <div class="row justify-content-center mt-5">
        <div class="col-md-5">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0">Login</h4>
                </div>
                <div class="card-body">
                    <div v-if="message" class="alert" :class="success ? 'alert-success' : 'alert-danger'">
                        {{ message }}
                    </div>
                    <form @submit.prevent="login">
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-control" v-model="email" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-control" v-model="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Login</button>
                    </form>
                    <p class="mt-3 text-center">
                        Don't have an account? <router-link to="/register">Register here</router-link>
                    </p>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            email: '',
            password: '',
            message: '',
            success: false
        };
    },
    methods: {
        async login() {
            try {
                const response = await fetch('http://localhost:5000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: this.email, password: this.password })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.access_token);
                    localStorage.setItem('userRole', data.role);
                    localStorage.setItem('userName', data.name);
                    localStorage.setItem('userId', data.user_id);
                    this.success = true;
                    this.message = 'Login successful!';
                    this.$router.push('/dashboard');
                } else {
                    this.success = false;
                    this.message = data.message || 'Login failed';
                }
            } catch (error) {
                this.success = false;
                this.message = 'Server error. Please try again.';
            }
        }
    }
};
