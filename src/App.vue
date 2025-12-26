<script setup>
import { ref,computed } from 'vue';
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import { useRoute } from 'vue-router';

const isSidebarExpanded = ref(true)

const toggleSidebar = () => {
  isSidebarExpanded.value = !isSidebarExpanded.value
}

const route = useRoute()
const isLayoutHidden = computed(() => route.meta.hideLayout === true)
</script>

<template>
  <div v-if="!isLayoutHidden" class="flex h-screen bg-[#F8F7F4] dark:bg-gray-900 text-[#5A5A5A] dark:text-gray-100 transition-colors duration-300">
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
</template>
