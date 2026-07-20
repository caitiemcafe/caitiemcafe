<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from '@lucide/vue'
import { useCartStore } from '../stores/cart'
import { api } from '../services/api'
import type { ApiResponse, Settings } from '../types'

const props = defineProps<{ settings: Settings }>()
const cart = useCartStore(); const step = ref<'cart'|'checkout'|'success'>('cart'); const loading = ref(false); const error = ref(''); const orderCode = ref('')
const form = reactive({ customerName: '', customerPhone: '', customerEmail: '', customerAddress: '', notes: '' })
const shippingFee = computed(() => Number(props.settings.shipping_fee || 0)); const total = computed(() => cart.subtotal + shippingFee.value)
const money = (value: number | string) => new Intl.NumberFormat('vi-VN').format(Number(value)) + 'đ'
function close() { cart.isOpen = false; if (step.value === 'success') step.value = 'cart' }
async function submit() {
  loading.value = true; error.value = ''
  try {
    const idempotencyKey = crypto.randomUUID()
    const { data } = await api.post<ApiResponse<{ orderCode: string }>>('/orders', { ...form, idempotencyKey, items: cart.items.map((item) => ({ productId: item.product.id, quantity: item.quantity, notes: item.notes || null })) })
    orderCode.value = data.data.orderCode; cart.clear(); cart.isOpen = true; step.value = 'success'
  } catch (err) { error.value = err instanceof Error ? err.message : 'Không thể đặt hàng.' }
  finally { loading.value = false }
}
</script>

<template>
  <div v-if="cart.isOpen" class="overlay drawer-overlay" @click.self="close">
    <aside class="drawer" aria-label="Giỏ hàng">
      <div class="drawer-head"><div><span class="eyebrow">Đơn của bạn</span><h2 class="serif">{{ step === 'checkout' ? 'Thông tin giao hàng' : step === 'success' ? 'Quán đã nhận đơn' : 'Giỏ hàng' }}</h2></div><button aria-label="Đóng" @click="close"><X /></button></div>
      <template v-if="step === 'cart'">
        <div v-if="!cart.items.length" class="empty"><ShoppingBag :size="42" /><h3>Giỏ hàng đang trống</h3><p>Chọn một món thật vừa ý rồi quay lại đây nhé.</p><button class="btn btn-primary" @click="close">Xem menu</button></div>
        <div v-else class="cart-content">
          <div class="cart-list"><article v-for="item in cart.items" :key="item.key" class="cart-item"><img :src="item.product.imageUrl || '/images/menu/coffee.webp'" :alt="item.product.name" /><div><h3>{{ item.product.name }}</h3><p v-if="item.notes">{{ item.notes }}</p><strong>{{ money(Number(item.product.price) * item.quantity) }}</strong><div class="stepper"><button @click="cart.update(item.key, item.quantity - 1)"><Minus :size="15" /></button><span>{{ item.quantity }}</span><button @click="cart.update(item.key, item.quantity + 1)"><Plus :size="15" /></button></div></div><button class="trash" aria-label="Xóa món" @click="cart.remove(item.key)"><Trash2 :size="18" /></button></article></div>
          <div class="summary"><p><span>Tạm tính</span><b>{{ money(cart.subtotal) }}</b></p><p><span>Phí giao hàng</span><b>{{ shippingFee ? money(shippingFee) : 'Miễn phí' }}</b></p><p class="total"><span>Tổng cộng</span><b>{{ money(total) }}</b></p><button class="btn btn-primary" @click="step = 'checkout'">Tiếp tục đặt hàng</button></div>
        </div>
      </template>
      <form v-else-if="step === 'checkout'" class="checkout" @submit.prevent="submit">
        <div class="form-grid"><label class="field-label">Họ và tên *<input v-model="form.customerName" class="field" required minlength="2" maxlength="120" autocomplete="name" /></label><label class="field-label">Số điện thoại *<input v-model="form.customerPhone" class="field" required minlength="8" maxlength="20" autocomplete="tel" /></label></div>
        <label class="field-label">Email (không bắt buộc)<input v-model="form.customerEmail" class="field" type="email" maxlength="254" autocomplete="email" placeholder="Chỉ dùng để gửi xác nhận đơn" /></label>
        <label class="field-label">Địa chỉ nhận hàng *<textarea v-model="form.customerAddress" class="field" required minlength="5" maxlength="500" rows="3"></textarea></label>
        <label class="field-label">Ghi chú chung (không bắt buộc)<textarea v-model="form.notes" class="field" maxlength="1000" rows="3" placeholder="Ví dụ: gọi mình khi đến nơi"></textarea></label>
        <p class="payment-note">Thanh toán khi nhận hàng (COD) · Quán sẽ liên hệ xác nhận thông tin giao hàng.</p><p v-if="error" class="error">{{ error }}</p>
        <div class="checkout-actions"><button type="button" class="btn btn-outline" @click="step = 'cart'">Quay lại</button><button class="btn btn-primary" :disabled="loading"><span v-if="loading" class="spinner"></span>{{ loading ? 'Đang gửi đơn...' : `Đặt hàng · ${money(total)}` }}</button></div>
      </form>
      <div v-else class="success"><div class="success-icon"><CheckCircle2 :size="48" /></div><span class="eyebrow">Đặt hàng thành công</span><h3 class="serif">Cảm ơn bạn đã ghé Cái Tiệm!</h3><p>Quán sẽ sớm liên hệ và giao món cho bạn. Mã đơn của bạn là <b>{{ orderCode }}</b>.</p><button class="btn btn-primary" @click="close">Về trang chủ</button></div>
    </aside>
  </div>
</template>

<style scoped>
.drawer-overlay { display: flex; justify-content: flex-end; }
.drawer { width: min(560px, 100%); height: 100%; overflow-y: auto; background: var(--paper); box-shadow: -25px 0 70px rgba(25,15,10,.25); animation: slide .3s ease both; }
@keyframes slide { from { transform: translateX(100%); } }
.drawer-head { position: sticky; top: 0; z-index: 2; display: flex; justify-content: space-between; align-items: flex-start; padding: 26px 30px 18px; background: rgba(255,250,243,.94); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(59,36,23,.08); }
.drawer-head h2 { margin: 6px 0 0; font-size: 2rem; color: var(--coffee); }.drawer-head > button { border: 0; background: transparent; color: var(--coffee); }
.empty { min-height: 70vh; padding: 48px 24px; display: grid; place-items: center; align-content: center; text-align: center; color: #74665c; }.empty h3 { margin: 18px 0 5px; color: var(--coffee); }.empty .btn { margin-top: 18px; }
.cart-content { min-height: calc(100vh - 95px); display: flex; flex-direction: column; }.cart-list { flex: 1; padding: 18px 30px; }.cart-item { display: grid; grid-template-columns: 78px 1fr 30px; gap: 14px; padding: 14px 0; border-bottom: 1px solid rgba(59,36,23,.09); }.cart-item img { width: 78px; height: 88px; border-radius: 14px; object-fit: cover; }.cart-item h3 { margin: 3px 0 4px; font-size: 1rem; }.cart-item p { margin-bottom: 7px; color: #796a60; font-size: .82rem; }.cart-item strong { color: #a45f2e; }.trash { border: 0; background: transparent; color: #9d7560; }.stepper { margin-top: 12px; display: flex; align-items: center; gap: 12px; }.stepper button { width: 27px; height: 27px; display: grid; place-items: center; border: 1px solid #dac9b8; border-radius: 50%; background: white; }.summary { padding: 22px 30px 30px; background: #f2e5d5; }.summary p { display: flex; justify-content: space-between; margin-bottom: 10px; }.summary .total { padding-top: 14px; border-top: 1px solid #d7c0a8; font-size: 1.12rem; }.summary .btn { width: 100%; margin-top: 8px; }
.checkout { padding: 28px 30px 40px; display: grid; gap: 17px; }.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }.payment-note { padding: 13px; border-radius: 12px; background: #f1e5d5; color: #675648; font-size: .85rem; }.error { color: #9d2d26; background: #fce8e5; padding: 12px; border-radius: 12px; }.checkout-actions { display: grid; grid-template-columns: auto 1fr; gap: 10px; }
.success { min-height: 72vh; display: grid; place-items: center; align-content: center; padding: 36px; text-align: center; }.success-icon { margin-bottom: 24px; width: 88px; height: 88px; display: grid; place-items: center; border-radius: 50%; color: white; background: #718461; box-shadow: 0 14px 35px rgba(113,132,97,.3); }.success h3 { margin: 13px 0; color: var(--coffee); font-size: 2.2rem; }.success p { max-width: 400px; line-height: 1.7; color: #6f6158; }.success .btn { margin-top: 14px; }
@media (max-width: 520px) { .drawer-head,.cart-list,.summary,.checkout { padding-inline: 20px; }.form-grid { grid-template-columns: 1fr; }.checkout-actions { grid-template-columns: 1fr; } }
</style>
