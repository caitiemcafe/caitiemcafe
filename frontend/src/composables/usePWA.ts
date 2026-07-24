import { ref } from 'vue'

const deferredPrompt = ref<any>(null)
const isInstallable = ref(false)

if (import.meta.client) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    isInstallable.value = true
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null
    isInstallable.value = false
    console.log('Ứng dụng đã được cài đặt thành công!')
  })
}

export function usePWA() {
  const install = async (): Promise<boolean> => {
    const promptEvent = deferredPrompt.value
    if (!promptEvent) return false

    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice

    if (outcome === 'accepted') {
      deferredPrompt.value = null
      isInstallable.value = false
      return true
    }
    return false
  }

  const dismiss = () => {
    isInstallable.value = false
  }

  return {
    isInstallable,
    install,
    dismiss
  }
}
