<script setup>
import { ref, computed } from 'vue'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useInventoryStore } from '../stores/inventory'
import { useProductsStore } from '../../products/stores/products'
import { useAuthStore } from '../../auth/stores/auth'
import { useToastStore } from '../../../shared/stores/toast'
import { storage } from '../../../shared/lib/firebaseClient'

const inventoryStore = useInventoryStore()
const productsStore = useProductsStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

const compressImage = (file, maxWidth = 1200, quality = 0.85) =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => resolve(new File([blob], 'receipt.jpg', { type: 'image/jpeg' })), 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })

// --- 1. CURRENT STOCK DATA ---
const inventoryItems = computed(() => {
  return inventoryStore.items.map(item => {
    let status, statusClass, color

    if (item.type === 'RENTAL') {
      const rs = item.rentalStatus || 'Available'
      status = rs
      statusClass = rs === 'Available'
        ? 'text-green-800 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
        : 'text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30'
      color = rs === 'Available'
        ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    } else {
      status = 'In Stock'
      statusClass = 'text-green-800 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      color = 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'

      if (item.stock === 0) {
        status = 'Out of Stock'
        statusClass = 'text-red-800 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
        color = 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
      } else if (item.stock < 10) {
        status = 'Low Stock'
        statusClass = 'text-yellow-800 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
        color = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      }
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
const addForm = ref({ name: '', sku: '', stock: '', cost: '', type: 'RAW_MATERIAL', productId: '' })
const editForm = ref({ id: '', name: '', sku: '', cost: '', type: 'RAW_MATERIAL', productId: '' })
const stockForm = ref({ type: 'IN', amount: '', unitCost: '', remark: '' })

// Live cost calculations
const addTotalCost = computed(() => {
  const qty = Number(addForm.value.stock) || 0
  const cost = Number(addForm.value.cost) || 0
  return qty * cost
})

const stockTotalCost = computed(() => {
  const qty = Number(stockForm.value.amount) || 0
  const cost = Number(stockForm.value.unitCost) || 0
  return qty * cost
})
const itemTypes = [
  { value: 'RAW_MATERIAL',    label: 'Raw Material',    desc: 'Ingredients or inputs used in production' },
  { value: 'FINISHED_GOODS',  label: 'Finished Goods',  desc: 'Completed products ready for sale' },
  { value: 'CONSUMABLE',      label: 'Consumable',      desc: 'Supplies used in daily operations' },
  { value: 'EQUIPMENT',       label: 'Equipment',       desc: 'Tools, machines or tracked assets' },
  { value: 'PACKAGING',       label: 'Packaging',       desc: 'Boxes, bags or labels for shipping' },
]

const logInitialTransaction = ref(true)

// Add Actions
const openAddModal = () => {
    logInitialTransaction.value = true
    addReceiptFile.value = null
    addReceiptPreview.value = ''
    isAddModalOpen.value = true
}
const closeAddModal = () => {
    isAddModalOpen.value = false
    addForm.value = { name: '', sku: '', stock: '', cost: '', type: 'CONSUMABLE', productId: '' }
    logInitialTransaction.value = true
    addReceiptFile.value = null
    addReceiptPreview.value = ''
}

const handleAddProduct = async () => {
    if (!addForm.value.name) return
    const imageFile = addReceiptFile.value
    const loggedBy = authStore.user
        ? { name: authStore.user.full_name || authStore.user.role, id: authStore.user.profileId }
        : null
    const tid = toastStore.loading('Adding inventory item...')
    try {
        const { txRef } = await inventoryStore.addInventoryItem(addForm.value, logInitialTransaction.value, loggedBy)

        if (imageFile && txRef?.id) {
            const bizId = authStore.user?.businessId
            const compressed = await compressImage(imageFile)
            const imgRef = storageRef(storage, `business/${bizId}/transactions/${txRef.id}/receipt.jpg`)
            await uploadBytes(imgRef, compressed, { contentType: 'image/jpeg' })
            const url = await getDownloadURL(imgRef)
            await inventoryStore.updateTransactionReceipt(txRef.id, url)
        }

        toastStore.replace(tid, 'success', 'Inventory item added successfully')
        closeAddModal()
    } catch (err) {
        console.error('Add inventory error:', err)
        toastStore.replace(tid, 'error', 'Failed to add item. Please try again.')
    }
}

const addReceiptFile = ref(null)
const addReceiptPreview = ref('')
const addReceiptInput = ref(null)

const receiptFile = ref(null)
const receiptPreview = ref('')
const receiptInput = ref(null)

const handleAddReceiptUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    addReceiptFile.value = file
    addReceiptPreview.value = URL.createObjectURL(file)
}

const handleReceiptUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    receiptFile.value = file
    receiptPreview.value = URL.createObjectURL(file)
}

// Edit Actions
const openEditModal = (item) => {
    editForm.value = {
        id: item.id,
        name: item.name,
        sku: item.sku || '',
        cost: item.cost || '',
        type: item.type || 'RAW_MATERIAL',
        productId: item.productId || ''
    }
    stockForm.value = { type: 'IN', amount: '', unitCost: String(item.cost || ''), remark: '' }
    receiptFile.value = null
    receiptPreview.value = ''
    isEditModalOpen.value = true
}

const closeEditModal = () => {
    isEditModalOpen.value = false
    receiptFile.value = null
    receiptPreview.value = ''
}

const handleUpdateItem = async () => {
    if (!editForm.value.name) return

    const payload = {
        name: editForm.value.name,
        sku: editForm.value.sku || '',
        cost: Number(editForm.value.cost) || 0,
        type: editForm.value.type || 'CONSUMABLE',
        productId: editForm.value.productId || null
    }

    const imageFile = receiptFile.value
    const tid = toastStore.loading('Saving details...')
    try {
        await inventoryStore.updateInventoryItem(editForm.value.id, payload)

        if (stockForm.value.amount && Number(stockForm.value.amount) > 0) {
            const loggedBy = authStore.user
                ? { name: authStore.user.full_name || authStore.user.role, id: authStore.user.profileId }
                : null

            const txRef = await inventoryStore.adjustStock(
                editForm.value.id,
                stockForm.value.type,
                stockForm.value.amount,
                Number(stockForm.value.unitCost) || payload.cost,
                stockForm.value.remark || '',
                loggedBy
            )

            if (imageFile && txRef?.id) {
                const bizId = authStore.user?.businessId
                const compressed = await compressImage(imageFile)
                const imgRef = storageRef(storage, `business/${bizId}/transactions/${txRef.id}/receipt.jpg`)
                await uploadBytes(imgRef, compressed, { contentType: 'image/jpeg' })
                const url = await getDownloadURL(imgRef)
                await inventoryStore.updateTransactionReceipt(txRef.id, url)
            }
        }

        toastStore.replace(tid, 'success', 'Inventory item saved successfully')
        closeEditModal()
    } catch (err) {
        console.error('Failed to execute save: ', err)
        toastStore.replace(tid, 'error', 'Failed to save. Please try again.')
    }
}

const handleDeleteItem = async () => {
    if (!editForm.value.id) return
    if (confirm(`Are you sure you want to completely delete "${editForm.value.name}" from the inventory?\n\nThis will remove the item, but keep historical transactions.`)) {
        const tid = toastStore.loading('Deleting item...')
        let success = false
        try {
            await inventoryStore.deleteInventoryItem(editForm.value.id)
            success = true
        } catch (err) {
            console.error('Delete inventory error:', err)
        } finally {
            if (success) {
                toastStore.replace(tid, 'success', 'Inventory item deleted')
                closeEditModal()
            } else {
                toastStore.replace(tid, 'error', 'Failed to delete item. Please try again.')
            }
        }
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
                        <span v-if="item.type" class="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{{ itemTypes.find(t => t.value === item.type)?.label || item.type }}</span>
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
        <div class="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden animate-fade-in-up transition-colors">
            <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-teal-50 dark:bg-teal-900/20 flex justify-between items-center">
                <h3 class="text-xl font-bold text-[#004D40] dark:text-teal-400">Add New Item</h3>
                <button @click="closeAddModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold leading-none">&times;</button>
            </div>
            <div class="flex">
            <div class="flex-1 p-6 space-y-4">
                <div>
                     <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Item Type</label>
                     <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                         <button 
                             v-for="t in itemTypes" 
                             :key="t.value"
                             @click="addForm.type = t.value"
                             :class="addForm.type === t.value ? 'bg-[#4DB6AC] text-white shadow-md ring-2 ring-[#4DB6AC]/40' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-gray-200 dark:border-gray-600'"
                             class="px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 focus:outline-none text-left"
                         >
                             {{ t.label }}
                         </button>
                     </div>
                     <p class="mt-2 text-xs text-gray-400 dark:text-gray-500 italic">
                         {{ itemTypes.find(t => t.value === addForm.type)?.desc }}
                     </p>
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

                <!-- Total Initial Value -->
                <div v-if="addTotalCost > 0" class="flex items-center justify-between bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg px-4 py-3">
                    <span class="text-sm font-medium text-teal-700 dark:text-teal-300">Total Initial Stock Value</span>
                    <span class="text-base font-bold text-teal-800 dark:text-teal-300 font-mono">RM {{ addTotalCost.toFixed(2) }}</span>
                </div>

                <!-- Log transaction toggle — only shown when stock > 0 -->
                <div v-if="Number(addForm.stock) > 0"
                    @click="logInitialTransaction = !logInitialTransaction"
                    :class="logInitialTransaction ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800' : 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600'"
                    class="flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer select-none transition-colors">
                    <div>
                        <p :class="logInitialTransaction ? 'text-teal-800 dark:text-teal-300' : 'text-gray-600 dark:text-gray-400'" class="text-sm font-bold">Log as opening transaction</p>
                        <p :class="logInitialTransaction ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'" class="text-xs mt-0.5">
                            {{ logInitialTransaction ? 'Initial stock will appear in transaction history' : 'Initial stock will be set silently' }}
                        </p>
                    </div>
                    <div :class="logInitialTransaction ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'" class="relative w-10 h-6 rounded-full transition-colors shrink-0 ml-4">
                        <span :class="logInitialTransaction ? 'translate-x-5' : 'translate-x-1'" class="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"></span>
                    </div>
                </div>

                <div class="pt-4 flex gap-3">
                    <button @click="closeAddModal" class="flex-1 py-3 px-4 rounded-lg text-gray-500 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                    <button @click="handleAddProduct" class="flex-1 py-3 px-4 rounded-lg bg-[#4DB6AC] text-white font-bold shadow-lg hover:bg-[#26A69A] transition-colors">Save Item</button>
                </div>
            </div>

            <!-- Receipt upload — right -->
            <div class="w-48 shrink-0 border-l border-gray-100 dark:border-gray-700 flex flex-col">
                <button type="button" @click="addReceiptInput.click()"
                    class="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-colors cursor-pointer relative group overflow-hidden">
                    <img v-if="addReceiptPreview" :src="addReceiptPreview" class="absolute inset-0 w-full h-full object-cover" alt="" />
                    <template v-if="!addReceiptPreview">
                        <svg class="w-10 h-10 text-gray-300 dark:text-gray-500 group-hover:text-teal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span class="text-xs text-gray-400 dark:text-gray-500 group-hover:text-teal-500 font-medium text-center px-3 leading-relaxed">Upload procurement receipt</span>
                    </template>
                    <div v-else class="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-end justify-center pb-3 pointer-events-none">
                        <span class="text-white text-xs font-bold drop-shadow opacity-0 group-hover:opacity-100 transition-opacity">Change</span>
                    </div>
                </button>
                <div v-if="addReceiptPreview" class="border-t border-gray-100 dark:border-gray-700 p-2 flex justify-center">
                    <button type="button" @click="addReceiptFile = null; addReceiptPreview = ''"
                        class="text-xs text-red-400 hover:text-red-600 transition-colors font-medium">Remove</button>
                </div>
                <input ref="addReceiptInput" type="file" class="hidden" accept="image/*" @change="handleAddReceiptUpload" />
            </div>

            </div><!-- end flex body -->
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
            
            <div class="flex flex-1 overflow-hidden">

            <!-- Scrollable form — left -->
            <div class="flex-1 p-6 overflow-y-auto space-y-8">

                <!-- Section: Item Details -->
                <div>
                    <h4 class="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Item Details</h4>
                    <div class="space-y-4">
                        <div>
                             <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Item Type</label>
                             <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                 <button 
                                     v-for="t in itemTypes" 
                                     :key="t.value"
                                     @click="editForm.type = t.value"
                                     :class="editForm.type === t.value ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-400/40' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600'"
                                     class="px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 focus:outline-none text-left"
                                 >
                                     {{ t.label }}
                                 </button>
                             </div>
                             <p class="mt-2 text-xs text-gray-400 dark:text-gray-500 italic">
                                 {{ itemTypes.find(t => t.value === editForm.type)?.desc }}
                             </p>
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

                         <!-- Unit Cost for Stock IN -->
                         <div v-if="stockForm.type === 'IN'" class="grid grid-cols-2 gap-4">
                             <div>
                                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Unit Cost (RM)</label>
                                 <div class="relative">
                                     <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold text-sm">RM</span>
                                     <input v-model="stockForm.unitCost" type="number" min="0" step="0.01" placeholder="0.00" class="w-full pl-10 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none font-mono text-gray-800 dark:text-white">
                                 </div>
                                 <p class="mt-1 text-[10px] text-gray-400 dark:text-gray-500">Leave unchanged to use stored cost</p>
                             </div>
                             <div v-if="stockTotalCost > 0" class="flex flex-col justify-center items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-2.5">
                                 <span class="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wide">Total Stock-In Cost</span>
                                 <span class="text-lg font-black text-blue-700 dark:text-blue-300 font-mono mt-0.5">RM {{ stockTotalCost.toFixed(2) }}</span>
                                 <span class="text-[10px] text-blue-400 dark:text-blue-500">{{ stockForm.amount || 0 }} units × RM {{ Number(stockForm.unitCost || 0).toFixed(2) }}</span>
                             </div>
                         </div>

                         <div>
                            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Remarks / Reason</label>
                            <input v-model="stockForm.remark" type="text" placeholder="e.g. Vendor delivery, damaged goods..." class="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm text-gray-700 dark:text-white">
                         </div>

                     </div>
                </div>

            </div>

            <!-- Receipt upload — right -->
            <div class="w-48 shrink-0 border-l border-gray-100 dark:border-gray-700 flex flex-col">
                <button type="button" @click="receiptInput.click()"
                    class="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer relative group overflow-hidden">
                    <img v-if="receiptPreview" :src="receiptPreview" class="absolute inset-0 w-full h-full object-cover" alt="" />
                    <template v-if="!receiptPreview">
                        <svg class="w-10 h-10 text-gray-300 dark:text-gray-500 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span class="text-xs text-gray-400 dark:text-gray-500 group-hover:text-blue-500 font-medium text-center px-3 leading-relaxed">Upload procurement receipt</span>
                    </template>
                    <div v-else class="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-end justify-center pb-3 pointer-events-none">
                        <span class="text-white text-xs font-bold drop-shadow opacity-0 group-hover:opacity-100 transition-opacity">Change</span>
                    </div>
                </button>
                <div v-if="receiptPreview" class="border-t border-gray-100 dark:border-gray-700 p-2 flex justify-center">
                    <button type="button" @click="receiptFile = null; receiptPreview = ''"
                        class="text-xs text-red-400 hover:text-red-600 transition-colors font-medium">Remove</button>
                </div>
                <input ref="receiptInput" type="file" class="hidden" accept="image/*" @change="handleReceiptUpload" />
            </div>

            </div><!-- end flex body -->

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