// Main Vue application
const app = Vue.createApp({});

// Register components
app.component('navbar-component', NavbarComponent);
app.component('login-component', LoginComponent);
app.component('register-component', RegisterComponent);
app.component('admin-dashboard', AdminDashboard);
app.component('company-dashboard', CompanyDashboard);
app.component('student-dashboard', StudentDashboard);

// Use router
app.use(router);

// Mount
app.mount('#app');
