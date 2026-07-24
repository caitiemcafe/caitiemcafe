import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, setAdminToken } from '../services/api'

const key = 'cai-tiem-admin-token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)

  if (import.meta.client) {
    token.value = sessionStorage.getItem(key)
    setAdminToken(token.value)
  }

  const isAuthenticated = computed(() => Boolean(token.value))

  async function login(username: string, password: string) {
    const { data } = await api.post('/admin/login', { username, password })
    token.value = data.data.token
    if (import.meta.client) {
      sessionStorage.setItem(key, token.value!)
    }
    setAdminToken(token.value)
  }

  function logout() {
    token.value = null
    if (import.meta.client) {
      sessionStorage.removeItem(key)
    }
    setAdminToken(null)
  }

  function init() {
    if (import.meta.client) {
      token.value = sessionStorage.getItem(key)
      setAdminToken(token.value)
    }
  }

  return { token, isAuthenticated, login, logout, init }
})
