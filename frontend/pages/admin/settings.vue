<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { Bot, Eye, EyeOff, RefreshCw, Save, Send, ShieldCheck, Sparkles, Zap } from '@lucide/vue'
import { api } from '~/src/services/api'
import type { ApiResponse, Settings } from '~/src/types'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const form = reactive({
  shop_name: 'Cái Tiệm',
  shop_phone: '0914.780.342',
  shop_address: '',
  shop_email: '',
  shipping_fee: 0,
  is_accepting_orders: true,
  ai_provider: 'gemini',
  ai_api_key: '',
  ai_proxy_url: '',
  ai_model: 'gemini-2.5-flash',
})

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')

const showApiKey = ref(false)
const fetchingModels = ref(false)
const availableModels = ref<string[]>([])

const testPrompt = ref('Hãy lập 1 thông điệp ngắn gọn (khoảng 25 từ) chúc khách hàng một ngày bình yên, ấm áp.')
const testingAi = ref(false)
const testResult = ref<{ text: string; latencyMs: number; model: string } | null>(null)
const testError = ref('')

const providerOptions = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'claude', label: 'Anthropic Claude' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'custom', label: 'Tùy chỉnh (OpenAI Compatible)' },
]

onMounted(async () => {
  try {
    const { data } = await api.get<ApiResponse<Settings>>('/admin/settings')
    Object.assign(form, {
      ...data.data,
      shipping_fee: Number(data.data.shipping_fee || 0),
      is_accepting_orders: data.data.is_accepting_orders !== 'false',
      ai_provider: data.data.ai_provider || 'gemini',
      ai_api_key: data.data.ai_api_key || '',
      ai_proxy_url: data.data.ai_proxy_url || '',
      ai_model: data.data.ai_model || 'gemini-2.5-flash',
    })
    await fetchModelList()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không tải được cài đặt.'
  } finally {
    loading.value = false
  }
})

async function fetchModelList() {
  fetchingModels.value = true
  try {
    const res = await api.post<ApiResponse<string[]>>('/admin/ai/models', {
      provider: form.ai_provider,
      apiKey: form.ai_api_key,
      proxyUrl: form.ai_proxy_url,
    })
    availableModels.value = res.data.data
    if (availableModels.value.length && !availableModels.value.includes(form.ai_model)) {
      form.ai_model = availableModels.value[0]
    }
  } catch (e) {
    console.warn('Không tải được danh sách model:', e)
  } finally {
    fetchingModels.value = false
  }
}

watch(() => form.ai_provider, () => {
  fetchModelList()
})

async function save() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await api.put('/admin/settings', form)
    success.value = 'Đã lưu cài đặt hệ thống & AI thành công.'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không lưu được.'
  } finally {
    saving.value = false
  }
}

async function runAiTest() {
  testingAi.value = true
  testError.value = ''
  testResult.value = null
  try {
    const res = await api.post<ApiResponse<{ text: string; latencyMs: number; model: string }>>('/admin/ai/test', {
      provider: form.ai_provider,
      apiKey: form.ai_api_key,
      proxyUrl: form.ai_proxy_url,
      model: form.ai_model,
      prompt: testPrompt.value,
    })
    testResult.value = res.data.data
  } catch (e) {
    testError.value = e instanceof Error ? e.message : 'Không thể kết nối tới nhà cung cấp AI.'
  } finally {
    testingAi.value = false
  }
}
</script>

<template>
  <section class="settings-page">
    <div class="admin-page-head">
      <div>
        <span class="eyebrow">Cài đặt</span>
        <h1>Thông tin quán & AI</h1>
        <p>Nội dung này được hiển thị trên website, dùng khi tính đơn và cấu hình AI tích hợp.</p>
      </div>
    </div>

    <p v-if="error" class="admin-error">{{ error }}</p>
    <p v-if="success" class="admin-success">{{ success }}</p>

    <form class="settings-form" @submit.prevent="save">
      <div class="settings-grid">
        <section class="admin-card panel">
          <h2 class="serif">Thông tin liên hệ</h2>
          <label class="field-label">Tên quán<input v-model="form.shop_name" class="field" required maxlength="120" /></label>
          <label class="field-label">Số điện thoại<input v-model="form.shop_phone" class="field" maxlength="30" /></label>
          <label class="field-label">Địa chỉ<textarea v-model="form.shop_address" class="field" rows="3" maxlength="500"></textarea></label>
          <label class="field-label">Email hiển thị<input v-model="form.shop_email" class="field" type="email" maxlength="254" /></label>
        </section>

        <section class="admin-card panel">
          <h2 class="serif">Nhận đơn & Giao hàng</h2>
          <label class="field-label">Phí giao hàng mặc định (đ)<input v-model.number="form.shipping_fee" class="field" type="number" min="0" step="1000" /></label>
          <label class="switch-row">
            <div>
              <b>Nhận đơn trên website</b>
              <small>Khi tắt, khách vẫn xem được menu nhưng không gửi được đơn.</small>
            </div>
            <input v-model="form.is_accepting_orders" type="checkbox" />
          </label>
          <div class="security">
            <ShieldCheck :size="24" />
            <div>
              <b>Bảo vệ dữ liệu & Fallback API Key</b>
              <p>Nếu không nhập API Key riêng ở mục AI, hệ thống tự động dùng <code>GEMINI_API_KEY</code> trong <code>.env</code> làm mặc định.</p>
            </div>
          </div>
          <button class="btn btn-primary save-btn" :disabled="saving || loading">
            <span v-if="saving" class="spinner"></span>
            <Save v-else :size="18" />
            {{ saving ? 'Đang lưu...' : 'Lưu cài đặt' }}
          </button>
        </section>
      </div>

      <section class="admin-card panel ai-card">
        <div class="ai-header">
          <span class="ai-badge-icon"><Bot :size="22" /></span>
          <div>
            <h2 class="serif">Cấu Hình Trí Tuệ Nhân Tạo (AI)</h2>
            <p class="sub-desc">Cấu hình nhà cung cấp AI dùng tạo thông điệp Vibe QR và các nội dung tự động.</p>
          </div>
        </div>

        <div class="ai-fields-grid">
          <label class="field-label">NHÀ CUNG CẤP AI
            <select v-model="form.ai_provider" class="field">
              <option v-for="opt in providerOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>

          <label class="field-label">API KEY
            <div class="api-key-input-wrap">
              <input v-model="form.ai_api_key" :type="showApiKey ? 'text' : 'password'" class="field" placeholder="Để trống sẽ dùng GEMINI_API_KEY trong .env" />
              <button type="button" class="toggle-key-btn" @click="showApiKey = !showApiKey">
                <EyeOff v-if="showApiKey" :size="16" />
                <Eye v-else :size="16" />
              </button>
            </div>
          </label>
        </div>

        <label class="field-label">PROXY URL (TÙY CHỌN)
          <input v-model="form.ai_proxy_url" type="text" class="field" placeholder="https://vertex-key.com/api/v1 (để trống nếu dùng endpoint mặc định)" />
        </label>

        <label class="field-label">MODEL SỬ DỤNG
          <div class="model-select-row">
            <select v-model="form.ai_model" class="field flex-1">
              <option v-for="m in availableModels" :key="m" :value="m">{{ m }}</option>
              <option v-if="!availableModels.includes(form.ai_model)" :value="form.ai_model">{{ form.ai_model }}</option>
            </select>
            <button type="button" class="btn-fetch-model" :disabled="fetchingModels" @click="fetchModelList">
              <RefreshCw :class="{ spin: fetchingModels }" :size="16" />
              {{ fetchingModels ? 'Đang tải...' : 'Tải Model' }}
            </button>
          </div>
        </label>

        <div class="ai-divider"></div>

        <div class="ai-playground-section">
          <div class="playground-title">
            <Zap :size="16" class="zap-icon" />
            <span>THỬ NGHIỆM TRỰC TIẾP (AI PLAYGROUND)</span>
          </div>

          <div class="playground-input-row">
            <textarea v-model="testPrompt" rows="2" class="field flex-1" placeholder="Nhập prompt câu lệnh thử nghiệm AI..."></textarea>
            <button type="button" class="btn btn-primary btn-test-action" :disabled="testingAi" @click="runAiTest">
              <span v-if="testingAi" class="spinner"></span>
              <Send v-else :size="16" />
              {{ testingAi ? 'Đang gửi...' : 'Gửi Request' }}
            </button>
          </div>

          <div v-if="testError" class="playground-error">
            <strong>Lỗi kết nối AI:</strong> {{ testError }}
          </div>

          <div v-if="testResult" class="playground-result">
            <div class="result-meta">
              <span class="meta-tag model-tag"><Bot :size="13" /> {{ testResult.model }}</span>
              <span class="meta-tag time-tag"><Sparkles :size="13" /> {{ testResult.latencyMs }}ms</span>
            </div>
            <p class="result-text">{{ testResult.text }}</p>
          </div>
        </div>

        <button class="btn btn-primary save-btn-full" :disabled="saving || loading">
          <span v-if="saving" class="spinner"></span>
          <Save v-else :size="18" />
          {{ saving ? 'Đang lưu tất cả cài đặt...' : 'Lưu tất cả cài đặt' }}
        </button>
      </section>
    </form>
  </section>
</template>

<style scoped>
.settings-page { display: grid; gap: 24px; }
.settings-form { display: grid; gap: 24px; }
.settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.panel { padding: 26px; display: grid; gap: 18px; align-content: start; }
.panel h2 { margin: 0 0 4px; color: var(--coffee); font-size: 1.7rem; }
.sub-desc { margin: 4px 0 0; color: #796a5f; font-size: 0.88rem; }
.switch-row { display: flex; gap: 20px; justify-content: space-between; align-items: center; padding: 17px; border-radius: 14px; background: #f3e8db; }
.switch-row b, .switch-row small { display: block; }
.switch-row small { margin-top: 4px; color: #86776d; line-height: 1.4; }
.switch-row input { width: 20px; height: 20px; cursor: pointer; }
.security { display: flex; gap: 12px; padding: 16px; color: #4c6947; border: 1px solid #ceddc8; border-radius: 14px; background: #edf5e9; align-items: flex-start; }
.security code { background: rgba(0, 0, 0, 0.06); padding: 2px 6px; border-radius: 4px; }
.security p { margin: 4px 0 0; color: #5d6f58; font-size: 0.84rem; line-height: 1.5; }
.save-btn { width: 100%; }
.ai-card { display: grid; gap: 20px; }
.ai-header { display: flex; align-items: center; gap: 14px; padding-bottom: 6px; border-bottom: 1px solid rgba(59, 36, 23, 0.08); }
.ai-badge-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; background: #eeddca; color: var(--coffee); }
.ai-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.api-key-input-wrap { position: relative; display: flex; align-items: center; }
.api-key-input-wrap .field { padding-right: 44px; width: 100%; }
.toggle-key-btn { position: absolute; right: 12px; background: transparent; border: none; color: #8c7b70; cursor: pointer; padding: 4px; display: grid; place-items: center; }
.model-select-row { display: flex; gap: 12px; align-items: center; }
.flex-1 { flex: 1; }
.btn-fetch-model { display: inline-flex; align-items: center; gap: 8px; padding: 12px 18px; background: #ede2d5; border: 1px solid rgba(59, 36, 23, 0.16); border-radius: 12px; color: var(--coffee); font-weight: 600; font-size: 0.88rem; cursor: pointer; white-space: nowrap; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.ai-divider { height: 1px; background: rgba(59, 36, 23, 0.08); margin: 4px 0; }
.ai-playground-section { display: grid; gap: 14px; }
.playground-title { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.06em; color: #874a27; }
.zap-icon { color: #874a27; }
.playground-input-row { display: flex; gap: 14px; align-items: flex-start; }
.btn-test-action { padding: 14px 24px; white-space: nowrap; align-self: stretch; display: flex; align-items: center; justify-content: center; gap: 8px; }
.playground-error { padding: 14px 18px; border-radius: 12px; background: #fde8e8; border: 1px solid #f8b4b4; color: #9b1c1c; font-size: 0.88rem; line-height: 1.5; }
.playground-result { padding: 18px 22px; border-radius: 14px; background: #f9f4ed; border: 1px solid rgba(135, 74, 39, 0.2); display: grid; gap: 10px; }
.result-meta { display: flex; gap: 10px; }
.meta-tag { display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 99px; font-size: 0.76rem; font-weight: 700; }
.model-tag { background: #eadece; color: var(--coffee); }
.time-tag { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.result-text { margin: 0; color: var(--coffee); font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; }
.save-btn-full { width: 100%; padding: 15px; font-size: 1rem; margin-top: 8px; }
@media (max-width: 850px) { .settings-grid, .ai-fields-grid { grid-template-columns: 1fr; } .playground-input-row { flex-direction: column; } .btn-test-action { width: 100%; } }
</style>
