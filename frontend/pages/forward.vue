<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ArrowRight, Coffee, Sparkles, Timer } from '@lucide/vue'
import type { ApiResponse, Settings } from '~/src/types'

useHead({
  title: 'Đang chuyển trang — Cái Tiệm KÀFE',
  meta: [
    { name: 'description', content: 'Cái Tiệm KÀFE — Đang tự động chuyển hướng bạn đến trang đích.' }
  ]
})

// Nuxt SSR Fetching
const { data: settingRes } = await useFetch<ApiResponse<Settings>>('/api/settings/public', { key: 'forward-public-settings' })

const defaultSettings: Settings = {
  forward_enabled: 'true',
  forward_seconds: '5',
  forward_target_url: 'https://caitiemkafe.com',
  forward_media_type: 'image',
  forward_media_url: '/images/brand/hero-cafe.webp',
  forward_title: '',
  forward_description: '',
  forward_button_text: 'Chuyển trang ngay'
}

const settings = computed<Settings>(() => ({
  ...defaultSettings,
  ...(settingRes.value?.data || {})
}))

const isRedirecting = ref(false)
const waitSeconds = computed(() => Math.max(0, Number(settings.value.forward_seconds ?? 5)))
const totalMs = ref(waitSeconds.value * 1000)
const remainingMs = ref(totalMs.value)
let timerId: ReturnType<typeof setInterval> | null = null

const hasTitle = computed(() => Boolean(settings.value.forward_title?.trim()))
const hasDesc = computed(() => Boolean(settings.value.forward_description?.trim()))

const remainingSeconds = computed(() => Math.max(0, Math.ceil(remainingMs.value / 1000)))
const progressPercent = computed(() => {
  if (totalMs.value <= 0) return 0
  return Math.max(0, Math.min(100, (remainingMs.value / totalMs.value) * 100))
})

const parsedVideo = computed(() => {
  const url = settings.value.forward_media_url || ''
  if (!url) return { type: 'direct', url: '' }
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/)
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      url: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&mute=1&playsinline=1&rel=0`
    }
  }
  return { type: 'direct', url }
})

const isTracked = useState('forward-tracked', () => false)

// 1. Server-side tracking (luôn ghi nhận trước khi redirect kể cả khi 0s)
if (import.meta.server) {
  const reqHeaders = useRequestHeaders(['x-forwarded-for', 'user-agent', 'referer'])
  const forwarded = reqHeaders['x-forwarded-for']
  let clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '127.0.0.1').replace(/^::ffff:/, '')
  if (clientIp === '::1') {
    clientIp = '127.0.0.1'
  }
  const userAgent = reqHeaders['user-agent'] || ''
  const referer = reqHeaders['referer'] || ''

  try {
    const config = useRuntimeConfig()
    const apiTarget = config.apiTarget || 'http://127.0.0.1:3003'
    await $fetch(`${apiTarget}/api/forward/click`, {
      method: 'POST',
      headers: {
        'x-forwarded-for': clientIp,
        'user-agent': userAgent,
        'referer': referer
      },
      body: { targetUrl: settings.value.forward_target_url }
    })
    isTracked.value = true
  } catch (err) {
    console.error('[forward-ssr] Tracking lỗi:', err)
  }

  // Nếu 0s thì chuyển trang lập tức ngay tại server sau khi đã ghi nhận
  if (settings.value.forward_enabled !== 'false' && waitSeconds.value <= 0 && settings.value.forward_target_url?.trim()) {
    await navigateTo(settings.value.forward_target_url.trim(), { external: true })
  }
}

// 2. Client-side tracking (cho SPA navigation hoặc fallback)
async function trackClickClient() {
  if (!import.meta.client || isTracked.value) return
  isTracked.value = true
  const target = settings.value.forward_target_url?.trim() || ''
  try {
    await $fetch('/api/forward/click', {
      method: 'POST',
      body: { targetUrl: target }
    })
  } catch {
    // ignore
  }
}

async function triggerRedirect() {
  if (isRedirecting.value) return
  isRedirecting.value = true
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }

  const target = settings.value.forward_target_url?.trim()
  if (!target || settings.value.forward_enabled === 'false') {
    navigateTo('/')
    return
  }

  await trackClickClient()

  if (target.startsWith('/') || target.startsWith('#')) {
    navigateTo(target)
  } else {
    window.location.href = target
  }
}

function startCountdown() {
  if (waitSeconds.value <= 0) {
    triggerRedirect()
    return
  }

  totalMs.value = waitSeconds.value * 1000
  remainingMs.value = totalMs.value

  const tickInterval = 50
  timerId = setInterval(() => {
    remainingMs.value = Math.max(0, remainingMs.value - tickInterval)
    if (remainingMs.value <= 0) {
      if (timerId) clearInterval(timerId)
      triggerRedirect()
    }
  }, tickInterval)
}

onMounted(() => {
  if (settings.value.forward_enabled === 'false') {
    setTimeout(() => navigateTo('/'), 1000)
    return
  }
  if (!isTracked.value) {
    trackClickClient()
  }
  if (waitSeconds.value <= 0) {
    triggerRedirect()
    return
  }
  startCountdown()
})

onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
})
</script>

<template>
  <main class="forward-viewport">
    <div class="ambient-glow glow-1"></div>
    <div class="ambient-glow glow-2"></div>

    <div class="forward-container">
      <!-- Brand Bar -->
      <header class="brand-bar">
        <NuxtLink to="/" class="brand-link" title="Về trang chủ Cái Tiệm">
          <img src="/images/brand/cafe-name.png" alt="Cái Tiệm KÀFE" class="brand-logo" />
        </NuxtLink>
        <span class="safe-badge">
          <Sparkles :size="13" />
          <span>Chuyển tiếp an toàn</span>
        </span>
      </header>

      <!-- Main Forward Card -->
      <article class="forward-card">
        <!-- Media Area -->
        <div v-if="settings.forward_media_type !== 'none' && settings.forward_media_url" class="media-container">
          <!-- Video -->
          <template v-if="settings.forward_media_type === 'video'">
            <div v-if="parsedVideo.type === 'youtube'" class="video-responsive">
              <iframe
                :src="parsedVideo.url"
                title="Cái Tiệm Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
            </div>
            <video
              v-else
              :src="parsedVideo.url"
              class="direct-video"
              autoplay
              muted
              loop
              playsinline
              controls
            ></video>
          </template>

          <!-- Image -->
          <div v-else class="image-wrapper">
            <img
              :src="settings.forward_media_url"
              :alt="settings.forward_title || 'Cái Tiệm'"
              class="forward-image"
              loading="eager"
            />
            <div class="image-overlay"></div>
          </div>
        </div>

        <!-- Content Area -->
        <div class="card-content">
          <!-- Typography: Chỉ hiển thị nếu người dùng có nhập Tiêu đề hoặc Mô tả -->
          <div v-if="hasTitle || hasDesc" class="text-block">
            <h1 v-if="hasTitle" class="card-title serif">{{ settings.forward_title }}</h1>
            <p v-if="hasDesc" class="card-desc">{{ settings.forward_description }}</p>
          </div>

          <!-- Progress Badge Countdown Capsule: Chỉ hiển thị nếu cài đặt > 0 giây -->
          <div v-if="waitSeconds > 0" class="countdown-badge-wrapper" role="status" aria-live="polite">
            <div class="badge-capsule">
              <!-- Animated Progress Fill -->
              <div
                class="badge-progress-fill"
                :style="{ width: `${progressPercent}%` }"
              ></div>

              <!-- Badge Foreground Content -->
              <div class="badge-label-content">
                <Timer :size="16" class="timer-icon" :class="{ pulse: !isRedirecting }" />
                <span v-if="!isRedirecting" class="badge-text">
                  Sẽ chuyển trang sau <strong>{{ remainingSeconds }}s</strong>...
                </span>
                <span v-else class="badge-text redirecting-text">
                  Đang chuyển hướng ngay...
                </span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button
              class="btn-primary-cta"
              :disabled="isRedirecting"
              @click="triggerRedirect"
            >
              <span>{{ settings.forward_button_text || 'Chuyển trang ngay' }}</span>
              <ArrowRight :size="18" class="cta-arrow" />
            </button>

            <NuxtLink to="/" class="btn-secondary-link">
              <Coffee :size="16" />
              <span>Xem Menu Cái Tiệm</span>
            </NuxtLink>
          </div>
        </div>
      </article>

      <!-- Footer Info -->
      <footer class="forward-footer">
        <span>© 2026 Cái Tiệm KÀFE · 391 Giải Phóng, Krông Pắc, Đắk Lắk</span>
      </footer>
    </div>
  </main>
</template>

<style scoped>
.forward-viewport {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background: #f7efe5;
  color: #3b2417;
  overflow-x: hidden;
  font-family: inherit;
}

/* Ambient glow backgrounds */
.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  opacity: 0.45;
}
.glow-1 {
  top: -10%;
  left: -10%;
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, #e8a87c 0%, rgba(232, 168, 124, 0) 70%);
}
.glow-2 {
  bottom: -10%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #c99365 0%, rgba(201, 147, 101, 0) 70%);
}

.forward-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 580px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0 auto;
}

/* Brand Bar */
.brand-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}
.brand-link {
  display: inline-flex;
  align-items: center;
  transition: transform 0.2s ease;
}
.brand-link:hover {
  transform: scale(1.03);
}
.brand-logo {
  height: 48px;
  width: auto;
  object-fit: contain;
}
.safe-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(59, 36, 23, 0.08);
  font-size: 0.78rem;
  font-weight: 600;
  color: #7d4427;
}

/* Forward Card */
.forward-card {
  background: #fffdf9;
  border-radius: 28px;
  overflow: hidden;
  box-shadow:
    0 20px 45px -15px rgba(59, 36, 23, 0.12),
    0 4px 12px rgba(59, 36, 23, 0.04),
    0 0 0 1px rgba(59, 36, 23, 0.06);
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s ease;
}

/* Media Showcase */
.media-container {
  position: relative;
  width: 100%;
  background: #24150f;
  overflow: hidden;
}
.image-wrapper {
  position: relative;
  width: 100%;
  max-height: 380px;
  overflow: hidden;
}
.forward-image {
  width: 100%;
  height: 100%;
  max-height: 380px;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}
.forward-card:hover .forward-image {
  transform: scale(1.02);
}
.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(36, 21, 15, 0.25) 0%, transparent 60%);
  pointer-events: none;
}

.video-responsive {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 ratio */
  height: 0;
}
.video-responsive iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
.direct-video {
  width: 100%;
  max-height: 360px;
  display: block;
  object-fit: contain;
  background: #000;
}

/* Card Content */
.card-content {
  padding: 30px 28px 34px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* Typography */
.text-block {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.card-title {
  font-size: 1.7rem;
  font-weight: 800;
  color: #3b2417;
  line-height: 1.25;
  margin: 0;
}
.card-desc {
  font-size: 0.95rem;
  color: #6e594d;
  line-height: 1.55;
  margin: 0;
}

/* Countdown Badge Progress Bar */
.countdown-badge-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}

.badge-capsule {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 380px;
  min-height: 46px;
  border-radius: 9999px;
  background: #f2e6d9;
  border: 1px solid rgba(135, 74, 39, 0.2);
  overflow: hidden;
  box-shadow: inset 0 2px 5px rgba(59, 36, 23, 0.06);
}

.badge-progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: linear-gradient(90deg, #c87d55 0%, #e29369 100%);
  border-radius: 9999px;
  transition: width 0.05s linear;
  box-shadow: 0 0 12px rgba(200, 125, 85, 0.4);
}

.badge-label-content {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  font-size: 0.92rem;
  font-weight: 600;
  color: #2b170e;
  user-select: none;
}

.timer-icon {
  color: #3b2417;
  flex-shrink: 0;
}
.timer-icon.pulse {
  animation: timerPulse 1s infinite alternate ease-in-out;
}
@keyframes timerPulse {
  0% { transform: scale(0.95); opacity: 0.85; }
  100% { transform: scale(1.1); opacity: 1; }
}

.badge-text strong {
  font-size: 1.05rem;
  font-weight: 800;
  color: #3b2417;
}
.redirecting-text {
  font-weight: 700;
  color: #3b2417;
}

/* Actions */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.btn-primary-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 24px;
  background: #3b2417;
  color: #fffaf3;
  border: none;
  border-radius: 16px;
  font-size: 1.02rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 8px 20px -6px rgba(59, 36, 23, 0.35);
}
.btn-primary-cta:hover:not(:disabled) {
  background: #503120;
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -6px rgba(59, 36, 23, 0.45);
}
.btn-primary-cta:active:not(:disabled) {
  transform: translateY(0);
}
.btn-primary-cta:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.cta-arrow {
  transition: transform 0.2s ease;
}
.btn-primary-cta:hover .cta-arrow {
  transform: translateX(4px);
}

.btn-secondary-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 10px 18px;
  background: transparent;
  color: #826a5c;
  border: 1px solid rgba(59, 36, 23, 0.12);
  border-radius: 14px;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}
.btn-secondary-link:hover {
  background: rgba(59, 36, 23, 0.05);
  color: #3b2417;
}

/* Footer */
.forward-footer {
  text-align: center;
  font-size: 0.78rem;
  color: #8e7a6e;
  padding: 8px 0;
}

@media (max-width: 640px) {
  .forward-viewport {
    padding: 16px 12px;
  }
  .card-content {
    padding: 22px 18px 26px;
  }
  .card-title {
    font-size: 1.45rem;
  }
  .badge-capsule {
    max-width: 100%;
  }
}
</style>
