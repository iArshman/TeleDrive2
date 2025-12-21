/**
 * TeleDrive - File Cache using IndexedDB
 */

import localforage from 'localforage'

// Configure localforage
localforage.config({
    name: 'TeleDrive',
    storeName: 'file_cache',
    description: 'TeleDrive file cache'
})

// Create separate stores
const fileCache = localforage.createInstance({
    name: 'TeleDrive',
    storeName: 'files'
})

const thumbnailCache = localforage.createInstance({
    name: 'TeleDrive',
    storeName: 'thumbnails'
})

const metadataCache = localforage.createInstance({
    name: 'TeleDrive',
    storeName: 'metadata'
})

// Maximum cache size in bytes (500MB)
const MAX_CACHE_SIZE = 500 * 1024 * 1024

// Maximum age for cache entries (7 days)
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000

/**
 * Get cached file
 * @param {string} fileId - File ID
 * @returns {Promise<Blob|null>}
 */
export async function getCachedFile(fileId) {
    try {
        const entry = await fileCache.getItem(fileId)
        if (!entry) return null

        // Check if expired
        if (Date.now() - entry.timestamp > MAX_CACHE_AGE) {
            await fileCache.removeItem(fileId)
            return null
        }

        // Update access time
        entry.accessTime = Date.now()
        await fileCache.setItem(fileId, entry)

        return entry.data
    } catch (err) {
        console.error('Cache read error:', err)
        return null
    }
}

/**
 * Cache a file
 * @param {string} fileId - File ID
 * @param {Blob} data - File data
 * @param {object} metadata - File metadata
 */
export async function cacheFile(fileId, data, metadata = {}) {
    try {
        // Check cache size before adding
        await pruneCache()

        const entry = {
            data,
            metadata,
            timestamp: Date.now(),
            accessTime: Date.now(),
            size: data.size
        }

        await fileCache.setItem(fileId, entry)
    } catch (err) {
        console.error('Cache write error:', err)
    }
}

/**
 * Get cached thumbnail
 * @param {string} fileId - File ID
 * @returns {Promise<string|null>} - Base64 thumbnail URL
 */
export async function getCachedThumbnail(fileId) {
    try {
        const entry = await thumbnailCache.getItem(fileId)
        if (!entry) return null

        // Check if expired
        if (Date.now() - entry.timestamp > MAX_CACHE_AGE) {
            await thumbnailCache.removeItem(fileId)
            return null
        }

        return entry.data
    } catch (err) {
        console.error('Thumbnail cache read error:', err)
        return null
    }
}

/**
 * Cache a thumbnail
 * @param {string} fileId - File ID
 * @param {string} dataUrl - Base64 thumbnail URL
 */
export async function cacheThumbnail(fileId, dataUrl) {
    try {
        const entry = {
            data: dataUrl,
            timestamp: Date.now()
        }

        await thumbnailCache.setItem(fileId, entry)
    } catch (err) {
        console.error('Thumbnail cache write error:', err)
    }
}

/**
 * Generate thumbnail from image
 * @param {Blob} imageBlob - Image blob
 * @param {number} maxSize - Maximum thumbnail size (default: 200)
 * @returns {Promise<string>} - Base64 thumbnail URL
 */
export async function generateThumbnail(imageBlob, maxSize = 200) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(imageBlob)

        img.onload = () => {
            URL.revokeObjectURL(url)

            // Calculate dimensions
            let width = img.width
            let height = img.height

            if (width > height) {
                if (width > maxSize) {
                    height = Math.round((height * maxSize) / width)
                    width = maxSize
                }
            } else {
                if (height > maxSize) {
                    width = Math.round((width * maxSize) / height)
                    height = maxSize
                }
            }

            // Draw on canvas
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)

            resolve(canvas.toDataURL('image/jpeg', 0.8))
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to load image'))
        }

        img.src = url
    })
}

/**
 * Prune cache to stay under size limit
 */
async function pruneCache() {
    try {
        const entries = []

        await fileCache.iterate((value, key) => {
            entries.push({
                key,
                accessTime: value.accessTime || value.timestamp,
                size: value.size || 0
            })
        })

        // Calculate total size
        let totalSize = entries.reduce((sum, e) => sum + e.size, 0)

        // If under limit, no need to prune
        if (totalSize <= MAX_CACHE_SIZE) return

        // Sort by access time (oldest first)
        entries.sort((a, b) => a.accessTime - b.accessTime)

        // Remove entries until under limit
        for (const entry of entries) {
            if (totalSize <= MAX_CACHE_SIZE * 0.8) break

            await fileCache.removeItem(entry.key)
            totalSize -= entry.size
        }
    } catch (err) {
        console.error('Cache prune error:', err)
    }
}

/**
 * Clear all caches
 */
export async function clearCache() {
    try {
        await fileCache.clear()
        await thumbnailCache.clear()
        await metadataCache.clear()
    } catch (err) {
        console.error('Cache clear error:', err)
    }
}

/**
 * Get cache statistics
 * @returns {Promise<{ fileCount: number, totalSize: number }>}
 */
export async function getCacheStats() {
    try {
        let fileCount = 0
        let totalSize = 0

        await fileCache.iterate((value) => {
            fileCount++
            totalSize += value.size || 0
        })

        return { fileCount, totalSize }
    } catch (err) {
        console.error('Cache stats error:', err)
        return { fileCount: 0, totalSize: 0 }
    }
}

export default {
    getCachedFile,
    cacheFile,
    getCachedThumbnail,
    cacheThumbnail,
    generateThumbnail,
    clearCache,
    getCacheStats
}
