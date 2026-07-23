<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Download, X } from '@lucide/vue'
import { usePWA } from '../composables/usePWA'

const { isInstallable, install, dismiss } = usePWA()
const showBanner = ref(false)

onMounted(() => {
  const isDismissed = sessionStorage.getItem('pwa-dismissed')
  if (!isDismissed) {
    // Hiển thị sau 3 giây để trải nghiệm mượt mà, không đột ngột
    setTimeout(() => {
      showBanner.value = true
    }, 3000)
  }
})

const handleInstall = async () => {
  const installed = await install()
  if (installed) {
    showBanner.value = false
  }
}

const handleDismiss = () => {
  dismiss()
  showBanner.value = false
  sessionStorage.setItem('pwa-dismissed', 'true')
}
</script>

<template>
  <Transition name="slide-up">
    <div v-if="isInstallable && showBanner" class="pwa-banner-wrap">
      <div class="pwa-banner">
        <div class="pwa-info">
          <img src="/favicon.svg" alt="Cái Tiệm KÀFE Logo" class="pwa-logo" />
          <div>
            <h3>Cài đặt Cái Tiệm KÀFE</h3>
            <p>Trải nghiệm mượt mà, đặt món nhanh hơn và dùng ngoại tuyến.</p>
          </div>
        </div>
        <div class="pwa-actions">
          <button class="btn-dismiss" aria-label="Đóng thông báo" @click="handleDismiss">
            <X :size="18" />
          </button>
          <button class="btn btn-primary btn-install" @click="handleInstall">
            <Download :size="16" /> Cài đặt App
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.pwa-banner-wrap {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99;
  width: min(540px, calc(100% - 32px));
}

.pwa-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(255, 250, 243, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(59, 36, 23, 0.15);
  border-radius: 20px;
  box-shadow: 0 16px 40px rgba(59, 36, 23, 0.2);
}

.pwa-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.pwa-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(59, 36, 23, 0.1);
}

.pwa-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--coffee);
}

.pwa-info p {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: #6d5f56;
  line-height: 1.4;
}

.pwa-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-dismiss {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: rgba(59, 36, 23, 0.06);
  color: var(--coffee);
  transition: 0.2s;
}

.btn-dismiss:hover {
  background: rgba(59, 36, 23, 0.12);
}

.btn-install {
  white-space: nowrap;
  padding: 10px 18px;
  font-size: 0.88rem;
  box-shadow: none;
}

/* Slide Up Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translate(-50%, 30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}

@media (max-width: 640px) {
  .pwa-banner-wrap {
    bottom: 16px;
  }
  
  .pwa-banner {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
    padding: 14px;
  }
  
  .pwa-info {
    align-items: flex-start;
  }
  
  .pwa-logo {
    width: 40px;
    height: 40px;
  }
  
  .pwa-actions {
    justify-content: flex-end;
    gap: 10px;
  }
  
  .btn-install {
    flex: 1;
    justify-content: center;
  }
}
</style>
