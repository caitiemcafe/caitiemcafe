// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from './cart'
import type { Product } from '../types'

const product: Product = { id: 1, categoryId: 1, name: 'Cà phê sữa đá', slug: 'ca-phe-sua-da', description: null, price: '15000', imageUrl: null, isOutOfStock: false, isActive: true }

describe('cart store', () => {
  beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })
  it('gộp cùng món và cùng ghi chú', () => {
    const cart = useCartStore(); cart.add(product, 1, 'Ít ngọt'); cart.add(product, 2, 'Ít ngọt')
    expect(cart.items).toHaveLength(1); expect(cart.count).toBe(3); expect(cart.subtotal).toBe(45000)
  })
  it('giữ hai dòng khi ghi chú khác nhau', () => {
    const cart = useCartStore(); cart.add(product, 1, 'Ít ngọt'); cart.add(product, 1, '')
    expect(cart.items).toHaveLength(2)
  })
})
