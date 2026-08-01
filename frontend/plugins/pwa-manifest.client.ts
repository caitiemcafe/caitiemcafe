import { useAuthStore } from '~/src/stores/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const route = useRoute()
  const auth = useAuthStore()

  const updateManifest = (path: string) => {
    if (!import.meta.client) return
    const isAdminAuthenticated = path.startsWith('/admin') && path !== '/admin/login' && auth.isAuthenticated
    const targetHref = isAdminAuthenticated ? '/admin-manifest.json' : '/manifest.webmanifest'

    const manifestLinks = document.querySelectorAll('link[rel="manifest"]')
    if (manifestLinks.length > 0) {
      manifestLinks.forEach((link, idx) => {
        if (idx === 0) {
          (link as HTMLLinkElement).href = targetHref
        } else {
          link.remove()
        }
      })
    } else {
      const newLink = document.createElement('link')
      newLink.rel = 'manifest'
      newLink.href = targetHref
      document.head.appendChild(newLink)
    }
  }

  nuxtApp.hook('page:finish', () => {
    updateManifest(route.path)
  })

  watch(
    () => [route.path, auth.isAuthenticated],
    () => {
      updateManifest(route.path)
    },
    { immediate: true }
  )
})
