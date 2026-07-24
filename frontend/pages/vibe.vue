<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, Coffee, Copy, RefreshCw, Share2, Sparkles } from '@lucide/vue'
import type { ApiResponse, Quote } from '~/src/types'

useSeoMeta({
  title: 'Vibe QR — Một lời nhắn từ Cái Tiệm KÀFE',
  description: 'Chậm một chút. Thở sâu một chút. Rút một câu nhắn đầy năng lượng cho ngày của bạn.',
  ogTitle: 'Một lời nhắn từ Cái Tiệm KÀFE',
  ogDescription: 'Rút một thông điệp nhỏ để ngày của bạn dịu hơn một chút.'
})

const { data: initialQuote, pending: loading, error: fetchErr, refresh } = await useFetch<ApiResponse<Quote>>('/api/vibe/random')

const quote = computed(() => initialQuote.value?.data || null)
const copied = ref(false)

async function draw() {
  await refresh()
}

async function share() {
  if (!import.meta.client) return
  const data = {
    title: 'Một lời nhắn từ Cái Tiệm',
    text: quote.value?.content || '',
    url: window.location.href
  }
  if (navigator.share) {
    await navigator.share(data)
  } else {
    await navigator.clipboard.writeText(`${data.text}\n${data.url}`)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  }
}
</script>

<template>
  <main class="vibe-page">
    <div class="grain"></div>
    <NuxtLink to="/" class="back"><ArrowLeft :size="18" /> Về Cái Tiệm</NuxtLink>
    <div class="orb one"></div>
    <div class="orb two"></div>

    <section class="vibe-shell">
      <div class="cup"><Coffee :size="30" /></div>
      <span class="overline"><Sparkles :size="14" /> Một lời nhắn dành cho bạn</span>

      <div class="quote-card" :key="quote?.id || 0">
        <span class="quote-mark">“</span>
        <div v-if="loading" class="loading">
          <span class="spinner"></span>
          <p>Đang tìm một câu thật hợp...</p>
        </div>
        <div v-else-if="fetchErr" class="loading">
          <p>Chưa lấy được thông điệp.</p>
          <button class="btn btn-outline" @click="draw">Thử lại</button>
        </div>
        <template v-else-if="quote">
          <blockquote class="serif">{{ quote.content }}</blockquote>
          <span class="topic">{{ quote.topic || 'Từ Cái Tiệm' }}</span>
        </template>
      </div>

      <div class="actions">
        <button class="btn btn-primary" :disabled="loading" @click="draw">
          <RefreshCw :size="17" :class="{ rotating: loading }" /> Rút câu khác
        </button>
        <button class="btn btn-outline" :disabled="!quote" @click="share">
          <Copy v-if="copied" :size="17" />
          <Share2 v-else :size="17" />
          {{ copied ? 'Đã sao chép' : 'Chia sẻ' }}
        </button>
      </div>
      <p class="footnote">Chậm một chút. Thở sâu một chút. Mọi thứ rồi sẽ ổn theo cách riêng của nó.</p>
    </section>
  </main>
</template>

<style scoped>
.vibe-page { position: relative; isolation: isolate; min-height: 100vh; overflow: hidden; display: grid; place-items: center; padding: 90px 20px 45px; color: var(--coffee); background: radial-gradient(circle at 50% 15%, #fff8e9, #f0dfc8 58%, #d7b898); }.grain { position: absolute; inset: 0; z-index: -1; opacity: .16; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.95' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.28'/%3E%3C/svg%3E"); }.back { position: absolute; top: 26px; left: 28px; display: flex; align-items: center; gap: 8px; font-size: .86rem; font-weight: 700; }.orb { position: absolute; z-index: -1; border-radius: 50%; filter: blur(3px); opacity: .45; }.orb.one { width: 380px; height: 380px; left: -180px; bottom: -90px; background: #9f6945; }.orb.two { width: 280px; height: 280px; right: -110px; top: -70px; background: #e2ad6e; }.vibe-shell { width: min(680px, 100%); min-width: 0; max-width: 100%; display: grid; justify-items: center; text-align: center; }.cup { width: 66px; height: 66px; margin-bottom: 20px; display: grid; place-items: center; border: 1px solid rgba(59,36,23,.15); border-radius: 50%; background: rgba(255,250,243,.6); }.overline { display: flex; gap: 7px; align-items: center; color: #854b2c; text-transform: uppercase; letter-spacing: .17em; font-size: .68rem; font-weight: 800; }.quote-card { position: relative; width: 100%; min-width: 0; max-width: 100%; min-height: 360px; margin: 25px 0; padding: 65px clamp(28px,7vw,78px) 42px; display: grid; place-items: center; align-content: center; border: 1px solid rgba(59,36,23,.1); border-radius: 35px; background: rgba(255,250,243,.76); backdrop-filter: blur(18px); box-shadow: 0 35px 100px rgba(73,44,26,.15); animation: rise .55s both; }.quote-mark { position: absolute; left: 35px; top: 20px; color: rgba(197,139,85,.36); font: 700 6rem 'Playfair Display'; }.quote-card blockquote { max-width: 100%; overflow-wrap: anywhere; margin: 0 0 25px; font-size: clamp(1.75rem,4.6vw,3rem); line-height: 1.35; letter-spacing: -.025em; }.topic { padding: 7px 13px; border-radius: 99px; color: #794426; background: #f1dfc9; font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .12em; }.loading { min-height: 160px; display: grid; place-items: center; align-content: center; gap: 12px; color: #75665c; }.actions { display: flex; gap: 10px; }.footnote { max-width: 470px; margin: 28px 0 0; color: rgba(59,36,23,.65); font-size: .78rem; line-height: 1.6; }.rotating { animation: spin .7s linear infinite; }
@media (max-width: 520px) { .vibe-page { padding-inline: 14px; }.back { left: 18px; }.quote-card { min-height: 350px; }.actions { width: 100%; flex-direction: column; }.actions .btn { width: 100%; } }
</style>
