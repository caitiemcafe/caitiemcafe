import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, setAdminToken } from '../services/api'

const key = 'cai-tiem-admin-token'
export const useAuthStore = defineStore('auth', () => {
  const token = ref(sessionStorage.getItem(key))
  setAdminToken(token.value)
  const isAuthenticated = computed(() => Boolean(token.value))
  async function login(username: string, password: string) {
    const { data } = await api.post('/admin/login', { username, password }); token.value = data.data.token; sessionStorage.setItem(key, token.value!); setAdminToken(token.value)
  }
  function logout() { token.value = null; sessionStorage.removeItem(key); setAdminToken(null) }
  return { token, isAuthenticated, login, logout }
})
