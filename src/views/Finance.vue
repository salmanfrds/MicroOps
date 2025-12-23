<script setup>
import { ref, computed } from 'vue'

const incomeData = ref([
  { id: 1, date: '2025-06-25', source: 'Order #1024', amount: '+$250.00' },
  { id: 2, date: '2025-06-24', source: 'Order #1023', amount: '+$150.75' },
])

const expenseData = ref([
  { id: 1, date: '2025-06-20', category: 'Raw Materials', amount: '-$75.20' },
  { id: 2, date: '2025-06-18', category: 'Marketing', amount: '-$50.00' },
])

// --- MODAL STATE ---
const activeModal = ref(null) // 'income' | 'expense' | null

const openModal = (type) => {
  activeModal.value = type
}

const closeModal = () => {
  activeModal.value = null
}

// Helper to make the modal dynamic based on type
const modalConfig = computed(() => {
  const isIncome = activeModal.value === 'income'
  return {
    title: isIncome ? 'Record New Income' : 'Record New Expense',
    label: isIncome ? 'Income Source' : 'Expense Category',
    themeColor: isIncome ? 'bg-[#4DB6AC] hover:bg-[#26A69A]' : 'bg-[#E57373] hover:bg-[#EF5350]',
    placeholder: isIncome ? 'e.g., Client Payment, Refund' : 'e.g., Office Supplies, Rent'
  }
})
</script>

<template>
  <section>
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-gray-800">Income & Expense Tracking</h2>
      <p class="mt-2 text-gray-600">Monitor all financial inflows and outflows for your business.</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <div>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-gray-800">Income</h3>
          <button 
            @click="openModal('income')"
            class="bg-[#4DB6AC] text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-[#26A69A] transition-colors"
          >
            Add Income
          </button>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm overflow-x-auto border-t-4 border-[#4DB6AC]">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b">
                <th class="p-4">Date</th>
                <th class="p-4">Source</th>
                <th class="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in incomeData" :key="item.id" class="border-b hover:bg-gray-50">
                <td class="p-4">{{ item.date }}</td>
                <td class="p-4">{{ item.source }}</td>
                <td class="p-4 text-right text-green-600 font-bold">{{ item.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-gray-800">Expenses</h3>
          <button 
            @click="openModal('expense')"
            class="bg-[#E57373] text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-[#EF5350] transition-colors"
          >
            Add Expense
          </button>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm overflow-x-auto border-t-4 border-[#E57373]">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b">
                <th class="p-4">Date</th>
                <th class="p-4">Category</th>
                <th class="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in expenseData" :key="item.id" class="border-b hover:bg-gray-50">
                <td class="p-4">{{ item.date }}</td>
                <td class="p-4">{{ item.category }}</td>
                <td class="p-4 text-right text-red-600 font-bold">{{ item.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <Teleport to="body">
      <div v-if="activeModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeModal" class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all">
            
            <div class="p-6 border-b flex justify-between items-center bg-gray-50">
                <h3 class="text-xl font-bold text-gray-800">{{ modalConfig.title }}</h3>
                <button @click="closeModal" class="text-gray-400 hover:text-gray-600 font-bold text-2xl">&times;</button>
            </div>

            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Date</label>
                    <input type="date" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-200 outline-none text-gray-600">
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">{{ modalConfig.label }}</label>
                    <input type="text" :placeholder="modalConfig.placeholder" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-200 outline-none">
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Amount ($)</label>
                    <input type="number" placeholder="0.00" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-200 outline-none font-mono">
                </div>

                <div class="pt-4 flex gap-3">
                    <button @click="closeModal" class="flex-1 py-3 px-4 rounded-lg text-gray-500 font-bold hover:bg-gray-100 transition-colors">
                        Cancel
                    </button>
                    <button 
                        @click="closeModal"
                        :class="modalConfig.themeColor"
                        class="flex-1 py-3 px-4 rounded-lg text-white font-bold shadow-lg transition-colors"
                    >
                        Save Record
                    </button>
                </div>
            </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>