<script setup>
import { ref } from 'vue';
import Sidebar from './components/Sidebar.vue';

const isSidebarExpanded = ref(true)

const toggleSidebar = () => {
  isSidebarExpanded.value = !isSidebarExpanded.value
}
</script>

<template>
  <div class="flex h-screen bg-[#F8F7F4] text-[#5A5A5A]">
    <Sidebar :isExpanded="isSidebarExpanded" @toggle="toggleSidebar" />

    <main class="flex-1 overflow-y-auto transition-all duration-300">
      <div class="p-6 md:p-10">
        <router-view />
      </div>
    </main>
  </div>
</template>
