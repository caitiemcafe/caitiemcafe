<script setup lang="ts">
import { ref, watch } from 'vue'
import { Minus, Plus, ShoppingBag, X } from '@lucide/vue'
import type { Product } from '../types'
import { useCartStore } from '../stores/cart'

const props = defineProps<{ product: Product | null }>()
const emit = defineEmits<{ close: [] }>()
const cart = useCartStore(); const quantity = ref(1); const notes = ref('')
watch(() => props.product, () => { quantity.value = 1; notes.value = '' })
const money = (value: string | number) => new Intl.NumberFormat('vi-VN').format(Number(value)) + 'đ'
function add() { if (!props.product) return; cart.add(props.product, quantity.value, notes.value); emit('close') }
</script>

<template>
  <div v-if="product" class="overlay modal-overlay" role="presentation" @click.self="emit('close')">
    <section class="product-modal card" role="dialog" aria-modal="true" aria-labelledby="product-title">
      <button class="close" aria-label="Đóng" @click="emit('close')"><X /></button>
      <img :src="product.imageUrl || '/images/menu/coffee.webp'" :alt="product.name" />
      <div class="modal-body">
        <span class="eyebrow">Món bạn chọn</span>
        <h2 id="product-title" class="serif">{{ product.name }}</h2>
        <p v-if="product.description" class="description">{{ product.description }}</p>
        <strong class="price">{{ money(product.price) }}</strong>
        <div class="quantity-row"><span>Số lượng</span><div class="stepper"><button aria-label="Giảm" @click="quantity = Math.max(1, quantity - 1)"><Minus :size="17" /></button><b>{{ quantity }}</b><button aria-label="Tăng" @click="quantity = Math.min(30, quantity + 1)"><Plus :size="17" /></button></div></div>
        <label class="field-label">Ghi chú cho món (không bắt buộc)<textarea v-model="notes" class="field" maxlength="300" rows="3" placeholder="Ví dụ: làm ít ngọt giúp mình"></textarea></label>
        <button class="btn btn-primary add-button" @click="add"><ShoppingBag :size="18" /> Thêm vào giỏ · {{ money(Number(product.price) * quantity) }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.modal-overlay { display: grid; place-items: center; padding: 20px; }
.product-modal { position: relative; overflow: hidden; width: min(820px, 100%); display: grid; grid-template-columns: .92fr 1.08fr; animation: rise .3s both; }
.product-modal > img { width: 100%; height: 100%; min-height: 540px; object-fit: cover; }
.modal-body { padding: 52px 42px 38px; }
.close { position: absolute; right: 16px; top: 16px; z-index: 1; width: 40px; height: 40px; display: grid; place-items: center; border: 0; border-radius: 50%; color: var(--coffee); background: rgba(255,250,243,.9); }
h2 { margin: 13px 0 6px; font-size: clamp(2rem, 5vw, 3rem); color: var(--coffee); }
.description { color: #75675e; }
.price { display: block; margin: 14px 0 26px; font-size: 1.35rem; color: #a45f2e; }
.quantity-row { display: flex; align-items: center; justify-content: space-between; padding: 18px 0; margin-bottom: 18px; border-block: 1px solid rgba(59,36,23,.1); font-weight: 600; }
.stepper { display: flex; align-items: center; gap: 16px; }
.stepper button { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid rgba(59,36,23,.16); border-radius: 50%; background: white; color: var(--coffee); }
.add-button { width: 100%; margin-top: 22px; }
@media (max-width: 680px) { .product-modal { max-height: calc(100vh - 24px); overflow-y: auto; grid-template-columns: 1fr; } .product-modal > img { min-height: 0; height: 230px; } .modal-body { padding: 30px 22px 24px; } }
</style>
