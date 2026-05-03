import { defineStore } from 'pinia'
import { computed } from 'vue'
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useCollection } from 'vuefire'
import { db, storage } from '../../../shared/lib/firebaseClient'
import { useAuthStore } from '../../auth/stores/auth'

const compressImage = (file, maxWidth = 800, quality = 0.85) =>
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
                canvas.toBlob(
                    (blob) => resolve(new File([blob], 'image.jpg', { type: 'image/jpeg' })),
                    'image/jpeg',
                    quality
                )
            }
            img.src = e.target.result
        }
        reader.readAsDataURL(file)
    })

export const useProductsStore = defineStore('products', () => {
    const authStore = useAuthStore()

    const productsRef = computed(() => {
        const bizId = authStore.user?.businessId
        return bizId ? collection(db, `businesses/${bizId}/products`) : null
    })
    const items = useCollection(productsRef)

    const getBizId = () => {
        const bizId = authStore.user?.businessId
        if (!bizId) throw new Error('No active business session')
        return bizId
    }

    const addProduct = async (productData) => {
        try {
            const bizId = getBizId()
            const collRef = collection(db, `businesses/${bizId}/products`)
            const docRef = await addDoc(collRef, {
                ...productData,
                price: Number(productData.price) || 0,
                stock: Number(productData.stock) || 0,
                createdAt: serverTimestamp()
            })
            return docRef
        } catch (error) {
            console.error('Error adding product:', error)
            throw error
        }
    }

    const updateProduct = async (productId, updates) => {
        try {
            const bizId = getBizId()
            const productDoc = doc(db, `businesses/${bizId}/products`, productId)
            await updateDoc(productDoc, {
                ...updates,
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error('Error updating product:', error)
            throw error
        }
    }

    const deleteProduct = async (productId) => {
        try {
            const bizId = getBizId()
            const productDoc = doc(db, `businesses/${bizId}/products`, productId)
            await deleteDoc(productDoc)
        } catch (error) {
            console.error('Error deleting product:', error)
            throw error
        }
    }

    const uploadProductImage = async (productId, file) => {
        try {
            const bizId = getBizId()
            const compressed = await compressImage(file)
            const imgRef = storageRef(storage, `business/${bizId}/products/${productId}/image.jpg`)
            await uploadBytes(imgRef, compressed, { contentType: 'image/jpeg' })
            const url = await getDownloadURL(imgRef)
            const productDoc = doc(db, `businesses/${bizId}/products`, productId)
            await updateDoc(productDoc, { imageUrl: url, updatedAt: serverTimestamp() })
            return url
        } catch (error) {
            console.error('Error uploading product image:', error)
            throw error
        }
    }

    return {
        items,
        addProduct,
        updateProduct,
        deleteProduct,
        uploadProductImage
    }
})
