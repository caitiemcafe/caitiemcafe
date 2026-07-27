<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { CheckCircle2, Clock3, MapPin, Minus, Plus, ShoppingBag, Trash2, X } from '@lucide/vue'
import { useCartStore } from '~/src/stores/cart'
import { api } from '~/src/services/api'
import type { ApiResponse, Settings } from '~/src/types'

interface CustomerProfile {
  id: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerAddress: string
}

const props = defineProps<{ settings: Settings }>()
const cart = useCartStore()
const step = ref<'cart' | 'checkout' | 'success'>('cart')
const loading = ref(false)
const error = ref('')
const orderCode = ref('')

const form = reactive({
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  notes: ''
})

const savedProfiles = ref<CustomerProfile[]>([])
const selectedProfileId = ref<string | null>(null)

const shippingFee = computed(() => Number(props.settings.shipping_fee || 0))
const total = computed(() => cart.subtotal + shippingFee.value)
const money = (value: number | string) => new Intl.NumberFormat('vi-VN').format(Number(value)) + 'đ'

function loadProfiles() {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem('caitiem_saved_profiles')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        savedProfiles.value = parsed
        if (!form.customerName && !form.customerPhone && !form.customerAddress) {
          applyProfile(parsed[0])
        }
      }
    }
  } catch (e) {
    // ignore json error
  }
}

function applyProfile(p: CustomerProfile) {
  selectedProfileId.value = p.id
  form.customerName = p.customerName || ''
  form.customerPhone = p.customerPhone || ''
  form.customerEmail = p.customerEmail || ''
  form.customerAddress = p.customerAddress || ''
}

function saveProfile(name: string, phone: string, email: string, address: string) {
  if (!import.meta.client) return
  if (!name.trim() || !phone.trim() || !address.trim()) return

  const cleanName = name.trim()
  const cleanPhone = phone.trim()
  const cleanEmail = email.trim()
  const cleanAddress = address.trim()

  let profiles: CustomerProfile[] = []
  try {
    const raw = localStorage.getItem('caitiem_saved_profiles')
    if (raw) profiles = JSON.parse(raw) || []
  } catch (e) {}

  const existingIdx = profiles.findIndex(
    (p) => p.customerPhone === cleanPhone && p.customerAddress.toLowerCase() === cleanAddress.toLowerCase()
  )

  const updatedProfile: CustomerProfile = {
    id: existingIdx >= 0 ? profiles[existingIdx].id : crypto.randomUUID(),
    customerName: cleanName,
    customerPhone: cleanPhone,
    customerEmail: cleanEmail,
    customerAddress: cleanAddress
  }

  if (existingIdx >= 0) {
    profiles.splice(existingIdx, 1)
  }
  profiles.unshift(updatedProfile)
  profiles = profiles.slice(0, 4)

  try {
    localStorage.setItem('caitiem_saved_profiles', JSON.stringify(profiles))
    savedProfiles.value = profiles
    selectedProfileId.value = updatedProfile.id
  } catch (e) {}
}

onMounted(() => {
  loadProfiles()
})

function goToCheckout() {
  loadProfiles()
  step.value = 'checkout'
}

function close() {
  cart.isOpen = false
  if (step.value === 'success') step.value = 'cart'
}

function navigateToMenu() {
  close()
  if (import.meta.client) {
    if (window.location.pathname === '/') {
      const el = document.getElementById('menu')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      } else {
        window.location.hash = '#menu'
      }
    } else {
      navigateTo('/#menu')
    }
  }
}

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const idempotencyKey = crypto.randomUUID()
    const { data } = await api.post<ApiResponse<{ orderCode: string }>>('/orders', {
      ...form,
      idempotencyKey,
      items: cart.items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.notes || null
      }))
    })
    orderCode.value = data.data.orderCode
    saveProfile(form.customerName, form.customerPhone, form.customerEmail, form.customerAddress)
    cart.clear()
    cart.isOpen = true
    step.value = 'success'
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Không thể đặt hàng.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="cart.isOpen" class="overlay drawer-overlay" @click.self="close">
    <aside class="drawer" aria-label="Giỏ hàng">
      <div class="drawer-head">
        <div>
          <span class="eyebrow">Đơn của bạn</span>
          <h2 class="serif">{{ step === 'checkout' ? 'Thông tin giao hàng' : step === 'success' ? 'Quán đã nhận đơn' : 'Giỏ hàng' }}</h2>
        </div>
        <button aria-label="Đóng" @click="close"><X /></button>
      </div>

      <template v-if="step === 'cart'">
        <div v-if="!cart.items.length" class="empty">
          <ShoppingBag :size="42" />
          <h3>Giỏ hàng đang trống</h3>
          <p>Chọn một món thật vừa ý rồi quay lại đây nhé.</p>
          <button class="btn btn-primary" @click="navigateToMenu">Xem menu</button>
        </div>
        <div v-else class="cart-content">
          <div class="cart-list">
            <article v-for="item in cart.items" :key="item.key" class="cart-item">
              <img :src="item.product.imageUrl || '/images/menu/coffee.webp'" :alt="item.product.name" />
              <div>
                <h3>{{ item.product.name }}</h3>
                <p v-if="item.notes">{{ item.notes }}</p>
                <strong>{{ money(Number(item.product.price) * item.quantity) }}</strong>
                <div class="stepper">
                  <button @click="cart.update(item.key, item.quantity - 1)"><Minus :size="15" /></button>
                  <span>{{ item.quantity }}</span>
                  <button @click="cart.update(item.key, item.quantity + 1)"><Plus :size="15" /></button>
                </div>
              </div>
              <button class="trash" aria-label="Xóa món" @click="cart.remove(item.key)"><Trash2 :size="18" /></button>
            </article>
          </div>
          <div class="summary">
            <p><span>Tạm tính</span><b>{{ money(cart.subtotal) }}</b></p>
            <p><span>Phí giao hàng</span><b>{{ shippingFee ? money(shippingFee) : 'Miễn phí' }}</b></p>
            <p class="total"><span>Tổng cộng</span><b>{{ money(total) }}</b></p>
            <button class="btn btn-primary" @click="goToCheckout">Tiếp tục đặt hàng</button>
          </div>
        </div>
      </template>

      <form v-else-if="step === 'checkout'" class="checkout" @submit.prevent="submit">
        <div v-if="settings?.shop_opening_hours" class="hours-banner">
          <Clock3 :size="15" />
          <span>Giờ nhận đơn: <b>{{ settings.shop_opening_hours }}</b></span>
        </div>

        <div v-if="settings?.is_accepting_orders === 'false'" class="closed-warning">
          🔴 Quán hiện đang tạm ngưng nhận đơn online. Vui lòng liên hệ hotline quán!
        </div>

        <div v-if="savedProfiles.length" class="saved-profiles-section">
          <span class="profiles-label"><MapPin :size="14" /> Địa chỉ đã dùng:</span>
          <div class="profile-chips">
            <button
              v-for="p in savedProfiles"
              :key="p.id"
              type="button"
              :class="['profile-chip', { active: selectedProfileId === p.id }]"
              @click="applyProfile(p)"
            >
              <span class="chip-title">{{ p.customerName }} ({{ p.customerPhone }})</span>
              <span class="chip-addr">{{ p.customerAddress }}</span>
            </button>
          </div>
        </div>

        <div class="form-grid">
          <label class="field-label">Họ và tên *<input v-model="form.customerName" class="field" required minlength="2" maxlength="120" autocomplete="name" /></label>
          <label class="field-label">Số điện thoại *<input v-model="form.customerPhone" class="field" required minlength="8" maxlength="20" autocomplete="tel" /></label>
        </div>
        <label class="field-label">Email (không bắt buộc)<input v-model="form.customerEmail" class="field" type="email" maxlength="254" autocomplete="email" placeholder="Chỉ dùng để gửi xác nhận đơn" /></label>
        <label class="field-label">Địa chỉ nhận hàng *<textarea v-model="form.customerAddress" class="field" required minlength="5" maxlength="500" rows="3"></textarea></label>
        <label class="field-label">Ghi chú chung (không bắt buộc)<textarea v-model="form.notes" class="field" maxlength="1000" rows="3" placeholder="Ví dụ: gọi mình khi đến nơi"></textarea></label>
        <p class="payment-note">Thanh toán khi nhận hàng (COD) · Quán sẽ liên hệ xác nhận thông tin giao hàng.</p>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="checkout-actions">
          <button type="button" class="btn btn-outline" @click="step = 'cart'">Quay lại</button>
          <button class="btn btn-primary" :disabled="loading || settings?.is_accepting_orders === 'false'">
            <span v-if="loading" class="spinner"></span>
            {{ settings?.is_accepting_orders === 'false' ? 'Tạm ngưng nhận đơn' : loading ? 'Đang gửi đơn...' : `Đặt hàng · ${money(total)}` }}
          </button>
        </div>
      </form>

      <div v-else class="success">
        <div class="success-icon"><CheckCircle2 :size="48" /></div>
        <span class="eyebrow">Đặt hàng thành công</span>
        <h3 class="serif">Cảm ơn bạn đã ghé Cái Tiệm KàFe!</h3>
        <p>Quán sẽ sớm liên hệ và giao món cho bạn. Mã đơn của bạn là <b>{{ orderCode }}</b>.</p>
        <button class="btn btn-primary" @click="navigateToMenu">Về trang chủ & Đặt thêm</button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.drawer-overlay { display: flex; justify-content: flex-end; }
.drawer { width: min(560px, 100%); height: 100%; overflow-y: auto; background: var(--paper); box-shadow: -25px 0 70px rgba(25,15,10,.25); animation: slide .3s ease both; }
@keyframes slide { from { transform: translateX(100%); } }
.drawer-head { position: sticky; top: 0; z-index: 2; display: flex; justify-content: space-between; align-items: flex-start; padding: 26px 30px 18px; background: rgba(255,250,243,.94); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(59,36,23,.08); }
.drawer-head h2 { margin: 6px 0 0; font-size: 2rem; color: var(--coffee); }.drawer-head > button { border: 0; background: transparent; color: var(--coffee); cursor: pointer; }
.empty { min-height: 70vh; padding: 48px 24px; display: grid; place-items: center; align-content: center; text-align: center; color: #74665c; }.empty h3 { margin: 18px 0 5px; color: var(--coffee); }.empty .btn { margin-top: 18px; }
.cart-content { min-height: calc(100vh - 95px); display: flex; flex-direction: column; }.cart-list { flex: 1; padding: 18px 30px; }.cart-item { display: grid; grid-template-columns: 78px 1fr 30px; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(59,36,23,.09); }.cart-item img { width: 78px; height: 88px; border-radius: 14px; object-fit: cover; }.cart-item h3 { margin: 3px 0 4px; font-size: 1rem; }.cart-item p { margin-bottom: 7px; color: #796a60; font-size: .82rem; }.cart-item strong { color: #a45f2e; }.trash { border: 0; background: transparent; color: #9d7560; cursor: pointer; }.stepper { margin-top: 12px; display: flex; align-items: center; gap: 12px; }.stepper button { width: 27px; height: 27px; display: grid; place-items: center; border: 1px solid #dac9b8; border-radius: 50%; background: white; cursor: pointer; }.summary { padding: 22px 30px 30px; background: #f2e5d5; }.summary p { display: flex; justify-content: space-between; margin-bottom: 10px; }.summary .total { padding-top: 14px; border-top: 1px solid #d7c0a8; font-size: 1.12rem; }.summary .btn { width: 100%; margin-top: 8px; }
.checkout { padding: 28px 30px 40px; display: grid; gap: 17px; }.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.hours-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(133, 75, 44, 0.07);
  color: #794426;
  font-size: 0.85rem;
}
.closed-warning {
  padding: 12px 16px;
  border-radius: 12px;
  background: #fde8e8;
  border: 1px solid #f8b4b4;
  color: #9b1c1c;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.4;
}

.saved-profiles-section {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(113, 80, 56, 0.06);
  border: 1px dashed rgba(113, 80, 56, 0.22);
}
.profiles-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #794426;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.profile-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.profile-chip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(59, 36, 23, 0.15);
  background: white;
  color: var(--coffee);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  max-width: 100%;
}
.profile-chip:hover {
  border-color: #a45f2e;
  background: #fffbf6;
}
.profile-chip.active {
  border-color: #a45f2e;
  background: #fdf5ec;
  box-shadow: 0 2px 8px rgba(164, 95, 46, 0.15);
}
.chip-title {
  font-size: 0.78rem;
  font-weight: 700;
}
.chip-addr {
  font-size: 0.73rem;
  color: #796a60;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.payment-note { padding: 13px; border-radius: 12px; background: #f1e5d5; color: #675648; font-size: .85rem; }.error { color: #9d2d26; background: #fce8e5; padding: 12px; border-radius: 12px; }.checkout-actions { display: grid; grid-template-columns: auto 1fr; gap: 10px; }
.success { min-height: 72vh; display: grid; place-items: center; align-content: center; padding: 36px; text-align: center; }.success-icon { margin-bottom: 24px; width: 88px; height: 88px; display: grid; place-items: center; border-radius: 50%; color: white; background: #718461; box-shadow: 0 14px 35px rgba(113,132,97,.3); }.success h3 { margin: 13px 0; color: var(--coffee); font-size: 2.2rem; }.success p { max-width: 400px; line-height: 1.7; color: #6f6158; }.success .btn { margin-top: 14px; }
@media (max-width: 520px) { .drawer-head,.cart-list,.summary,.checkout { padding-inline: 20px; }.form-grid { grid-template-columns: 1fr; }.checkout-actions { grid-template-columns: 1fr; } }
</style>

