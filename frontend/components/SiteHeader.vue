<script setup lang="ts">
import { ref } from 'vue'
import { Download, Menu, ShoppingBag, Sparkles, X } from '@lucide/vue'
import { useCartStore } from '~/src/stores/cart'
import { usePWA } from '~/src/composables/usePWA'

const open = ref(false)
const cart = useCartStore()
const close = () => { open.value = false }

const { isInstallable, install } = usePWA()
const handleHeaderInstall = async () => {
  await install()
  close()
}
</script>

<template>
  <header class="site-header">
    <div class="container nav-wrap">
      <NuxtLink to="/" class="brand" aria-label="Cái Tiệm - Trang chủ"><img src="/images/brand/cafe-name.png" alt="Cái Tiệm" /></NuxtLink>
      <nav :class="['nav-links', { open }]" aria-label="Điều hướng chính">
        <a href="#menu" @click="close">Menu</a><a href="#story" @click="close">Về quán</a><a href="#contact" @click="close">Liên hệ</a>
        <NuxtLink to="/vibe" class="vibe-link" @click="close"><Sparkles :size="16" /> Vibe</NuxtLink>
        <button v-if="isInstallable" class="pwa-header-btn" @click="handleHeaderInstall"><Download :size="16" /> Tải App</button>
      </nav>
      <div class="nav-actions">
        <button class="cart-button" aria-label="Mở giỏ hàng" @click="cart.isOpen = true"><ShoppingBag :size="20" /><span v-if="cart.count">{{ cart.count }}</span></button>
        <button class="menu-button" :aria-label="open ? 'Đóng menu' : 'Mở menu'" @click="open = !open"><X v-if="open" /><Menu v-else /></button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header { position: absolute; z-index: 20; width: 100%; padding: 18px 0; color: white; }
.nav-wrap { display: flex; align-items: center; justify-content: space-between; }
.brand { display: flex; align-items: center; justify-content: center; height: 72px; overflow: hidden; border-radius: 12px; background: rgba(255,250,243,.96); padding: 4px 8px; box-shadow: 0 4px 12px rgba(0,0,0,.15); }
.brand img { height: 100%; width: auto; object-fit: contain; }
.nav-links { display: flex; gap: 34px; align-items: center; font-size: .9rem; font-weight: 600; }
.nav-links a { opacity: .88; transition: .2s; }
.nav-links a:hover { opacity: 1; color: #f3c18e; }
.vibe-link { display: inline-flex; align-items: center; gap: 6px; }
.nav-actions { display: flex; gap: 10px; }
.cart-button,.menu-button { position: relative; width: 44px; height: 44px; display: grid; place-items: center; color: white; border: 1px solid rgba(255,255,255,.22); border-radius: 50%; background: rgba(25,15,10,.25); backdrop-filter: blur(12px); cursor: pointer; }
.cart-button span { position: absolute; right: -3px; top: -4px; min-width: 19px; height: 19px; padding: 0 4px; display: grid; place-items: center; border-radius: 99px; background: #d99353; font-size: 10px; font-weight: 800; }
.menu-button { display: none; }
@media (max-width: 740px) {
  .menu-button { display: grid; }
  .nav-links { position: absolute; left: 14px; right: 14px; top: 78px; padding: 24px; display: none; flex-direction: column; gap: 22px; color: var(--coffee); background: rgba(255,250,243,.98); border-radius: 20px; box-shadow: var(--shadow); }
  .nav-links.open { display: flex; }
  .brand { height: 58px; padding: 3px 6px; }
}
.pwa-header-btn { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 0; color: inherit; opacity: .88; transition: .2s; font-size: inherit; font-weight: inherit; padding: 0; cursor: pointer; }
.pwa-header-btn:hover { opacity: 1; color: #f3c18e; }
@media (max-width: 740px) {
  .pwa-header-btn { width: 100%; justify-content: center; padding: 10px 0; border: 1px dashed rgba(59, 36, 23, 0.15); border-radius: 12px; background: rgba(59, 36, 23, 0.03); }
}
</style>
