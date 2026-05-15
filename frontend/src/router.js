// Router configuration
const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginComponent },
    { path: '/register', component: RegisterComponent },
    {
        path: '/dashboard',
        component: {
            template: '<component :is="dashboardComponent"></component>',
            computed: {
                dashboardComponent() {
                    const role = localStorage.getItem('userRole');
                    if (role === 'admin') return 'admin-dashboard';
                    if (role === 'company') return 'company-dashboard';
                    if (role === 'student') return 'student-dashboard';
                    return 'login-component';
                }
            }
        }
    }
];

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes: routes
});

// Navigation guard - redirect to login if not authenticated
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    if (to.path === '/dashboard' && !token) {
        next('/login');
    } else {
        next();
    }
});
