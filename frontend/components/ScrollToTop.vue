<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { ArrowUp } from '@lucide/vue'

const showBtn = ref(false)

function checkScroll() {
  if (typeof window !== 'undefined') {
    showBtn.value = window.scrollY > 300
  }
}

function scrollToTop() {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
    document.body.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<template>
  <Transition name="fade">
    <button
      v-if="showBtn"
      class="scroll-to-top"
      aria-label="Cuộn lên đầu trang"
      title="Cuộn lên đầu trang"
      @click="scrollToTop"
    >
      <ArrowUp :size="20" />
    </button>
  </Transition>
</template>

<style scoped>
.scroll-to-top {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 99;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  background: var(--coffee, #3b2417);
  color: #efbd84;
  box-shadow: 0 10px 25px rgba(35, 23, 16, 0.35);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.scroll-to-top:hover {
  transform: translateY(-4px) scale(1.06);
  background: #523321;
  color: #ffffff;
  box-shadow: 0 14px 30px rgba(35, 23, 16, 0.45);
}

.scroll-to-top:active {
  transform: translateY(-1px) scale(0.98);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.9);
}

@media (max-width: 680px) {
  .scroll-to-top {
    bottom: 22px;
    right: 20px;
    width: 44px;
    height: 44px;
  }
}
</style>
