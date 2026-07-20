import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/vibe', name: 'vibe', component: () => import('../views/VibeView.vue') },
    { path: '/admin/login', name: 'admin-login', component: () => import('../views/admin/AdminLoginView.vue') },
    { path: '/admin', component: () => import('../views/admin/AdminLayout.vue'), meta: { requiresAuth: true }, children: [
      { path: '', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboardView.vue') },
      { path: 'products', name: 'admin-products', component: () => import('../views/admin/AdminProductsView.vue') },
      { path: 'orders', name: 'admin-orders', component: () => import('../views/admin/AdminOrdersView.vue') },
      { path: 'quotes', name: 'admin-quotes', component: () => import('../views/admin/AdminQuotesView.vue') },
      { path: 'settings', name: 'admin-settings', component: () => import('../views/admin/AdminSettingsView.vue') },
    ] },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !sessionStorage.getItem('cai-tiem-admin-token')) return { name: 'admin-login', query: { redirect: to.fullPath } }
  if (to.name === 'admin-login' && sessionStorage.getItem('cai-tiem-admin-token')) return { name: 'admin-dashboard' }
})

export default router
