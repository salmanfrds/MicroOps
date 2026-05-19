import { defineStore } from 'pinia'
import { computed } from 'vue'
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '../../../shared/lib/firebaseClient'
import { useAuthStore } from '../../auth/stores/auth'

export const useDiscountsStore = defineStore('discounts', () => {
  const authStore = useAuthStore()

  const discountsRef = computed(() => {
    const bizId = authStore.user?.businessId
    return bizId ? collection(db, `businesses/${bizId}/discounts`) : null
  })

  const discounts = useCollection(discountsRef)

  const getBizId = () => {
    const bizId = authStore.user?.businessId
    if (!bizId) throw new Error('No active business session')
    return bizId
  }

  const activeDiscounts = computed(() => {
    const now = Date.now()
    return discounts.value.filter(d => {
      if (!d.expiresAt) return true
      return new Date(d.expiresAt).getTime() >= now
    })
  })

  const addDiscount = async (data) => {
    const bizId = getBizId()
    await addDoc(collection(db, `businesses/${bizId}/discounts`), {
      ...data,
      createdAt: serverTimestamp()
    })
  }

  const updateDiscount = async (id, data) => {
    const bizId = getBizId()
    await updateDoc(doc(db, `businesses/${bizId}/discounts`, id), data)
  }

  const deleteDiscount = async (id) => {
    const bizId = getBizId()
    await deleteDoc(doc(db, `businesses/${bizId}/discounts`, id))
  }

  return { discounts, activeDiscounts, addDiscount, updateDiscount, deleteDiscount }
})
