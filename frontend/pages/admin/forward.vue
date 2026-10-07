<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Copy,
  Download,
  ExternalLink,
  Film,
  Globe,
  Image as ImageIcon,
  Laptop,
  MousePointerClick,
  QrCode,
  RefreshCw,
  Save,
  Smartphone,
  Sparkles,
  Timer,
  TrendingUp,
  Upload,
  Users,
  X
} from '@lucide/vue'
import QRCode from 'qrcode'
import { api } from '~/src/services/api'
import type { ApiResponse, Settings } from '~/src/types'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const activeTab = ref<'settings' | 'stats'>('settings')

const form = reactive({
  forward_enabled: 'true',
  forward_seconds: 5,
  forward_target_url: 'https://caitiemkafe.com',
  forward_media_type: 'image',
  forward_media_url: '/images/brand/hero-cafe.webp',
  forward_title: '',
  forward_description: '',
  forward_button_text: 'Chuyển trang ngay'
})

const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const error = ref('')
const success = ref('')

// QR Code Modal
const showQrModal = ref(false)
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const qrDataUrl = ref('')
const copied = ref(false)

const requestUrl = useRequestURL()
const forwardUrl = computed(() => {
  if (import.meta.client) {
    return `${window.location.origin}/forward`
  }
  return `${requestUrl.origin}/forward`
})

// Video parser helper
const parsedVideo = computed(() => {
  const url = form.forward_media_url || ''
  if (!url) return { type: 'direct', url: '' }
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/)
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      url: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&mute=1&playsinline=1`
    }
  }
  return { type: 'direct', url }
})

// Preview countdown simulation
const simProgress = ref(100)
const simSeconds = ref(5)
let simInterval: ReturnType<typeof setInterval> | null = null

function runSimulation() {
  if (simInterval) clearInterval(simInterval)
  const total = Number(form.forward_seconds)
  if (total <= 0) {
    simSeconds.value = 0
    simProgress.value = 0
    return
  }

  simSeconds.value = total
  simProgress.value = 100

  const start = Date.now()
  const totalMs = total * 1000

  simInterval = setInterval(() => {
    const elapsed = Date.now() - start
    const remaining = Math.max(0, totalMs - elapsed)
    simProgress.value = (remaining / totalMs) * 100
    simSeconds.value = Math.max(0, Math.ceil(remaining / 1000))
    if (remaining <= 0) {
      setTimeout(() => {
        if (simInterval) runSimulation()
      }, 1000)
      if (simInterval) clearInterval(simInterval)
    }
  }, 50)
}

watch(() => form.forward_seconds, () => {
  runSimulation()
})

// ================= STATISTICS STATE =================
const currentMonthStr = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const statsFilter = reactive({
  type: 'month' as 'month' | 'range',
  month: currentMonthStr(),
  from: '',
  to: '',
  page: 1,
  limit: 20
})

const statsLoading = ref(false)
interface StatsData {
  filter: { from: string; to: string; month: string };
  summary: { totalClicks: number; uniqueIps: number };
  dailyStats: Array<{ date: string; clicks: number; uniqueIps: number }>;
  topIps: Array<{ ipAddress: string; clicks: number; lastClick: string }>;
  recentClicks: Array<{
    id: number;
    ipAddress: string;
    userAgent: string | null;
    referer: string | null;
    targetUrl: string | null;
    createdAt: string;
  }>;
  meta: { page: number; limit: number; total: number; pages: number };
}

const statsData = ref<StatsData | null>(null)

async function fetchStats(page = 1) {
  statsLoading.value = true
  statsFilter.page = page
  try {
    const params: Record<string, any> = {
      page: statsFilter.page,
      limit: statsFilter.limit
    }
    if (statsFilter.type === 'month') {
      params.month = statsFilter.month
    } else if (statsFilter.from && statsFilter.to) {
      params.from = statsFilter.from
      params.to = statsFilter.to
    }

    const res = await api.get<ApiResponse<StatsData>>('/admin/forward/stats', { params })
    statsData.value = res.data.data
  } catch (e) {
    console.error('Không tải được thống kê:', e)
  } finally {
    statsLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'stats' && !statsData.value) {
    fetchStats(1)
  }
})

function setQuickMonth(offset: number) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  statsFilter.type = 'month'
  statsFilter.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  fetchStats(1)
}

const maxDailyClicks = computed(() => {
  if (!statsData.value?.dailyStats?.length) return 1
  return Math.max(1, ...statsData.value.dailyStats.map((d) => Number(d.clicks)))
})

function parseUserAgent(ua: string | null) {
  if (!ua) return { device: 'Không rõ', browser: 'Không rõ', isMobile: false }
  let device = 'Desktop'
  let isMobile = false
  if (/mobile/i.test(ua)) { device = 'Mobile'; isMobile = true }
  if (/tablet|ipad/i.test(ua)) { device = 'Tablet'; isMobile = true }
  if (/iphone/i.test(ua)) { device = 'iPhone'; isMobile = true }
  if (/android/i.test(ua)) { device = 'Android'; isMobile = true }

  let browser = 'Khác'
  if (/zalo/i.test(ua)) browser = 'Zalo App'
  else if (/fbav|facebook/i.test(ua)) browser = 'Facebook App'
  else if (/chrome|crios/i.test(ua) && !/edge|edg|opr/i.test(ua)) browser = 'Chrome'
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari'
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox'
  else if (/edg/i.test(ua)) browser = 'Edge'

  return { device, browser, isMobile }
}

function formatDateTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDateOnly(isoDate: string) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function formatIp(ip: string) {
  if (!ip) return 'Không rõ'
  if (ip === '::1' || ip === '127.0.0.1') return '127.0.0.1 (Localhost)'
  return ip
}

onMounted(async () => {
  try {
    const { data } = await api.get<ApiResponse<Settings>>('/admin/settings')
    if (data?.data) {
      const d = data.data
      form.forward_enabled = d.forward_enabled !== undefined ? String(d.forward_enabled) : 'true'
      form.forward_seconds = d.forward_seconds !== undefined ? Math.max(0, Number(d.forward_seconds)) : 5
      form.forward_target_url = d.forward_target_url || 'https://caitiemkafe.com'
      form.forward_media_type = (d.forward_media_type as any) || 'image'
      form.forward_media_url = d.forward_media_url || '/images/brand/hero-cafe.webp'
      form.forward_title = d.forward_title || ''
      form.forward_description = d.forward_description || ''
      form.forward_button_text = d.forward_button_text || 'Chuyển trang ngay'
    }
    runSimulation()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không tải được cài đặt.'
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await api.put('/admin/settings', {
      forward_enabled: String(form.forward_enabled),
      forward_seconds: String(form.forward_seconds),
      forward_target_url: form.forward_target_url,
      forward_media_type: form.forward_media_type,
      forward_media_url: form.forward_media_url,
      forward_title: form.forward_title,
      forward_description: form.forward_description,
      forward_button_text: form.forward_button_text
    })
    success.value = 'Đã lưu cấu hình Trang Forward thành công!'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không lưu được cấu hình.'
  } finally {
    saving.value = false
  }
}

async function uploadFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploading.value = true
  error.value = ''
  try {
    const fd = new FormData()
    fd.append('image', file)
    const { data } = await api.post<ApiResponse<{ url: string }>>('/admin/upload', fd)
    form.forward_media_url = data.data.url
    form.forward_media_type = 'image'
    success.value = 'Đã tải ảnh lên thành công!'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Lỗi khi tải ảnh lên.'
  } finally {
    uploading.value = false
    target.value = ''
  }
}

async function openQr() {
  showQrModal.value = true
  await nextTick()
  if (qrCanvas.value) {
    try {
      await QRCode.toCanvas(qrCanvas.value, forwardUrl.value, {
        width: 260,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#3B2417', light: '#FFFDF9' }
      })
      qrDataUrl.value = await QRCode.toDataURL(forwardUrl.value, {
        width: 800,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#3B2417', light: '#FFFDF9' }
      })
    } catch (e) {
      console.error('Không tạo được QR:', e)
    }
  }
}

function copyLink() {
  navigator.clipboard.writeText(forwardUrl.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <section class="forward-admin-page">
    <!-- Header -->
    <div class="admin-page-head">
      <div>
        <span class="eyebrow">Trang trung gian</span>
        <h1>Cấu hình & Thống kê Forward</h1>
        <p>Quản lý trang chuyển tiếp và theo dõi chi tiết số lượt click, khách truy cập theo IP.</p>
      </div>
      <div class="head-actions">
        <button type="button" class="btn btn-outline" @click="openQr">
          <QrCode :size="17" />
          <span>Mã QR Forward</span>
        </button>
        <NuxtLink to="/forward" target="_blank" class="btn btn-outline">
          <ExternalLink :size="17" />
          <span>Mở trang /forward</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Main Navigation Tabs -->
    <div class="forward-tabs-nav">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'settings' }"
        @click="activeTab = 'settings'"
      >
        <Compass :size="18" />
        <span>Cấu hình & Giao diện</span>
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'stats' }"
        @click="activeTab = 'stats'"
      >
        <BarChart3 :size="18" />
        <span>Thống kê Click & IP</span>
        <span v-if="statsData?.summary?.totalClicks" class="counter-pill">
          {{ statsData.summary.totalClicks }}
        </span>
      </button>
    </div>

    <!-- Alerts -->
    <p v-if="error" class="admin-error">{{ error }}</p>
    <p v-if="success" class="admin-success">{{ success }}</p>

    <!-- ================= TAB 1: SETTINGS ================= -->
    <div v-show="activeTab === 'settings'" class="forward-layout-grid">
      <!-- Settings Form -->
      <form class="settings-column" @submit.prevent="save">
        <!-- Card 1: Core redirect settings -->
        <section class="admin-card panel">
          <div class="card-head-title">
            <Compass :size="20" class="text-amber" />
            <h2 class="serif">Cơ chế chuyển tiếp</h2>
          </div>

          <!-- Switch Enabled -->
          <label class="switch-row">
            <div>
              <b>Kích hoạt trang Forward</b>
              <small>Khi bật, người dùng truy cập /forward sẽ thấy màn hình đếm ngược và được chuyển tiếp.</small>
            </div>
            <input
              v-model="form.forward_enabled"
              type="checkbox"
              true-value="true"
              false-value="false"
            />
          </label>

          <!-- Target URL -->
          <label class="field-label">
            LIÊN KẾT TRANG ĐÍCH (TARGET URL) *
            <input
              v-model="form.forward_target_url"
              class="field"
              type="url"
              required
              placeholder="https://facebook.com/cai-tiem-cafe hoặc https://..."
            />
            <small class="field-hint">Trang web sẽ được tự động chuyển đến. URL này được ẩn hoàn toàn trên giao diện.</small>
          </label>

          <!-- Countdown Seconds -->
          <label class="field-label">
            SỐ GIÂY CHỜ CHUYỂN TRANG *
            <div class="seconds-input-wrap">
              <input
                v-model.number="form.forward_seconds"
                class="field"
                type="number"
                min="0"
                max="60"
                required
              />
              <span class="unit-tag">giây (s)</span>
            </div>
            <small class="field-hint">Nhập 0 để chuyển tiếp lập tức khi click vào link. Nhập từ 1 trở lên để hiển thị badge đếm ngược.</small>
          </label>
        </section>

        <!-- Card 2: Media Setting -->
        <section class="admin-card panel">
          <div class="card-head-title">
            <ImageIcon :size="20" class="text-amber" />
            <h2 class="serif">Ảnh & Video Hiển Thị</h2>
          </div>

          <!-- Media Type Selector -->
          <div class="media-type-tabs">
            <button
              type="button"
              class="type-tab-btn"
              :class="{ active: form.forward_media_type === 'image' }"
              @click="form.forward_media_type = 'image'"
            >
              <ImageIcon :size="16" />
              <span>Hình ảnh</span>
            </button>
            <button
              type="button"
              class="type-tab-btn"
              :class="{ active: form.forward_media_type === 'video' }"
              @click="form.forward_media_type = 'video'"
            >
              <Film :size="16" />
              <span>Video (YouTube / MP4)</span>
            </button>
          </div>

          <!-- If Image Type -->
          <div v-if="form.forward_media_type === 'image'" class="media-input-box">
            <div class="upload-zone-wrapper">
              <label class="upload-btn-label">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  class="hidden-file-input"
                  :disabled="uploading"
                  @change="uploadFile"
                />
                <span class="upload-cta">
                  <span v-if="uploading" class="spinner"></span>
                  <Upload v-else :size="18" />
                  {{ uploading ? 'Đang tải ảnh...' : 'Tải ảnh mới từ máy' }}
                </span>
              </label>
              <span class="or-separator">hoặc dán đường dẫn ảnh:</span>
            </div>

            <input
              v-model="form.forward_media_url"
              class="field"
              type="text"
              placeholder="VD: /images/brand/hero-cafe.webp hoặc https://..."
            />
          </div>

          <!-- If Video Type -->
          <div v-else class="media-input-box">
            <label class="field-label">
              ĐƯỜNG DẪN VIDEO (URL)
              <input
                v-model="form.forward_media_url"
                class="field"
                type="url"
                placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
              />
              <small class="field-hint">Hỗ trợ link video YouTube (chuẩn, shorts, embed) hoặc link file video .mp4 trực tiếp.</small>
            </label>
          </div>
        </section>

        <!-- Card 3: Content & Button Text -->
        <section class="admin-card panel">
          <div class="card-head-title">
            <Sparkles :size="20" class="text-amber" />
            <h2 class="serif">Nội dung (Tùy chọn)</h2>
          </div>

          <label class="field-label">
            TIÊU ĐỀ CHÍNH (ĐỂ TRỐNG SẼ KHÔNG HIỂN THỊ)
            <input
              v-model="form.forward_title"
              class="field"
              maxlength="150"
              placeholder="Để trống nếu không muốn hiển thị tiêu đề"
            />
          </label>

          <label class="field-label">
            LỜI NHẮN / MÔ TẢ (ĐỂ TRỐNG SẼ KHÔNG HIỂN THỊ)
            <textarea
              v-model="form.forward_description"
              class="field"
              rows="3"
              maxlength="500"
              placeholder="Để trống nếu không muốn hiển thị mô tả"
            ></textarea>
          </label>

          <label class="field-label">
            CHỮ TRÊN NÚT BẤM (CTA)
            <input
              v-model="form.forward_button_text"
              class="field"
              maxlength="50"
              placeholder="VD: Chuyển trang ngay"
            />
          </label>

          <!-- Submit Button -->
          <button class="btn btn-primary save-btn-full" :disabled="saving || loading || uploading">
            <span v-if="saving" class="spinner"></span>
            <Save v-else :size="18" />
            {{ saving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình Trang Forward' }}
          </button>
        </section>
      </form>

      <!-- Right Column: Live Simulator Card -->
      <aside class="preview-column">
        <div class="preview-sticky">
          <div class="preview-card-header">
            <div class="preview-badge-status">
              <span class="live-dot"></span>
              <span>Xem trước thời gian thực (Live Preview)</span>
            </div>
            <button type="button" class="btn-refresh-sim" title="Chạy lại mô phỏng đếm ngược" @click="runSimulation">
              <RefreshCw :size="14" />
            </button>
          </div>

          <!-- Simulated Phone Frame -->
          <div class="device-mockup">
            <div class="mockup-screen">
              <!-- Mock Header -->
              <div class="mock-header">
                <img src="/images/brand/cafe-name.png" alt="Cái Tiệm" class="mock-logo" />
                <span class="mock-safe-tag">Chuyển tiếp an toàn</span>
              </div>

              <!-- Mock Media -->
              <div class="mock-media-box">
                <template v-if="form.forward_media_type === 'video' && parsedVideo.url">
                  <div v-if="parsedVideo.type === 'youtube'" class="mock-video-aspect">
                    <iframe :src="parsedVideo.url" title="Preview Video"></iframe>
                  </div>
                  <video v-else :src="parsedVideo.url" controls class="mock-direct-video"></video>
                </template>
                <div v-else class="mock-img-wrapper">
                  <img
                    :src="form.forward_media_url || '/images/brand/hero-cafe.webp'"
                    alt="Preview"
                    class="mock-img"
                  />
                </div>
              </div>

              <!-- Mock Content Area -->
              <div class="mock-content-body">
                <h3 v-if="form.forward_title?.trim()" class="mock-title serif">{{ form.forward_title }}</h3>
                <p v-if="form.forward_description?.trim()" class="mock-desc">{{ form.forward_description }}</p>

                <!-- THE KEY COUNTDOWN BADGE -->
                <div v-if="form.forward_seconds > 0" class="mock-badge-wrap">
                  <div class="mock-capsule">
                    <div class="mock-fill" :style="{ width: `${simProgress}%` }"></div>
                    <div class="mock-label">
                      <Timer :size="14" class="mock-timer-icon" />
                      <span>Sẽ chuyển trang sau <strong>{{ simSeconds }}s</strong>...</span>
                    </div>
                  </div>
                </div>
                <div v-else class="mock-badge-wrap">
                  <div class="mock-capsule mock-capsule-instant">
                    <div class="mock-label">
                      <Sparkles :size="14" class="mock-timer-icon text-amber" />
                      <span>Chuyển tiếp tức thì (0s)</span>
                    </div>
                  </div>
                </div>

                <!-- Mock CTA Button -->
                <button type="button" class="mock-cta-btn">
                  <span>{{ form.forward_button_text || 'Chuyển trang ngay' }}</span>
                  <ArrowRight :size="15" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- ================= TAB 2: STATISTICS & IP LOGS ================= -->
    <div v-show="activeTab === 'stats'" class="stats-view-container">
      <!-- Filter Bar -->
      <div class="admin-card filter-card">
        <div class="filter-controls-wrap">
          <div class="filter-type-toggle">
            <button
              type="button"
              class="filter-type-btn"
              :class="{ active: statsFilter.type === 'month' }"
              @click="statsFilter.type = 'month'"
            >
              Theo tháng
            </button>
            <button
              type="button"
              class="filter-type-btn"
              :class="{ active: statsFilter.type === 'range' }"
              @click="statsFilter.type = 'range'"
            >
              Khoảng thời gian
            </button>
          </div>

          <!-- Month Selector -->
          <div v-if="statsFilter.type === 'month'" class="filter-inputs">
            <div class="month-input-wrap">
              <Calendar :size="17" class="input-icon" />
              <input
                v-model="statsFilter.month"
                type="month"
                class="field-sm"
                @change="fetchStats(1)"
              />
            </div>
            <div class="quick-month-btns">
              <button type="button" class="btn-chip" @click="setQuickMonth(0)">Tháng này</button>
              <button type="button" class="btn-chip" @click="setQuickMonth(-1)">Tháng trước</button>
            </div>
          </div>

          <!-- Date Range Selector -->
          <div v-else class="filter-inputs range-inputs">
            <div class="date-input-wrap">
              <span class="range-tag">Từ</span>
              <input v-model="statsFilter.from" type="date" class="field-sm" />
            </div>
            <div class="date-input-wrap">
              <span class="range-tag">Đến</span>
              <input v-model="statsFilter.to" type="date" class="field-sm" />
            </div>
            <button type="button" class="btn btn-primary btn-sm" @click="fetchStats(1)">
              Lọc
            </button>
          </div>

          <!-- Refresh Button -->
          <button
            type="button"
            class="btn-refresh"
            :disabled="statsLoading"
            title="Tải lại dữ liệu"
            @click="fetchStats(statsFilter.page)"
          >
            <RefreshCw :size="16" :class="{ spin: statsLoading }" />
            <span>{{ statsLoading ? 'Đang tải...' : 'Làm mới' }}</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="statsLoading && !statsData" class="stats-loading-box">
        <span class="spinner"></span>
        <p>Đang tải dữ liệu thống kê...</p>
      </div>

      <!-- Stats Content -->
      <template v-else-if="statsData">
        <!-- Summary KPI Cards -->
        <div class="stats-summary-grid">
          <div class="admin-card kpi-card">
            <div class="kpi-icon-wrap icon-amber">
              <MousePointerClick :size="24" />
            </div>
            <div class="kpi-body">
              <span class="kpi-label">Tổng lượt click / truy cập</span>
              <strong class="kpi-number">{{ statsData.summary.totalClicks.toLocaleString('vi-VN') }}</strong>
              <small class="kpi-sub">Trong giai đoạn đã chọn</small>
            </div>
          </div>

          <div class="admin-card kpi-card">
            <div class="kpi-icon-wrap icon-blue">
              <Users :size="24" />
            </div>
            <div class="kpi-body">
              <span class="kpi-label">Khách truy cập duy nhất (Unique IP)</span>
              <strong class="kpi-number">{{ statsData.summary.uniqueIps.toLocaleString('vi-VN') }}</strong>
              <small class="kpi-sub">Số địa chỉ IP riêng biệt</small>
            </div>
          </div>

          <div class="admin-card kpi-card">
            <div class="kpi-icon-wrap icon-green">
              <TrendingUp :size="24" />
            </div>
            <div class="kpi-body">
              <span class="kpi-label">Tần suất trung bình</span>
              <strong class="kpi-number">
                {{ statsData.summary.uniqueIps ? (statsData.summary.totalClicks / statsData.summary.uniqueIps).toFixed(1) : '0' }}
              </strong>
              <small class="kpi-sub">Lượt click / mỗi IP</small>
            </div>
          </div>
        </div>

        <!-- 2 Column: Daily Breakdown & Top IPs -->
        <div class="stats-detail-grid">
          <!-- Daily Breakdown -->
          <section class="admin-card panel">
            <div class="card-head-title">
              <BarChart3 :size="20" class="text-amber" />
              <h2 class="serif">Phân bố theo ngày</h2>
            </div>

            <div v-if="!statsData.dailyStats?.length" class="empty-state">
              Chưa có dữ liệu click nào trong khoảng thời gian này.
            </div>

            <div v-else class="daily-bars-list">
              <div
                v-for="day in statsData.dailyStats"
                :key="day.date"
                class="daily-row"
              >
                <div class="daily-date-label">
                  <b>{{ formatDateOnly(day.date) }}</b>
                </div>
                <div class="daily-bar-track">
                  <div
                    class="daily-bar-fill"
                    :style="{ width: `${(Number(day.clicks) / maxDailyClicks) * 100}%` }"
                  ></div>
                </div>
                <div class="daily-counts">
                  <span class="click-count">{{ day.clicks }} lượt</span>
                  <span class="ip-count">({{ day.uniqueIps }} IP)</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Top IPs -->
          <section class="admin-card panel">
            <div class="card-head-title">
              <Globe :size="20" class="text-amber" />
              <h2 class="serif">Top 10 IP truy cập nhiều nhất</h2>
            </div>

            <div v-if="!statsData.topIps?.length" class="empty-state">
              Chưa ghi nhận IP nào.
            </div>

            <div v-else class="top-ip-list">
              <div
                v-for="(item, idx) in statsData.topIps"
                :key="item.ipAddress"
                class="top-ip-item"
              >
                <span class="ip-rank">#{{ idx + 1 }}</span>
                <div class="ip-info">
                  <code class="ip-badge">{{ formatIp(item.ipAddress) }}</code>
                  <small class="ip-last-seen">Lần cuối: {{ formatDateTime(item.lastClick) }}</small>
                </div>
                <div class="ip-count-badge">
                  <strong>{{ item.clicks }}</strong> lượt
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Recent Click Logs Table -->
        <section class="admin-card panel">
          <div class="card-head-title">
            <MousePointerClick :size="20" class="text-amber" />
            <h2 class="serif">Chi tiết các lượt click gần đây</h2>
          </div>

          <div v-if="!statsData.recentClicks?.length" class="empty-state">
            Không có nhật ký truy cập trong khoảng thời gian này.
          </div>

          <div v-else class="table-responsive">
            <table class="clicks-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Địa chỉ IP</th>
                  <th>Thiết bị & Trình duyệt</th>
                  <th>Nguồn (Referer)</th>
                  <th>Link đích</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="click in statsData.recentClicks" :key="click.id">
                  <td class="text-nowrap">{{ formatDateTime(click.createdAt) }}</td>
                  <td>
                    <code class="ip-cell">{{ formatIp(click.ipAddress) }}</code>
                  </td>
                  <td>
                    <div class="ua-badge-cell">
                      <span class="ua-tag device-tag" :class="{ 'tag-mobile': parseUserAgent(click.userAgent).isMobile }">
                        <component
                          :is="parseUserAgent(click.userAgent).isMobile ? Smartphone : Laptop"
                          :size="13"
                        />
                        {{ parseUserAgent(click.userAgent).device }}
                      </span>
                      <span class="ua-tag browser-tag">
                        {{ parseUserAgent(click.userAgent).browser }}
                      </span>
                    </div>
                  </td>
                  <td class="text-truncate-cell" :title="click.referer || 'Trực tiếp / Không có'">
                    {{ click.referer || 'Trực tiếp' }}
                  </td>
                  <td class="text-truncate-cell" :title="click.targetUrl || ''">
                    {{ click.targetUrl || 'Mặc định' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="statsData.meta && statsData.meta.pages > 1" class="pagination-bar">
            <button
              class="btn-page"
              :disabled="statsData.meta.page <= 1"
              @click="fetchStats(statsData.meta.page - 1)"
            >
              <ChevronLeft :size="16" />
              <span>Trang trước</span>
            </button>

            <span class="page-indicator">
              Trang <strong>{{ statsData.meta.page }}</strong> / {{ statsData.meta.pages }} (Tổng {{ statsData.meta.total }} lượt)
            </span>

            <button
              class="btn-page"
              :disabled="statsData.meta.page >= statsData.meta.pages"
              @click="fetchStats(statsData.meta.page + 1)"
            >
              <span>Trang sau</span>
              <ChevronRight :size="16" />
            </button>
          </div>
        </section>
      </template>
    </div>

    <!-- QR Code Modal -->
    <div v-if="showQrModal" class="modal-overlay" @click.self="showQrModal = false">
      <div class="qr-modal-box">
        <div class="qr-modal-head">
          <h3 class="serif">Mã QR Trang Forward</h3>
          <button class="close-btn" @click="showQrModal = false"><X :size="18" /></button>
        </div>
        <p class="qr-modal-desc">Khách quét mã này trên điện thoại sẽ vào trang chuyển tiếp có ảnh/video và thanh đếm ngược.</p>

        <div class="qr-canvas-center">
          <canvas ref="qrCanvas"></canvas>
        </div>

        <div class="qr-link-copy">
          <span class="qr-link-text">{{ forwardUrl }}</span>
          <button class="btn-copy" @click="copyLink">
            <Check v-if="copied" :size="16" class="text-green" />
            <Copy v-else :size="16" />
            {{ copied ? 'Đã sao chép' : 'Sao chép' }}
          </button>
        </div>

        <div class="qr-modal-actions">
          <a
            v-if="qrDataUrl"
            :href="qrDataUrl"
            download="cai-tiem-forward-qr.png"
            class="btn btn-primary"
          >
            <Download :size="17" />
            <span>Tải ảnh QR (In ấn)</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.forward-admin-page {
  display: grid;
  gap: 24px;
}
.admin-page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 6px;
}
.admin-page-head h1 {
  margin: 7px 0 4px;
  color: var(--coffee);
  font: 700 2.3rem 'Playfair Display', serif;
}
.admin-page-head p {
  margin: 0;
  color: #87786e;
}
.head-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 16px;
  background: #fffdf9;
  border: 1px solid rgba(59, 36, 23, 0.15);
  border-radius: 12px;
  color: var(--coffee);
  font-weight: 600;
  font-size: 0.88rem;
  text-decoration: none;
  cursor: pointer;
  transition: 0.2s;
}
.btn-outline:hover {
  background: #f7ede2;
  border-color: rgba(59, 36, 23, 0.3);
}

/* Tabs Navigation */
.forward-tabs-nav {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid rgba(59, 36, 23, 0.1);
  padding-bottom: 4px;
}
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  background: transparent;
  border: 0;
  border-radius: 12px 12px 0 0;
  color: #79685e;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.tab-btn:hover {
  color: var(--coffee);
  background: rgba(59, 36, 23, 0.04);
}
.tab-btn.active {
  color: var(--coffee);
  background: #fffdf9;
  box-shadow: 0 -2px 8px rgba(59, 36, 23, 0.05);
}
.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  right: 0;
  height: 3px;
  background: #c87d55;
  border-radius: 3px;
}
.counter-pill {
  padding: 2px 8px;
  border-radius: 99px;
  background: #eadec4;
  color: #3b2417;
  font-size: 0.74rem;
  font-weight: 800;
}

/* Layout Grid */
.forward-layout-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 24px;
  align-items: start;
}

.settings-column {
  display: grid;
  gap: 20px;
}
.panel {
  padding: 24px;
  display: grid;
  gap: 16px;
}
.card-head-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(59, 36, 23, 0.08);
}
.card-head-title h2 {
  font-size: 1.35rem;
  margin: 0;
  color: var(--coffee);
}
.text-amber {
  color: #c87d55;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 14px;
  background: #f3e8db;
  cursor: pointer;
}
.switch-row b, .switch-row small {
  display: block;
}
.switch-row small {
  margin-top: 4px;
  color: #86776d;
  line-height: 1.4;
}
.switch-row input {
  width: 22px;
  height: 22px;
  cursor: pointer;
}

.seconds-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.seconds-input-wrap .field {
  padding-right: 70px;
}
.unit-tag {
  position: absolute;
  right: 14px;
  font-size: 0.84rem;
  font-weight: 600;
  color: #8c7b70;
  pointer-events: none;
}
.field-hint {
  font-size: 0.8rem;
  color: #8c7b70;
  margin-top: 3px;
  display: block;
}

/* Media selector */
.media-type-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 4px;
  border-radius: 14px;
  background: #eee3d5;
}
.type-tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: #6d5b50;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: 0.2s;
}
.type-tab-btn.active {
  background: #fffdf9;
  color: var(--coffee);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.media-input-box {
  display: grid;
  gap: 12px;
}
.upload-zone-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.upload-btn-label {
  cursor: pointer;
  display: inline-block;
}
.hidden-file-input {
  display: none;
}
.upload-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #3b2417;
  color: #fffaf3;
  border-radius: 11px;
  font-weight: 600;
  font-size: 0.88rem;
  transition: 0.2s;
}
.upload-cta:hover {
  background: #503120;
}
.or-separator {
  font-size: 0.84rem;
  color: #8c7b70;
}

.save-btn-full {
  width: 100%;
  padding: 15px;
  font-size: 1rem;
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Right column preview */
.preview-column {
  min-width: 0;
}
.preview-sticky {
  position: sticky;
  top: 98px;
  display: grid;
  gap: 14px;
}
.preview-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}
.preview-badge-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #796153;
}
.live-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #10b981;
  animation: pulseDot 1.5s infinite;
}
@keyframes pulseDot {
  0% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.9); opacity: 0.7; }
}
.btn-refresh-sim {
  border: 1px solid rgba(59, 36, 23, 0.15);
  background: #fffdf9;
  border-radius: 8px;
  padding: 6px 10px;
  color: #796153;
  cursor: pointer;
}
.btn-refresh-sim:hover {
  background: #f5ece1;
}

/* Simulated Phone Frame */
.device-mockup {
  background: #24150f;
  border-radius: 28px;
  padding: 12px;
  box-shadow: 0 16px 36px -10px rgba(59, 36, 23, 0.3);
}
.mockup-screen {
  background: #fffdf9;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.mock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f7efe5;
  border-bottom: 1px solid rgba(59, 36, 23, 0.06);
}
.mock-logo {
  height: 24px;
  object-fit: contain;
}
.mock-safe-tag {
  font-size: 0.68rem;
  font-weight: 700;
  color: #8c5030;
  background: rgba(255, 255, 255, 0.8);
  padding: 3px 8px;
  border-radius: 99px;
}

.mock-media-box {
  width: 100%;
  background: #1a0f0a;
  max-height: 200px;
  overflow: hidden;
}
.mock-img-wrapper {
  width: 100%;
  height: 180px;
}
.mock-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mock-video-aspect {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  height: 0;
}
.mock-video-aspect iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
.mock-direct-video {
  width: 100%;
  max-height: 180px;
  object-fit: contain;
}

.mock-content-body {
  padding: 18px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
}
.mock-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #3b2417;
  margin: 0;
}
.mock-desc {
  font-size: 0.82rem;
  color: #6e594d;
  line-height: 1.45;
  margin: 0;
}

.mock-badge-wrap {
  display: flex;
  justify-content: center;
}
.mock-capsule {
  position: relative;
  width: 100%;
  max-width: 270px;
  height: 38px;
  border-radius: 99px;
  background: #f2e6d9;
  border: 1px solid rgba(135, 74, 39, 0.25);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mock-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: linear-gradient(90deg, #c87d55 0%, #e29369 100%);
  border-radius: 99px;
  transition: width 0.05s linear;
}
.mock-label {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #2b170e;
}
.mock-timer-icon {
  color: #3b2417;
}
.mock-label strong {
  font-size: 0.95rem;
  font-weight: 800;
}
.mock-capsule-instant {
  background: #faeedf;
  border-color: rgba(200, 125, 85, 0.4);
}
.mock-cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px 14px;
  background: #3b2417;
  color: #fffaf3;
  border: 0;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
}

/* ================= STATS VIEW STYLES ================= */
.stats-view-container {
  display: grid;
  gap: 22px;
}
.filter-card {
  padding: 16px 20px;
}
.filter-controls-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.filter-type-toggle {
  display: inline-flex;
  padding: 4px;
  background: #eee3d5;
  border-radius: 10px;
}
.filter-type-btn {
  padding: 7px 14px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #6d5b50;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}
.filter-type-btn.active {
  background: #fffdf9;
  color: var(--coffee);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.filter-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.month-input-wrap, .date-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fffdf9;
  padding: 4px 10px;
  border: 1px solid rgba(59, 36, 23, 0.15);
  border-radius: 10px;
}
.field-sm {
  border: 0;
  background: transparent;
  padding: 5px;
  font-size: 0.86rem;
  font-family: inherit;
  color: var(--coffee);
  font-weight: 600;
  outline: none;
}
.range-tag {
  font-size: 0.8rem;
  font-weight: 700;
  color: #8c7b70;
}
.quick-month-btns {
  display: flex;
  gap: 6px;
}
.btn-chip {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(59, 36, 23, 0.12);
  background: #fffdf9;
  color: var(--coffee);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-chip:hover {
  background: #f5ebe0;
}
.btn-sm {
  padding: 8px 14px;
  font-size: 0.84rem;
}
.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(59, 36, 23, 0.15);
  background: #fffdf9;
  color: var(--coffee);
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-refresh:hover:not(:disabled) {
  background: #f5ebe0;
}
.btn-refresh:disabled {
  opacity: 0.6;
}

/* KPI Summary */
.stats-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.kpi-card {
  padding: 22px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.kpi-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.icon-amber { background: #fde8db; color: #c87d55; }
.icon-blue { background: #e0f2fe; color: #0284c7; }
.icon-green { background: #dcfce7; color: #16a34a; }
.kpi-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.kpi-label {
  font-size: 0.84rem;
  font-weight: 700;
  color: #79685e;
}
.kpi-number {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--coffee);
  line-height: 1.1;
}
.kpi-sub {
  font-size: 0.78rem;
  color: #9c8a7e;
}

/* Detail Grid */
.stats-detail-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 20px;
}
.daily-bars-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.daily-row {
  display: grid;
  grid-template-columns: 85px 1fr 100px;
  align-items: center;
  gap: 12px;
  font-size: 0.84rem;
}
.daily-date-label {
  color: var(--coffee);
  font-weight: 600;
}
.daily-bar-track {
  height: 18px;
  background: #eee2d4;
  border-radius: 99px;
  overflow: hidden;
  position: relative;
}
.daily-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #c87d55, #e09b76);
  border-radius: 99px;
  transition: width 0.3s ease;
  min-width: 4px;
}
.daily-counts {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  font-size: 0.82rem;
}
.click-count {
  font-weight: 700;
  color: var(--coffee);
}
.ip-count {
  color: #8c7b70;
}

/* Top IP List */
.top-ip-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.top-ip-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f7efe5;
  border-radius: 12px;
}
.ip-rank {
  font-size: 0.84rem;
  font-weight: 800;
  color: #c87d55;
  width: 26px;
}
.ip-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.ip-badge {
  font-family: monospace;
  font-size: 0.88rem;
  color: var(--coffee);
  font-weight: 700;
}
.ip-last-seen {
  font-size: 0.74rem;
  color: #8c7b70;
}
.ip-count-badge {
  font-size: 0.84rem;
  color: #79685e;
}
.ip-count-badge strong {
  font-size: 1rem;
  color: var(--coffee);
}

/* Recent Clicks Table */
.table-responsive {
  overflow-x: auto;
}
.clicks-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.clicks-table th {
  text-align: left;
  padding: 10px 14px;
  background: #f3e6d8;
  color: #6d5b50;
  font-weight: 700;
  font-size: 0.8rem;
  border-bottom: 2px solid rgba(59, 36, 23, 0.08);
}
.clicks-table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(59, 36, 23, 0.06);
  color: var(--coffee);
}
.text-nowrap {
  white-space: nowrap;
}
.ip-cell {
  font-family: monospace;
  background: #f2e6d9;
  padding: 3px 7px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
}
.ua-badge-cell {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.ua-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}
.device-tag {
  background: #e8ded3;
  color: #554439;
}
.device-tag.tag-mobile {
  background: #fed7aa;
  color: #9a3412;
}
.browser-tag {
  background: #f1f5f9;
  color: #475569;
}
.text-truncate-cell {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #79685e;
  font-size: 0.82rem;
}

/* Pagination */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid rgba(59, 36, 23, 0.06);
}
.btn-page {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid rgba(59, 36, 23, 0.15);
  background: #fffdf9;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--coffee);
  cursor: pointer;
}
.btn-page:hover:not(:disabled) {
  background: #f5ebe0;
}
.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-indicator {
  font-size: 0.84rem;
  color: #79685e;
}

.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: #8c7b70;
  font-size: 0.88rem;
}
.stats-loading-box {
  padding: 50px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #79685e;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 12, 8, 0.65);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
}
.qr-modal-box {
  background: #fffdf9;
  border-radius: 24px;
  padding: 26px;
  max-width: 440px;
  width: 100%;
  display: grid;
  gap: 16px;
}
.qr-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.qr-modal-head h3 {
  font-size: 1.4rem;
  margin: 0;
  color: var(--coffee);
}
.close-btn {
  border: 0;
  background: transparent;
  color: #796153;
  cursor: pointer;
}
.qr-modal-desc {
  font-size: 0.88rem;
  color: #726257;
  margin: 0;
}
.qr-canvas-center {
  display: flex;
  justify-content: center;
  padding: 12px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid rgba(59, 36, 23, 0.08);
}
.qr-link-copy {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f5ebe0;
  border-radius: 12px;
  overflow: hidden;
}
.qr-link-text {
  flex: 1;
  font-size: 0.82rem;
  color: var(--coffee);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.btn-copy {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #fffdf9;
  border: 1px solid rgba(59, 36, 23, 0.15);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.text-green {
  color: #16a34a;
}
.qr-modal-actions {
  display: flex;
  justify-content: center;
}

@media (max-width: 960px) {
  .forward-layout-grid {
    grid-template-columns: 1fr;
  }
  .preview-sticky {
    position: static;
  }
  .device-mockup {
    max-width: 360px;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .forward-admin-page {
    gap: 16px;
  }

  .admin-page-head {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 14px !important;
    margin-bottom: 16px !important;
  }

  .admin-page-head h1 {
    font-size: 1.55rem !important;
    line-height: 1.25 !important;
    margin: 4px 0 !important;
    word-break: normal !important;
  }

  .admin-page-head p {
    font-size: 0.85rem !important;
    line-height: 1.45 !important;
  }

  .head-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
  }

  .head-actions .btn-outline {
    justify-content: center;
    padding: 9px 10px;
    font-size: 0.82rem;
    white-space: nowrap;
    border-radius: 10px;
  }

  /* Segmented pill tabs */
  .forward-tabs-nav {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    background: #eadbc9;
    padding: 4px;
    border-radius: 14px;
    border-bottom: none;
  }

  .tab-btn {
    justify-content: center;
    padding: 10px 6px;
    border-radius: 10px;
    font-size: 0.82rem;
    font-weight: 700;
    gap: 6px;
  }

  .tab-btn.active {
    background: #fffdf9;
    box-shadow: 0 2px 6px rgba(59, 36, 23, 0.1);
  }

  .tab-btn.active::after {
    display: none;
  }

  .counter-pill {
    padding: 1px 6px;
    font-size: 0.68rem;
  }

  /* Filter card */
  .filter-card {
    padding: 14px;
    border-radius: 16px;
  }

  .filter-controls-wrap {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filter-type-toggle {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    background: #e3d5c6;
    padding: 3px;
    border-radius: 10px;
  }

  .filter-type-btn {
    text-align: center;
    padding: 8px 6px;
    font-size: 0.82rem;
  }

  .filter-inputs {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    width: 100%;
  }

  .month-input-wrap {
    width: 100%;
    justify-content: space-between;
    padding: 8px 12px;
    box-sizing: border-box;
  }

  .month-input-wrap .field-sm {
    flex: 1;
    font-size: 0.88rem;
  }

  .date-input-wrap {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    width: 100%;
    padding: 6px 10px;
    box-sizing: border-box;
  }

  .date-input-wrap .field-sm {
    width: 100%;
    font-size: 0.8rem;
  }

  .quick-month-btns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    gap: 8px;
  }

  .btn-chip {
    text-align: center;
    padding: 8px;
    font-size: 0.82rem;
  }

  .btn-refresh {
    width: 100%;
    justify-content: center;
    padding: 9px;
    font-size: 0.84rem;
  }

  /* Summary KPI cards */
  .stats-summary-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .kpi-card {
    padding: 14px 16px;
    gap: 14px;
    border-radius: 16px;
  }

  .kpi-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }

  .kpi-number {
    font-size: 1.55rem;
  }

  .kpi-label {
    font-size: 0.8rem;
  }

  /* Detail Grid */
  .stats-detail-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .panel {
    padding: 18px 16px;
    border-radius: 18px;
  }

  .card-head-title h2 {
    font-size: 1.15rem;
  }

  /* Daily bars */
  .daily-row {
    grid-template-columns: 74px 1fr 76px;
    gap: 8px;
    font-size: 0.78rem;
  }

  .daily-bar-track {
    height: 14px;
  }

  .daily-counts {
    font-size: 0.75rem;
  }

  /* Top IPs */
  .top-ip-item {
    padding: 9px 12px;
    border-radius: 10px;
    gap: 8px;
  }

  .ip-badge {
    font-size: 0.8rem;
  }

  .ip-count-badge {
    font-size: 0.8rem;
  }

  /* Table */
  .table-responsive {
    -webkit-overflow-scrolling: touch;
    border-radius: 12px;
  }

  .clicks-table th,
  .clicks-table td {
    padding: 8px 10px;
    font-size: 0.78rem;
  }

  .ip-cell {
    font-size: 0.75rem;
    padding: 2px 5px;
  }

  .ua-tag {
    font-size: 0.7rem;
    padding: 2px 6px;
  }

  .text-truncate-cell {
    max-width: 120px;
  }

  .pagination-bar {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
    text-align: center;
  }

  .btn-page {
    justify-content: center;
  }

  /* Settings form */
  .switch-row {
    padding: 12px 14px;
    border-radius: 12px;
  }

  .switch-row b {
    font-size: 0.88rem;
  }

  .switch-row small {
    font-size: 0.76rem;
  }

  .media-type-tabs {
    padding: 3px;
    gap: 6px;
  }

  .type-tab-btn {
    padding: 9px 10px;
    font-size: 0.84rem;
  }

  .upload-zone-wrapper {
    flex-direction: column;
    align-items: stretch;
  }

  .upload-cta {
    width: 100%;
    justify-content: center;
  }

  .save-btn-full {
    padding: 13px;
    font-size: 0.95rem;
  }

  /* Modal */
  .qr-modal-box {
    padding: 20px 16px;
    border-radius: 20px;
    max-width: calc(100vw - 32px);
  }

  .qr-canvas-center canvas {
    max-width: 100% !important;
    height: auto !important;
  }

  .qr-link-copy {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .btn-copy {
    justify-content: center;
    width: 100%;
  }

  .qr-modal-actions .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 420px) {
  .head-actions {
    grid-template-columns: 1fr;
  }

  .daily-row {
    grid-template-columns: 65px 1fr 65px;
    font-size: 0.74rem;
  }
}
</style>
