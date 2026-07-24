<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Eye, Mail, MapPin, Phone, X } from '@lucide/vue'
import { api } from '~/src/services/api'
import type { ApiResponse, Order } from '~/src/types'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const orders = ref<Order[]>([])
const selected = ref<Order | null>(null)
const loading = ref(true)
const error = ref('')
const page = ref(1)
const pages = ref(1)

async function load(target = 1) {
  loading.value = true
  try {
    const { data } = await api.get<ApiResponse<Order[]>>('/admin/orders', { params: { page: target, limit: 20 } })
    orders.value = data.data
    page.value = data.meta?.page || 1
    pages.value = data.meta?.pages || 1
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không tải được đơn.'
  } finally {
    loading.value = false
  }
}

async function detail(order: Order) {
  try {
    const { data } = await api.get<ApiResponse<Order>>(`/admin/orders/${order.id}`)
    selected.value = data.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Không tải được chi tiết.'
  }
}

const money = (v: string | number) => new Intl.NumberFormat('vi-VN').format(Number(v)) + 'đ'
const date = (v: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(v))

onMounted(() => load())
</script>

<template>
  <section>
    <div class="admin-page-head">
      <div>
        <span class="eyebrow">Đơn hàng</span>
        <h1>Đơn khách đã đặt</h1>
        <p>Quán chủ động gọi khách và giao món; không cần cập nhật trạng thái.</p>
      </div>
    </div>
    <p v-if="error" class="admin-error">{{ error }}</p>

    <div class="admin-card admin-table-wrap">
      <div v-if="loading" class="admin-empty">Đang tải đơn...</div>
      <div v-else-if="!orders.length" class="admin-empty">Chưa có đơn nào.</div>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Thời gian</th>
            <th>Số món</th>
            <th>Tổng tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td><b>{{ order.orderCode }}</b></td>
            <td><b>{{ order.customerName }}</b><small class="block">{{ order.customerPhone }}</small></td>
            <td>{{ date(order.createdAt) }}</td>
            <td>{{ order.items?.reduce((s, i) => s + i.quantity, 0) || 0 }}</td>
            <td><b>{{ money(order.totalAmount) }}</b></td>
            <td><button class="view" @click="detail(order)"><Eye :size="16" />Xem</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="pages > 1" class="pagination">
      <button :disabled="page <= 1" @click="load(page - 1)">Trang trước</button>
      <span>{{ page }} / {{ pages }}</span>
      <button :disabled="page >= pages" @click="load(page + 1)">Trang sau</button>
    </div>

    <div v-if="selected" class="admin-modal" @click.self="selected = null">
      <section class="admin-modal-box">
        <button class="admin-modal-close" @click="selected = null"><X /></button>
        <span class="eyebrow">{{ selected.orderCode }}</span>
        <h2>Chi tiết đơn</h2>
        <div class="customer">
          <b>{{ selected.customerName }}</b>
          <a :href="`tel:${selected.customerPhone}`"><Phone :size="16" />{{ selected.customerPhone }}</a>
          <a v-if="selected.customerEmail" :href="`mailto:${selected.customerEmail}`"><Mail :size="16" />{{ selected.customerEmail }}</a>
          <span><MapPin :size="16" />{{ selected.customerAddress }}</span>
          <p v-if="selected.notes"><b>Ghi chú:</b> {{ selected.notes }}</p>
        </div>
        <div class="items">
          <article v-for="item in selected.items" :key="item.id">
            <div><b>{{ item.productName }} × {{ item.quantity }}</b><small v-if="item.notes">{{ item.notes }}</small></div>
            <strong>{{ money(item.subtotal) }}</strong>
          </article>
        </div>
        <div class="totals">
          <p><span>Phí giao hàng</span><b>{{ Number(selected.shippingFee) ? money(selected.shippingFee) : 'Miễn phí' }}</b></p>
          <p><span>Tổng cộng</span><b>{{ money(selected.totalAmount) }}</b></p>
        </div>
        <a class="btn btn-primary call" :href="`tel:${selected.customerPhone}`"><Phone :size="17" />Gọi khách hàng</a>
      </section>
    </div>
  </section>
</template>

<style scoped>
.block{display:block;margin-top:3px;color:#96877d}.view{display:flex;gap:5px;align-items:center;cursor:pointer}.pagination{display:flex;justify-content:flex-end;align-items:center;gap:13px;margin-top:18px}.pagination button{padding:8px 12px;border:1px solid #dacbbb;border-radius:99px;background:#fffaf3;cursor:pointer}.customer{display:grid;gap:10px;padding:18px;border-radius:14px;background:#f2e5d6}.customer a,.customer span{display:flex;gap:8px;align-items:flex-start;color:#716157}.customer p{margin:4px 0 0}.items{margin:20px 0}.items article{display:flex;justify-content:space-between;gap:15px;padding:13px 0;border-bottom:1px solid #eaded1}.items small,.items b{display:block}.items small{margin-top:4px;color:#8c7d73}.totals p{display:flex;justify-content:space-between}.totals p:last-child{padding-top:12px;border-top:1px solid #d9c9ba;font-size:1.15rem}.call{width:100%;margin-top:12px}
</style>
