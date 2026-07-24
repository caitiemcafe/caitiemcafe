<script setup lang="ts">
import { ref } from 'vue'
import { BarChart3, Coffee, FileText, LogOut, Menu, MessageCircleHeart, Settings, X } from '@lucide/vue'
import { useAuthStore } from '~/src/stores/auth'

const open = ref(false)
const auth = useAuthStore()

const links = [
  { to: '/admin', label: 'Tổng quan', icon: BarChart3 },
  { to: '/admin/products', label: 'Menu', icon: Coffee },
  { to: '/admin/orders', label: 'Đơn đã đặt', icon: FileText },
  { to: '/admin/quotes', label: 'Thông điệp', icon: MessageCircleHeart },
  { to: '/admin/settings', label: 'Cài đặt', icon: Settings }
]

function handleLogout() {
  auth.logout()
  navigateTo('/admin/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside :class="['sidebar', { open }]">
      <div class="side-head">
        <img src="/images/brand/cafe-name.png" alt="Cái Tiệm" />
        <button @click="open = false"><X /></button>
      </div>
      <nav>
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :exact-active-class="link.to === '/admin' ? 'router-link-exact-active' : ''"
          @click="open = false"
        >
          <component :is="link.icon" :size="19" />
          {{ link.label }}
        </NuxtLink>
      </nav>
      <button class="logout" @click="handleLogout">
        <LogOut :size="18" />Đăng xuất
      </button>
    </aside>

    <div v-if="open" class="side-overlay" @click="open = false"></div>

    <main class="admin-main">
      <header>
        <button class="mobile-menu" @click="open = true"><Menu /></button>
        <div>
          <span>Quản trị Cái Tiệm</span>
          <small>Menu · Đơn hàng · Vibe</small>
        </div>
        <NuxtLink to="/" target="_blank">Xem website</NuxtLink>
      </header>
      <div class="admin-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-shell { min-height: 100vh; display: grid; grid-template-columns: 245px 1fr; background: #f5efe7; }.sidebar { position: sticky; top: 0; height: 100vh; padding: 25px 18px; display: flex; flex-direction: column; color: #e8dcd2; background: #24150f; }.side-head { display: flex; align-items: center; justify-content: space-between; padding: 0 8px 25px; }.side-head img { height: 80px; width: auto; max-width: 160px; padding: 5px; border-radius: 10px; background: #fffaf3; object-fit: contain; }.side-head button { display: none; color: white; border: 0; background: transparent; }.sidebar nav { display: grid; gap: 7px; }.sidebar nav a { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; color: #bbaa9d; font-weight: 600; font-size: .9rem; }.sidebar nav a:hover,.sidebar nav a.router-link-active { color: white; background: rgba(255,255,255,.09); }.logout { margin-top: auto; display: flex; gap: 10px; align-items: center; padding: 12px 14px; color: #bd9f8b; border: 0; background: transparent; cursor: pointer; }.admin-main { min-width: 0; }.admin-main > header { height: 78px; padding: 0 32px; display: flex; align-items: center; gap: 14px; border-bottom: 1px solid rgba(59,36,23,.08); background: rgba(255,250,243,.84); backdrop-filter: blur(12px); }.admin-main header div { display: grid; }.admin-main header span { font-weight: 700; color: var(--coffee); }.admin-main header small { color: #94857b; }.admin-main header > a { margin-left: auto; color: #9a5c35; font-weight: 700; font-size: .84rem; }.mobile-menu { display: none; border: 0; background: transparent; color: var(--coffee); }.admin-content { padding: 32px; }.side-overlay { display: none; }
@media (max-width: 820px) { .admin-shell { grid-template-columns: 1fr; }.sidebar { position: fixed; z-index: 60; width: 260px; transform: translateX(-100%); transition: .25s; }.sidebar.open { transform: translateX(0); }.side-head button,.mobile-menu { display: block; }.side-overlay { position: fixed; z-index: 55; inset: 0; display: block; background: rgba(20,12,8,.5); }.admin-main > header { padding: 0 18px; }.admin-content { padding: 22px 14px; } }
.admin-main header small { color: #6d5f56; }.admin-main header > a { color: #874a27; }
</style>
