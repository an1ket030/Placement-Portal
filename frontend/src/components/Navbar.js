const NavbarComponent = {
    template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <router-link class="navbar-brand" to="/">Placement Portal</router-link>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item" v-if="!isLoggedIn">
                        <router-link class="nav-link" to="/login">Login</router-link>
                    </li>
                    <li class="nav-item" v-if="!isLoggedIn">
                        <router-link class="nav-link" to="/register">Register</router-link>
                    </li>
                    <li class="nav-item" v-if="isLoggedIn">
                        <router-link class="nav-link" to="/dashboard">Dashboard</router-link>
                    </li>
                    <li class="nav-item" v-if="isLoggedIn">
                        <span class="nav-link text-light">Hello, {{ userName }}</span>
                    </li>
                    <li class="nav-item" v-if="isLoggedIn">
                        <a class="nav-link" href="#" @click.prevent="logout">Logout</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `,
    data() {
        return {
            isLoggedIn: !!localStorage.getItem('token'),
            userName: localStorage.getItem('userName') || 'User'
        }
    },
    watch: {
        $route() {
            this.isLoggedIn = !!localStorage.getItem('token');
            this.userName = localStorage.getItem('userName') || 'User';
        }
    },
    methods: {
        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');
            this.$router.push('/login');
        }
    }
};
