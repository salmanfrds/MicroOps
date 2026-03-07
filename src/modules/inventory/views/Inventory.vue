<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '../stores/inventory'
import { useProductsStore } from '../../products/stores/products'

const inventoryStore = useInventoryStore()
const productsStore = useProductsStore()

// --- 1. CURRENT STOCK DATA ---
const inventoryItems = computed(() => {
  return inventoryStore.items.map(item => {
    let status = 'In Stock'
    let statusClass = 'text-green-800 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
    let color = 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
    
    if (item.stock === 0) {
      status = 'Out of Stock'
      statusClass = 'text-red-800 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
      color = 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
    } else if (item.stock < 10) {
      status = 'Low Stock'
      statusClass = 'text-yellow-800 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
      color = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
    }

    return {
      ...item,
      id: item.id,
      status,
      statusClass,
      initials: item.name ? item.name.substring(0, 2).toUpperCase() : '??',
      color,
      linkedProduct: productsStore.items.find(p => p.id === item.productId)?.name || null
    }
  })
})

// --- 2. TRANSACTION LOG DATA ---
const transactionLog = computed(() => {
    return inventoryStore.transactions.map(log => {
        const itemInfo = inventoryStore.items.find(i => i.id === log.itemId)
        return {
            ...log,
            id: log.id.substring(0, 8), // Shorten ID for display
            date: log.date || new Date(log.createdAt?.seconds * 1000).toISOString().split('T')[0] || 'N/A',
            itemName: itemInfo ? itemInfo.name : 'Unknown Item'
        }
    }).sort((a, b) => {
        // Sort descending by creation time
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
    })
})

// --- ACTIONS & MODALS STATE ---
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)

// Forms
const addForm = ref({ name: '', sku: '', stock: '', cost: '', type: 'CONSUMABLE', productId: '' })
const editForm = ref({ id: '', name: '', sku: '', cost: '', type: 'CONSUMABLE', productId: '' })
const stockForm = ref({ type: 'IN', amount: '', remark: '' })
const itemTypes = ['RETAIL', 'RENTAL', 'CONSUMABLE']

// Add Actions
const openAddModal = () => isAddModalOpen.value = true
const closeAddModal = () => {
    isAddModalOpen.value = false
    addForm.value = { name: '', sku: '', stock: '', cost: '', type: 'CONSUMABLE', productId: '' }
}

const handleAddProduct = async () => {
    if (!addForm.value.name) return
    await inventoryStore.addInventoryItem(addForm.value)
    closeAddModal()
}

// Edit Actions
const openEditModal = (item) => {
    editForm.value = { 
        id: item.id, 
        name: item.name, 
        sku: item.sku || '', 
        cost: item.cost || '', 
        type: item.type || 'CONSUMABLE', 
        productId: item.productId || '' 
    }
    stockForm.value = { type: 'IN', amount: '', remark: '' }
    isEditModalOpen.value = true
}

const closeEditModal = () => {
    isEditModalOpen.value = false
}

const handleUpdateItem = async () => {
    try {
        if (!editForm.value.name) return
        
        // Ensure no undefined values are sent to Firestore which causes silent crashes
        const payload = {
            name: editForm.value.name,
            sku: editForm.value.sku || '',
            cost: Number(editForm.value.cost) || 0,
            type: editForm.value.type || 'CONSUMABLE',
            productId: editForm.value.productId || null
        }
        
        // 1. Update Details
        await inventoryStore.updateInventoryItem(editForm.value.id, payload)
        
        // 2. Adjust Stock if filled
        if (stockForm.value.amount && Number(stockForm.value.amount) > 0) {
            await inventoryStore.adjustStock(
                editForm.value.id, 
                stockForm.value.type, 
                stockForm.value.amount, 
                payload.cost, 
                stockForm.value.remark || ''
            )
        }

        closeEditModal()
    } catch (e) {
        console.error("Failed to execute save: ", e)
        alert("Failed to save transaction: " + e.message)
    }
}

const handleDeleteItem = async () => {
    if (!editForm.value.id) return;
    if (confirm(`Are you sure you want to completely delete "${editForm.value.name}" from the inventory?\n\nThis will remove the item, but keep historical transactions.`)) {
         await inventoryStore.deleteInventoryItem(editForm.value.id)
         closeEditModal()
    }
}

</script>

<template>
  <section class="space-y-12">

    <div>
      <header class="mb-6">
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Inventory Management</h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400 mb-4">Real-time stock levels and adjustments.</p>
        
        <button 
          @click="openAddModal"
          class="bg-[#4DB6AC] text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#26A69A] transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add Item
        </button>
      </header>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm overflow-x-auto border border-gray-100 dark:border-gray-700 transition-colors">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700">
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Item Details</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Stock Level</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
            <tr v-for="item in inventoryItems" :key="item.id" class="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors group">
              
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div :class="[item.color, 'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm']">
                    {{ item.initials }}
                  </div>
                  <div>
                    <div class="font-bold text-gray-800 dark:text-white text-sm">{{ item.name }}</div>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs text-gray-400 dark:text-gray-500 font-mono tracking-wide">SKU: {{ item.sku || 'N/A' }}</span>
                        <span v-if="item.type" class="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{{ item.type }}</span>
                        <span v-if="item.linkedProduct" class="text-[10px] text-teal-600 dark:text-teal-400 font-bold ml-1" title="Linked to Product">&#x1F517; {{ item.linkedProduct }}</span>
                    </div>
                  </div>
                </div>
              </td>
              
              <td class="p-4">
                 <div class="flex items-center gap-2">
                   <span class="font-bold text-gray-800 dark:text-white text-base">{{ item.stock }}</span>
                   <span class="text-xs text-gray-400 dark:text-gray-500">units</span>
                 </div>
              </td>
              
              <td class="p-4">
                <span :class="item.statusClass" class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent">
                  {{ item.status }}
                </span>
              </td>
              
              <td class="p-4 text-right">
                  <div class="flex justify-end gap-2">
                      <button 
                        @click="openEditModal(item)"
                        class="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 hover:border-blue-400 font-bold text-xs py-1.5 px-4 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                  </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="border-t border-dashed border-gray-200 dark:border-gray-700 pt-8">
      <div class="mb-6 flex justify-between items-end">
        <div>
           <h3 class="text-xl font-bold text-gray-800 dark:text-white">Transaction History</h3>
           <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Log of stock adjustments and tracking.</p>
        </div>
        <span class="text-xs font-bold text-[#4DB6AC] dark:text-teal-400 cursor-pointer hover:underline">View All History</span>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm overflow-x-auto border border-gray-100 dark:border-gray-700 transition-colors">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700">
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date & Ref</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Item Details</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Type</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Quantity</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Total Cost</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
            <tr v-for="log in transactionLog" :key="log.id" class="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors">
              <td class="p-4 align-top">
                <div class="flex flex-col">
                   <span class="font-bold text-gray-800 dark:text-white text-sm tabular-nums">{{ log.date }}</span>
                   <span class="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-1 uppercase tracking-wide">#{{ log.id }}</span>
                </div>
              </td>
              <td class="p-4 align-top">
                <div>
                  <div class="font-bold text-gray-800 dark:text-white text-sm">{{ log.itemName }}</div>
                  <div v-if="log.remark" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 italic">
                    "{{ log.remark }}"
                  </div>
                </div>
              </td>
              <td class="p-4 align-top">
                <span 
                  :class="log.type === 'IN' ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800' : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800'"
                  class="px-2 py-0.5 text-[10px] font-bold uppercase rounded border inline-flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="log.type === 'IN' ? 'bg-green-500' : 'bg-red-500'"></span>
                  {{ log.type === 'IN' ? 'Stock In' : 'Stock Out' }}
                </span>
              </td>
              <td class="p-4 align-top">
                <div class="flex items-center gap-1.5">
                    <span :class="[
                      'px-2 py-1 rounded-md text-xs font-bold font-mono border',
                      log.type === 'IN' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800'
                    ]">
                        {{ log.type === 'IN' ? '+' : '-' }}{{ log.amount }}
                    </span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">units</span>
                </div>
              </td>
              <td class="p-4 align-top text-right">
                <div v-if="log.type === 'IN'" class="font-bold text-gray-800 dark:text-white text-sm font-mono tabular-nums">RM {{ (log.total || 0).toFixed(2) }}</div>
                <div v-else class="text-gray-400 dark:text-gray-500 text-sm font-mono tabular-nums">-</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ADD MODAL -->
    <Teleport to="body">
      <div v-if="isAddModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeAddModal" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"></div>
        <div class="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden animate-fade-in-up transition-colors">
            <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-teal-50 dark:bg-teal-900/20 flex justify-between items-center">
                <h3 class="text-xl font-bold text-[#004D40] dark:text-teal-400">Add New Item</h3>
                <button @click="closeAddModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold leading-none">&times;</button>
            </div>
            <div class="p-6 space-y-4">
                <div>
                     <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Item Type</label>
                     <div class="flex flex-wrap gap-2">
                         <button 
                             v-for="type in itemTypes" 
                             :key="type"
                             @click="addForm.type = type"
                             :class="addForm.type === type ? 'bg-[#4DB6AC] text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
                             class="px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 focus:outline-none"
                         >
                             {{ type }}
                         </button>
                     </div>
                 </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Item Name</label>
                    <input v-model="addForm.name" type="text" placeholder="e.g. Vanilla Candle Raw Wax" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none text-gray-700 dark:text-white">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">SKU (Optional)</label>
                        <input v-model="addForm.sku" type="text" placeholder="VC-001" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none uppercase text-gray-700 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cost / Unit (RM)</label>
                        <input v-model="addForm.cost" type="number" placeholder="0.00" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none text-gray-700 dark:text-white">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Initial Stock Quantity</label>
                        <input v-model="addForm.stock" type="number" placeholder="0" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none text-gray-700 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Link to Product</label>
                        <select v-model="addForm.productId" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none text-gray-700 dark:text-white transition-shadow appearance-none">
                            <option value="">-- None --</option>
                            <option v-for="prod in productsStore.items" :key="prod.id" :value="prod.id">{{ prod.name }}</option>
                        </select>
                    </div>
                </div>
                <div class="pt-4 flex gap-3">
                    <button @click="closeAddModal" class="flex-1 py-3 px-4 rounded-lg text-gray-500 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                    <button @click="handleAddProduct" class="flex-1 py-3 px-4 rounded-lg bg-[#4DB6AC] text-white font-bold shadow-lg hover:bg-[#26A69A] transition-colors">Save Item</button>
                </div>
            </div>
        </div>
      </div>
    </Teleport>

    <!-- EDIT MODAL -->
    <Teleport to="body">
      <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeEditModal" class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"></div>
        <div class="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-fade-in-up transition-colors max-h-[90vh] flex flex-col">
            
            <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 flex justify-between items-center shrink-0">
                <div>
                   <h3 class="text-xl font-bold text-blue-900 dark:text-blue-400">Edit Inventory Item</h3>
                   <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">Update details & adjust stock</p>
                </div>
                <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl font-bold leading-none">&times;</button>
            </div>
            
            <div class="p-6 overflow-y-auto space-y-8 flex-1">
                
                <!-- Section: Item Details -->
                <div>
                    <h4 class="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Item Details</h4>
                    <div class="space-y-4">
                        <div>
                             <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Item Type</label>
                             <div class="flex flex-wrap gap-2">
                                 <button 
                                     v-for="type in itemTypes" 
                                     :key="type"
                                     @click="editForm.type = type"
                                     :class="editForm.type === type ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
                                     class="px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 focus:outline-none"
                                 >
                                     {{ type }}
                                 </button>
                             </div>
                         </div>
        
                        <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Item Name</label>
                            <input v-model="editForm.name" type="text" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-gray-700 dark:text-white">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                                <input v-model="editForm.sku" type="text" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none uppercase text-gray-700 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cost / Unit (RM)</label>
                                <input v-model="editForm.cost" type="number" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-gray-700 dark:text-white">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Link to Product</label>
                            <select v-model="editForm.productId" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-gray-700 dark:text-white appearance-none">
                                <option value="">-- None --</option>
                                <option v-for="prod in productsStore.items" :key="prod.id" :value="prod.id">{{ prod.name }}</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <hr class="border-gray-100 dark:border-gray-700">

                <!-- Section: Stock Adjustment -->
                <div>
                     <h4 class="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Instant Stock Adjustment</h4>
                     <div class="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-100 dark:border-gray-600 space-y-4">
                        
                         <div class="flex gap-4">
                             <div class="flex-1">
                                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Action Type</label>
                                 <div class="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm">
                                      <button 
                                        @click="stockForm.type = 'IN'"
                                        :class="stockForm.type === 'IN' ? 'bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
                                        class="flex-1 py-2.5 text-sm transition-colors"
                                      >
                                        Stock IN (+)
                                      </button>
                                      <div class="w-px bg-gray-200 dark:bg-gray-600"></div>
                                      <button 
                                        @click="stockForm.type = 'OUT'"
                                        :class="stockForm.type === 'OUT' ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'"
                                        class="flex-1 py-2.5 text-sm transition-colors"
                                      >
                                        Stock OUT (-)
                                      </button>
                                 </div>
                             </div>
                             <div class="w-1/3">
                                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                                 <input v-model="stockForm.amount" type="number" min="1" placeholder="0" class="w-full flex-1 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-center font-mono text-lg font-bold text-gray-800 dark:text-white">
                             </div>
                         </div>
                         
                         <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Remarks / Reason</label>
                            <input v-model="stockForm.remark" type="text" placeholder="e.g. Vendor delivery, damaged goods..." class="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm text-gray-700 dark:text-white">
                         </div>

                     </div>
                </div>

            </div>

            <!-- Modal Footer -->
            <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-between shrink-0">
                <button @click="handleDeleteItem" class="py-2.5 px-4 rounded-lg text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                    Delete Item
                </button>
                <div class="flex gap-4">
                    <button @click="closeEditModal" class="py-2.5 px-6 rounded-lg text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                    <button @click="handleUpdateItem" class="py-2.5 px-8 rounded-lg bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 transition-colors">Save Details & Adjust Stock</button>
                </div>
            </div>
            
        </div>
      </div>
    </Teleport>

  </section>
</template>