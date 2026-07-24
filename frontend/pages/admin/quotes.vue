<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { Copy, Download, Pencil, Plus, Printer, QrCode, Sparkles, X } from '@lucide/vue'
import QRCode from 'qrcode'
import { api } from '~/src/services/api'
import type { ApiResponse, Quote } from '~/src/types'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const quotes = ref<Quote[]>([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const show = ref(false)
const generating = ref(false)
const copied = ref(false)

const form = reactive({ id: 0, content: '', topic: 'Cà phê', isActive: true })
const ai = reactive({ count: 10, topic: 'Cà phê và năng lượng tích cực' })

// QR Code Canvas & Data URL
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const qrDataUrl = ref('')

const requestUrl = useRequestURL()
const vibeUrl = ref(import.meta.client ? `${window.location.origin}/vibe` : `${requestUrl.origin}/vibe`)

async function renderQrCode() {
  if (!import.meta.client) return
  await nextTick()
  try {
    if (qrCanvas.value) {
      await QRCode.toCanvas(qrCanvas.value, vibeUrl.value, {
        width: 260,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#3B2417', light: '#FFFDF9' }
      })
    }
    qrDataUrl.value = await QRCode.toDataURL(vibeUrl.value, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#3B2417', light: '#FFFDF9' }
    })
  } catch (e) {
    console.error('Không tạo được QR:', e)
  }
}

async function downloadQrCode() {
  if (!import.meta.client) return
  try {
    const rawQrUrl = await QRCode.toDataURL(vibeUrl.value, {
      width: 1000,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#3B2417', light: '#FFFDF9' }
    })

    const qrImg = new Image()
    qrImg.src = rawQrUrl
    await new Promise((resolve) => {
      qrImg.onload = resolve
    })

    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 1160
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#FFFDF9'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.drawImage(qrImg, 50, 40, 900, 900)

    ctx.fillStyle = '#3B2417'
    ctx.font = 'bold 38px "Playfair Display", "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Quét để nhận Lời nhắn hôm nay ^^', 500, 1050)

    const finalUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'caitiem-vibe-qr.png'
    link.href = finalUrl
    link.click()
  } catch (e) {
    error.value = 'Không tải được file QR.'
  }
}

function printQrCard() {
  if (import.meta.client) {
    window.print()
  }
}

function copyVibeLink() {
  if (import.meta.client) {
    navigator.clipboard.writeText(vibeUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

async function load() {
  loading.value = true
  try {
    const { data } = await api.get<ApiResponse<Quote[]>>('/admin/quotes')
    quotes.value = data.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không tải được.'
  } finally {
    loading.value = false
    renderQrCode()
  }
}

function edit(q?: Quote) {
  Object.assign(form, q ? { id: q.id, content: q.content, topic: q.topic || '', isActive: q.isActive ?? true } : { id: 0, content: '', topic: 'Cà phê', isActive: true })
  show.value = true
}

async function save() {
  try {
    if (form.id) await api.put(`/admin/quotes/${form.id}`, form)
    else await api.post('/admin/quotes', form)
    show.value = false
    success.value = 'Đã lưu thông điệp.'
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không lưu được.'
  }
}

async function hide(q: Quote) {
  try {
    await api.delete(`/admin/quotes/${q.id}`)
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không ẩn được.'
  }
}

async function generate() {
  generating.value = true
  error.value = ''
  try {
    const { data } = await api.post<ApiResponse<Quote[]>>('/admin/quotes/generate-ai', ai)
    success.value = data.message || 'Đã tạo thông điệp.'
    await load()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không tạo được.'
  } finally {
    generating.value = false
  }
}

onMounted(() => {
  if (import.meta.client) {
    vibeUrl.value = `${window.location.origin}/vibe`
  }
  load()
})
</script>

<template>
  <section class="quotes-page">
    <div class="print-qr-only">
      <div class="print-card">
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="Mã QR Vibe" class="print-qr-img" />
        <p class="print-text">Quét để nhận Lời nhắn hôm nay ^^</p>
      </div>
    </div>

    <div class="admin-page-head">
      <div>
        <span class="eyebrow">Vibe QR</span>
        <h1>Thông Điệp Tích Cực & Mã QR Quán</h1>
        <p>Quản lý các thông điệp ngẫu nhiên và in tem mã QR dán lên ly / bàn cho khách quét.</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-primary" @click="edit()"><Plus :size="18" /> Thêm câu</button>
      </div>
    </div>

    <p v-if="error" class="admin-error">{{ error }}</p>
    <p v-if="success" class="admin-success">{{ success }}</p>

    <section class="admin-card qr-banner-panel">
      <div class="qr-preview-box">
        <canvas ref="qrCanvas" class="qr-canvas"></canvas>
        <span class="qr-badge"><QrCode :size="14" /> Mã QR dùng chung</span>
      </div>

      <div class="qr-banner-info">
        <div class="banner-title">
          <span class="pill-tag"><Sparkles :size="13" /> Tem dán ly & Bàn quán</span>
          <h2 class="serif">Mã QR Vibe Tiệm (Dùng In Tem / Dán Bàn)</h2>
          <p>Mã QR tĩnh cố định này dùng để in tem dán lên ly nước hoặc để tại bàn. Mỗi khi khách dùng camera điện thoại quét mã QR này, hệ thống sẽ <strong>tự động chọn ngẫu nhiên 1 câu thông điệp</strong> đang mở bên dưới để truyền năng lượng tích cực cho khách.</p>
        </div>

        <div class="qr-url-row">
          <code>{{ vibeUrl }}</code>
          <button class="btn-icon" title="Sao chép đường dẫn" @click="copyVibeLink">
            <Copy :size="15" /> {{ copied ? 'Đã chép!' : 'Sao chép link' }}
          </button>
        </div>

        <div class="qr-action-buttons">
          <button class="btn btn-primary" @click="printQrCard">
            <Printer :size="17" /> In Tem Mã QR
          </button>
          <button class="btn btn-outline" @click="downloadQrCode">
            <Download :size="17" /> Tải Ảnh QR (PNG 1200px HD)
          </button>
        </div>
      </div>
    </section>

    <section class="ai-box admin-card">
      <div class="ai-icon"><Sparkles :size="22" /></div>
      <div>
        <h2 class="serif">Tạo nhanh câu mới bằng AI</h2>
        <p>AI sẽ tự sinh các câu phù hợp với chủ đề; nội dung trùng lặp sẽ tự động bỏ qua.</p>
      </div>
      <input v-model="ai.topic" class="field" placeholder="Chủ đề (ví dụ: Chữa lành, Ngày mới)" aria-label="Chủ đề" />
      <input v-model.number="ai.count" class="field count" type="number" min="1" max="20" aria-label="Số lượng" />
      <button class="btn btn-primary" :disabled="generating" @click="generate">
        <span v-if="generating" class="spinner"></span>
        {{ generating ? 'Đang tạo...' : 'Tạo thông điệp' }}
      </button>
    </section>

    <div class="quote-grid">
      <article v-for="quote in quotes" :key="quote.id" class="admin-card quote">
        <span class="topic">{{ quote.topic || 'Thông điệp' }}</span>
        <blockquote class="serif">“{{ quote.content }}”</blockquote>
        <div>
          <small>{{ quote.scanCount || 0 }} lượt quét</small>
          <span :class="['pill', quote.isActive ? 'green' : 'red']">{{ quote.isActive ? 'Đang dùng' : 'Đã ẩn' }}</span>
          <button @click="edit(quote)"><Pencil :size="15" /> Sửa</button>
          <button v-if="quote.isActive" @click="hide(quote)">Ẩn</button>
        </div>
      </article>
    </div>

    <div v-if="loading" class="admin-empty">Đang tải danh sách thông điệp...</div>
    <div v-else-if="!quotes.length" class="admin-empty">Chưa có thông điệp nào. Vui lòng bấm "Thêm câu" hoặc dùng AI để tạo.</div>

    <div v-if="show" class="admin-modal" @click.self="show = false">
      <form class="admin-modal-box" @submit.prevent="save">
        <button type="button" class="admin-modal-close" @click="show = false"><X /></button>
        <h2>{{ form.id ? 'Sửa thông điệp' : 'Thêm thông điệp' }}</h2>
        <label class="field-label">Nội dung
          <textarea v-model="form.content" class="field" required minlength="10" maxlength="500" rows="6"></textarea>
        </label>
        <label class="field-label topic-field">Chủ đề
          <input v-model="form.topic" class="field" maxlength="100" />
        </label>
        <label class="check">
          <input v-model="form.isActive" type="checkbox" /> Đang sử dụng
        </label>
        <button class="btn btn-primary save">Lưu thông điệp</button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.quotes-page { display: grid; gap: 22px; }
.print-qr-only { display: none; }
.qr-banner-panel { padding: 26px; display: grid; grid-template-columns: 280px 1fr; gap: 30px; align-items: center; background: #fffaf3; border: 1px solid rgba(59, 36, 23, 0.12); }
.qr-preview-box { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px; background: #fdf8f2; border: 1px solid rgba(59, 36, 23, 0.1); border-radius: 18px; }
.qr-canvas { width: 100% !important; height: auto !important; max-width: 240px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06); }
.qr-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.76rem; font-weight: 700; color: #874a27; text-transform: uppercase; letter-spacing: 0.06em; }
.qr-banner-info { display: grid; gap: 16px; }
.pill-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 99px; background: #ede0d0; color: var(--coffee); font-size: 0.76rem; font-weight: 700; width: fit-content; }
.banner-title h2 { margin: 8px 0 6px; color: var(--coffee); font-size: 1.65rem; }
.banner-title p { margin: 0; color: #796b60; font-size: 0.92rem; line-height: 1.6; }
.qr-url-row { display: flex; align-items: center; gap: 12px; }
.qr-url-row code { padding: 8px 14px; background: #f3e8dc; border-radius: 8px; font-size: 0.86rem; color: var(--coffee); font-weight: 600; }
.btn-icon { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid rgba(59, 36, 23, 0.15); border-radius: 8px; background: #fdf8f2; color: var(--coffee); font-weight: 600; font-size: 0.84rem; cursor: pointer; }
.btn-icon:hover { background: #ede0d0; }
.qr-action-buttons { display: flex; gap: 12px; margin-top: 4px; }
.ai-box { padding: 20px; display: grid; grid-template-columns: 55px minmax(180px, 0.8fr) 1fr 85px auto; gap: 14px; align-items: center; }
.ai-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 50%; color: #9a5d37; background: #f0ddc6; }
.ai-box h2 { margin: 0; color: var(--coffee); font-size: 1.45rem; }
.ai-box p { margin: 3px 0; color: #8a7b70; font-size: 0.8rem; }
.quote-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.quote { padding: 22px; }
.topic { color: #a36843; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.66rem; font-weight: 800; }
.quote blockquote { margin: 15px 0 22px; color: var(--coffee); font-size: 1.35rem; line-height: 1.45; }
.quote > div { display: flex; align-items: center; gap: 10px; }
.quote small { margin-right: auto; color: #8c7d73; }
.quote button { display: flex; gap: 4px; align-items: center; border: 0; background: transparent; color: #905534; font-weight: 700; cursor: pointer; }
.topic-field, .check { margin-top: 15px; }
.check { display: flex; gap: 7px; }
.save { width: 100%; margin-top: 20px; }
@media print {
  body * { visibility: hidden !important; }
  .print-qr-only, .print-qr-only * { visibility: visible !important; }
  .print-qr-only { display: flex !important; position: fixed !important; inset: 0 !important; justify-content: center !important; align-items: center !important; background: white !important; z-index: 999999 !important; }
  .print-card { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; text-align: center; }
  .print-qr-img { width: 320px; height: 320px; object-fit: contain; margin-bottom: 16px; }
  .print-text { margin: 0; font-size: 1.35rem; font-weight: 700; color: #3b2417; font-family: "Playfair Display", "Segoe UI", serif; }
}
@media (max-width: 1050px) { .qr-banner-panel { grid-template-columns: 1fr; } .ai-box { grid-template-columns: 55px 1fr; } .ai-box .field, .ai-box .btn { grid-column: 2; } .count { width: 100%; } }
@media (max-width: 650px) { .quote-grid { grid-template-columns: 1fr; } .ai-box { grid-template-columns: 1fr; } .ai-box .field, .ai-box .btn { grid-column: 1; } .admin-page-head { align-items: flex-start; flex-direction: column; } .qr-action-buttons { flex-direction: column; } }
</style>
