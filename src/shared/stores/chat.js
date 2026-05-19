import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '../lib/firebaseClient'
import { useAuthStore } from '../../modules/auth/stores/auth'

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore()

  const chatRef = computed(() => {
    const bizId = authStore.user?.businessId
    return bizId
      ? query(collection(db, `businesses/${bizId}/chat`), orderBy('createdAt', 'asc'), limit(200))
      : null
  })

  const messages = useCollection(chatRef)

  const lastSeenKey = computed(() =>
    `chat_last_seen_${authStore.user?.businessId}_${authStore.user?.profileId}`
  )

  const markSeen = () => {
    if (lastSeenKey.value) localStorage.setItem(lastSeenKey.value, Date.now().toString())
  }

  const unreadCount = computed(() => {
    const raw = localStorage.getItem(lastSeenKey.value)
    const lastSeen = raw ? Number(raw) : 0
    const myId = authStore.user?.profileId
    return messages.value.filter(m => {
      if (m.senderId === myId) return false
      const t = m.createdAt?.toMillis ? m.createdAt.toMillis() : 0
      return t > lastSeen
    }).length
  })

  const sendMessage = async (text) => {
    const bizId = authStore.user?.businessId
    const user = authStore.user
    if (!bizId || !user || !text.trim()) return
    await addDoc(collection(db, `businesses/${bizId}/chat`), {
      text: text.trim(),
      senderId: user.profileId || user.id,
      senderName: user.full_name || user.role,
      senderRole: user.role,
      createdAt: serverTimestamp(),
    })
  }

  return { messages, unreadCount, sendMessage, markSeen }
})
