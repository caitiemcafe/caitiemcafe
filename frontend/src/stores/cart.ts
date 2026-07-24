import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { CartItem, Product } from '../types'

const storageKey = 'cai-tiem-cart'

export const useCartStore = defineStore('cart', () => {
  const initial = (() => {
    if (import.meta.client) {
      try {
        return JSON.parse(localStorage.getItem(storageKey) || '[]') as CartItem[]
      } catch {
        return []
      }
    }
    return []
  })()

  const items = ref<CartItem[]>(initial)
  const isOpen = ref(false)

  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const subtotal = computed(() => items.value.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0))

  function add(product: Product, quantity: number, notes: string) {
    const normalized = notes.trim()
    const existing = items.value.find((item) => item.product.id === product.id && item.notes === normalized)
    if (existing) existing.quantity += quantity
    else items.value.push({ key: `${product.id}-${Date.now()}`, product, quantity, notes: normalized })
    isOpen.value = true
  }

  function update(key: string, quantity: number) {
    const item = items.value.find((row) => row.key === key)
    if (item) item.quantity = Math.max(1, Math.min(30, quantity))
  }

  function remove(key: string) {
    items.value = items.value.filter((item) => item.key !== key)
  }

  function clear() {
    items.value = []
    isOpen.value = false
  }

  watch(
    items,
    (value) => {
      if (import.meta.client) {
        localStorage.setItem(storageKey, JSON.stringify(value))
      }
    },
    { deep: true }
  )

  return { items, isOpen, count, subtotal, add, update, remove, clear }
})
