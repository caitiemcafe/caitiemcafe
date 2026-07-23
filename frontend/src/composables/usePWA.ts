import { ref } from 'vue'

const deferredPrompt = ref<any>(null)
const isInstallable = ref(false)

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Ngăn chặn trình duyệt tự động hiện banner mặc định (mini-infobar)
    e.preventDefault()
    // Lưu lại sự kiện để kích hoạt sau khi người dùng nhấn nút cài đặt
    deferredPrompt.value = e
    // Cập nhật trạng thái hiển thị nút cài đặt trong UI
    isInstallable.value = true
  })

  window.addEventListener('appinstalled', () => {
    // Xóa sự kiện sau khi cài đặt thành công
    deferredPrompt.value = null
    isInstallable.value = false
    console.log('Ứng dụng đã được cài đặt thành công!')
  })
}

export function usePWA() {
  const install = async (): Promise<boolean> => {
    const promptEvent = deferredPrompt.value
    if (!promptEvent) return false

    // Hiển thị hộp thoại cài đặt của trình duyệt
    promptEvent.prompt()

    // Chờ phản hồi của người dùng
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
