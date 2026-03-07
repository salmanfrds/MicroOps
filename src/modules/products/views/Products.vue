<script setup>
import { ref, computed } from 'vue'
import { useProductsStore } from '../stores/products'
import { useInventoryStore } from '../../inventory/stores/inventory'

const productsStore = useProductsStore()
const inventoryStore = useInventoryStore()

const products = computed(() => {
    return productsStore.items.map(item => {
        let typeClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        let color = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        
        switch (item.type) {
            case 'Stocked':
                typeClass = 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400'
                color = 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                break
            case 'Prepared':
                typeClass = 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
                color = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                break
            case 'Service':
                typeClass = 'bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-400'
                color = 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300'
                break
            case 'Rental':
                typeClass = 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                color = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                break
        }

        // If it linked to an inventory item, grab its stock instead of physical product memory
        let currentStock = item.stock || 0
        if (item.inventoryId) {
            const linkedInventory = inventoryStore.items.find(inv => inv.id === item.inventoryId)
            currentStock = linkedInventory ? linkedInventory.stock : 0
        }

        return {
            ...item,
            id: item.id,
            typeClass,
            color,
            currentStock,
            initials: item.name ? item.name.substring(0, 2).toUpperCase() : 'P'
        }
    })
})

const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const editId = ref(null)

const addForm = ref({ name: '', sku: '', price: '', type: 'Stocked', category: 'General', inventoryId: '' })
const editForm = ref({ name: '', sku: '', price: '', type: 'Stocked', category: 'General', inventoryId: '' })

const productTypes = ['Stocked', 'Prepared', 'Service', 'Rental']
const productCategories = ['Drinks', 'Food', 'Merch', 'General']

const openAddModal = () => {
    addForm.value = { name: '', sku: '', price: '', type: 'Stocked', category: 'General', inventoryId: '' }
    isAddModalOpen.value = true
}

const openEditModal = (product) => {
    editId.value = product.id
    editForm.value = { 
        name: product.name || '', 
        sku: product.sku || '', 
        price: product.price || '', 
        type: product.type || 'Stocked', 
        category: product.category || 'General', 
        inventoryId: product.inventoryId || '' 
    }
    isEditModalOpen.value = true
}

const closeAddModal = () => {
    isAddModalOpen.value = false
    addForm.value = { name: '', sku: '', price: '', type: 'Stocked', category: 'General', inventoryId: '' }
}

const closeEditModal = () => {
    isEditModalOpen.value = false
    editId.value = null
    editForm.value = { name: '', sku: '', price: '', type: 'Stocked', category: 'General', inventoryId: '' }
}

const handleAddProduct = async () => {
    if (!addForm.value.name || !addForm.value.type || addForm.value.price === '') return
    
    if ((addForm.value.type === 'Stocked' || addForm.value.type === 'Rental') && !addForm.value.inventoryId) {
        alert('Please map this product to an inventory item.')
        return
    }

    await productsStore.addProduct(addForm.value)
    closeAddModal()
}

const handleUpdateProduct = async () => {
    if (!editId.value || !editForm.value.name || !editForm.value.type || editForm.value.price === '') return

    if ((editForm.value.type === 'Stocked' || editForm.value.type === 'Rental') && !editForm.value.inventoryId) {
        alert('Please map this product to an inventory item.')
        return
    }

    const updates = { ...editForm.value, price: Number(editForm.value.price) || 0 }
    await productsStore.updateProduct(editId.value, updates)
    closeEditModal()
}

const handleDelete = async () => {
    if (!editId.value) return;
    if (confirm("Are you sure you want to delete this product?")) {
         await productsStore.deleteProduct(editId.value)
         closeEditModal()
    }
}
</script>

<template>
  <section class="space-y-12">
    <div>
      <header class="mb-6">
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Products Management</h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400 mb-4">Manage sell-able items, services, and rentals.</p>
        
        <button 
          @click="openAddModal"
          class="bg-indigo-600 dark:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors flex items-center gap-2"
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
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Product Info</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Type</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Price (RM)</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Available Stock</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
            <tr 
              v-for="product in products" 
              :key="product.id" 
              @click="openEditModal(product)"
              class="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
            >
              
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div :class="[product.color, 'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm']">
                    {{ product.initials }}
                  </div>
                  <div>
                    <div class="font-bold text-gray-800 dark:text-white text-sm">{{ product.name }}</div>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-xs text-gray-400 dark:text-gray-500 font-mono tracking-wide">SKU: {{ product.sku || 'N/A' }}</span>
                        <span v-if="product.category" class="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{{ product.category }}</span>
                    </div>
                  </div>
                </div>
              </td>
              
              <td class="p-4">
                <span :class="product.typeClass" class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent">
                  {{ product.type }}
                </span>
              </td>
              
              <td class="p-4">
                 <div class="font-bold text-gray-800 dark:text-white text-base">RM {{ parseFloat(product.price).toFixed(2) }}</div>
              </td>
              
              <td class="p-4">
                 <div class="flex items-center gap-2">
                   <span v-if="product.type === 'Stocked'" class="font-bold text-gray-800 dark:text-white text-base">{{ product.currentStock }}</span>
                   <span v-else-if="product.type === 'Prepared'" class="font-bold text-gray-800 dark:text-white text-xs italic opacity-80">Always In Stock</span>
                   <span v-else class="text-sm font-medium text-gray-400 dark:text-gray-500">—</span>
                 </div>
              </td>

              <td class="p-4 text-right">
                  <button 
                    @click.stop="openEditModal(product)"
                    class="text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
              </td>
            </tr>
            <tr v-if="products.length === 0">
                <td colspan="5" class="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No products added yet.
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isAddModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeAddModal" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"></div>
        <div class="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden animate-fade-in-up transition-colors">
            <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20 flex justify-between items-center">
                <h3 class="text-xl font-bold text-indigo-900 dark:text-indigo-400">Add Sellable Item</h3>
                <button @click="closeAddModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold leading-none">&times;</button>
            </div>
            <div class="p-6 space-y-4">
                
                <div>
                     <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Item Type</label>
                     <div class="flex flex-wrap gap-2">
                         <button 
                             v-for="type in productTypes" 
                             :key="type"
                             @click="addForm.type = type"
                             :class="addForm.type === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
                             class="px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 focus:outline-none"
                         >
                             {{ type }}
                         </button>
                     </div>
                 </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input v-model="addForm.name" type="text" placeholder="e.g. Premium Coffee Beans" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-white transition-shadow">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">SKU (Optional)</label>
                        <input v-model="addForm.sku" type="text" placeholder="COF-001" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-gray-700 dark:text-white transition-shadow">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Price (RM)</label>
                        <input v-model="addForm.price" type="number" placeholder="0.00" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-white transition-shadow">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                     <div>
                         <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                         <select v-model="addForm.category" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-white transition-shadow appearance-none">
                             <option v-for="cat in productCategories" :key="cat" :value="cat">{{ cat }}</option>
                         </select>
                     </div>
                     <div v-if="addForm.type === 'Stocked' || addForm.type === 'Rental'">
                         <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Link to Inventory</label>
                         <select v-model="addForm.inventoryId" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-white transition-shadow appearance-none">
                             <option value="" disabled>-- Select Inventory --</option>
                             <option v-for="inv in inventoryStore.items" :key="inv.id" :value="inv.id">{{ inv.name }}</option>
                         </select>
                     </div>
                </div>

                <div class="pt-4 flex gap-3">
                    <button @click="closeAddModal" class="flex-1 py-3 px-4 rounded-lg text-gray-500 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                    <button @click="handleAddProduct" class="flex-1 py-3 px-4 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white font-bold shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors">Save {{ addForm.type }}</button>
                </div>
            </div>
        </div>
      </div>

      <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeEditModal" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"></div>
        <div class="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden animate-fade-in-up transition-colors">
            <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20 flex justify-between items-center">
                <h3 class="text-xl font-bold text-indigo-900 dark:text-indigo-400">Edit Sellable Item</h3>
                <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold leading-none">&times;</button>
            </div>
            <div class="p-6 space-y-4">
                
                <div>
                     <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Item Type</label>
                     <div class="flex flex-wrap gap-2">
                         <button 
                             v-for="type in productTypes" 
                             :key="type"
                             @click="editForm.type = type"
                             :class="editForm.type === type ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
                             class="px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 focus:outline-none"
                         >
                             {{ type }}
                         </button>
                     </div>
                 </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input v-model="editForm.name" type="text" placeholder="e.g. Premium Coffee Beans" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-white transition-shadow">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">SKU (Optional)</label>
                        <input v-model="editForm.sku" type="text" placeholder="COF-001" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-gray-700 dark:text-white transition-shadow">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Price (RM)</label>
                        <input v-model="editForm.price" type="number" placeholder="0.00" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-white transition-shadow">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                     <div>
                         <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                         <select v-model="editForm.category" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-white transition-shadow appearance-none">
                             <option v-for="cat in productCategories" :key="cat" :value="cat">{{ cat }}</option>
                         </select>
                     </div>
                     <div v-if="editForm.type === 'Stocked' || editForm.type === 'Rental'">
                         <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Link to Inventory</label>
                         <select v-model="editForm.inventoryId" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-white transition-shadow appearance-none">
                             <option value="" disabled>-- Select Inventory --</option>
                             <option v-for="inv in inventoryStore.items" :key="inv.id" :value="inv.id">{{ inv.name }}</option>
                         </select>
                     </div>
                </div>

                <div class="pt-4 flex gap-3">
                    <button @click="handleDelete" class="py-3 px-4 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">Delete</button>
                    <button @click="closeEditModal" class="flex-1 py-3 px-4 rounded-lg text-gray-500 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                    <button @click="handleUpdateProduct" class="flex-1 py-3 px-4 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white font-bold shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors">Save {{ editForm.type }}</button>
                </div>
            </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
