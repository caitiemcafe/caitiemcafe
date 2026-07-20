import axios from 'axios'

export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api', timeout: 15_000 })

api.interceptors.response.use((response) => response, (error) => {
  const message = error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'Yêu cầu mất quá nhiều thời gian.' : 'Không thể kết nối tới hệ thống.')
  return Promise.reject(new Error(message))
})

export function setAdminToken(token: string | null) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete api.defaults.headers.common.Authorization
}
