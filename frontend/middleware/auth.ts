import { useAuthStore } from '~/src/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  authStore.init()

  const token = sessionStorage.getItem('cai-tiem-admin-token')

  if (!token && to.path.startsWith('/admin') && to.path !== '/admin/login') {
    return navigateTo({ path: '/admin/login', query: { redirect: to.fullPath } })
  }

  if (token && to.path === '/admin/login') {
    return navigateTo('/admin')
  }
})
