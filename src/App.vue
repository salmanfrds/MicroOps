<script setup>
import { ref, computed } from 'vue';
import Sidebar from './shared/components/Sidebar.vue';
import Header from './shared/components/Header.vue';
import ToastContainer from './shared/components/ToastContainer.vue';
import { useRoute } from 'vue-router';
import { useCurrencyStore, CURRENCY_CONFIG } from './shared/stores/currency';

const isSidebarExpanded = ref(true)

const toggleSidebar = () => {
  isSidebarExpanded.value = !isSidebarExpanded.value
}

const route = useRoute()
const requireAuth = computed(() => route.meta.requireAuth === true)
const hideNavigation = computed(() => route.meta.hideNavigation === true)

const currencyStore = useCurrencyStore()
</script>

<template>
  <div v-if="requireAuth && !hideNavigation" class="flex h-screen bg-[#F8F7F4] dark:bg-gray-900 text-[#5A5A5A] dark:text-gray-100 transition-colors duration-300">
    <Header />
    <Sidebar :isExpanded="isSidebarExpanded" @toggle="toggleSidebar" />

    <main class="flex-1 overflow-y-auto transition-all duration-300">
      <div class="p-6 md:p-10 dark:text-gray-100">
        <router-view />
      </div>
    </main>
  </div>

  <div v-else class="h-screen w-full bg-[#F8F7F4] dark:bg-gray-900 transition-colors duration-300">
      <router-view />
  </div>

  <ToastContainer />

  <!-- Currency switch warning dialog -->
  <Teleport to="body">
    <div v-if="currencyStore.showWarningDialog" class="fixed inset-0 z-200 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="currencyStore.cancelSwitch"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h3 class="font-bold text-gray-800 dark:text-white text-lg">Display Currency Notice</h3>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
          Your business data is still stored in
          <span class="font-bold text-gray-900 dark:text-white">{{ CURRENCY_CONFIG[currencyStore.baseCurrency]?.name }} ({{ CURRENCY_CONFIG[currencyStore.baseCurrency]?.symbol }})</span>.
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
          Switching to
          <span class="font-bold text-gray-900 dark:text-white">{{ CURRENCY_CONFIG[currencyStore.pendingCurrency]?.name }} ({{ CURRENCY_CONFIG[currencyStore.pendingCurrency]?.symbol }})</span>
          will show <span class="font-bold text-amber-600 dark:text-amber-400">approximate converted values</span> for display only. No stored prices or transactions will be changed.
        </p>
        <div class="flex gap-3">
          <button @click="currencyStore.cancelSwitch"
            class="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button @click="currencyStore.confirmSwitch"
            class="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm transition-colors">
            Switch Display
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
