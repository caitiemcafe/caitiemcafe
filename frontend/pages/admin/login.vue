<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ArrowLeft, Coffee, LockKeyhole } from '@lucide/vue'
import { useAuthStore } from '~/src/stores/auth'

definePageMeta({
  layout: false
})

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')
const auth = useAuthStore()
const route = useRoute()

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(form.username, form.password)
    const redirectUrl = String(route.query.redirect || '/admin')
    await navigateTo(redirectUrl)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Không thể đăng nhập.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <NuxtLink to="/" class="back"><ArrowLeft :size="18" /> Về trang khách</NuxtLink>
    <section class="login-card card">
      <div class="login-brand">
        <img src="/images/brand/cafe-name.png" alt="Cái Tiệm" />
        <span>Không gian quản trị</span>
      </div>
      <div class="lock"><LockKeyhole /></div>
      <h1 class="serif">Chào bạn quay lại</h1>
      <p>Đăng nhập để xem đơn và cập nhật menu.</p>
      <form @submit.prevent="submit">
        <label class="field-label">Tên đăng nhập<input v-model="form.username" class="field" required autocomplete="username" /></label>
        <label class="field-label">Mật khẩu<input v-model="form.password" class="field" type="password" required minlength="8" autocomplete="current-password" /></label>
        <p v-if="error" class="error">{{ error }}</p>
        <button class="btn btn-primary" :disabled="loading">
          <span v-if="loading" class="spinner"></span>{{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>
      </form>
      <small><Coffee :size="14" /> Chỉ dành cho quản trị viên của quán</small>
    </section>
  </main>
</template>

<style scoped>
.login-page { position: relative; min-height: 100vh; display: grid; place-items: center; padding: 70px 20px; background: linear-gradient(rgba(25,14,9,.7),rgba(25,14,9,.78)), url('/images/brand/hero-cafe.png') center/cover; }.back { position: absolute; top: 28px; left: 30px; display: flex; gap: 8px; align-items: center; color: white; font-weight: 600; }.login-card { width: min(450px,100%); padding: 36px; text-align: center; }.login-brand { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }.login-brand img { height: 85px; width: auto; object-fit: contain; }.login-brand span { color: #99877b; font-size: .76rem; }.lock { width: 55px; height: 55px; margin: auto; display: grid; place-items: center; border-radius: 50%; color: #9d6039; background: #f0dfca; }.login-card h1 { margin: 14px 0 6px; font-size: 2.2rem; color: var(--coffee); }.login-card > p { color: #806f64; }.login-card form { display: grid; gap: 16px; margin-top: 26px; text-align: left; }.login-card form .btn { width: 100%; margin-top: 5px; }.error { margin: 0; padding: 11px; border-radius: 10px; color: #982f28; background: #fce8e5; }.login-card small { margin-top: 25px; display: flex; gap: 6px; justify-content: center; color: #9c8e85; }
</style>
