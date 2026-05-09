/**
 * Telegram Bot API Service
 * Handles all communication with the Telegram Bot backend
 */

import localforage from 'localforage'

// Storage for file index (since Bot API can't list message history)
const fileStorage = localforage.createInstance({
    name: 'teledrive',
    storeName: 'files',
})

const userStorage = localforage.createInstance({
    name: 'teledrive',
    storeName: 'user',
})

const API_BASE = '/api/telegram'

class TelegramBotService {
    constructor() {
        this.user = null
        this.files = new Map()
    }

    /**
     * Login with Telegram User ID (simple, no webhook required)
     */
    async loginWithUserId(userId) {
        // Validate the user ID looks reasonable
        const cleanId = String(userId).replace(/\D/g, '')
        if (!cleanId || cleanId.length < 5) {
            throw new Error('Invalid Telegram User ID')
        }

        // Create user object from ID
        // In a real implementation, you'd verify this via bot API
        this.user = {
            id: cleanId,
            username: null,
            firstName: 'User',
            lastName: cleanId,
        }

        await userStorage.setItem('user', this.user)

        return this.user
    }

    /**
     * Load saved user session
     */
    async loadSession() {
        try {
            const user = await userStorage.getItem('user')
            if (user) {
                this.user = user
                return user
            }
            return null
        } catch {
            return null
        }
    }

    /**
     * Clear user session
     */
    async logout() {
        this.user = null
        await userStorage.removeItem('user')
        await userStorage.removeItem('authData')
    }

    /**
     * Get current user
     */
    getUser() {
        return this.user
    }

    /**
     * Upload a file to Telegram
     */
    async uploadFile(file, path = '/') {
        if (!this.user) {
            throw new Error('Not authenticated')
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer()
        const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
            )
        )

        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName: file.name,
                fileData: base64,
                userId: this.user.id,
                path,
            }),
        })

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.error || 'Upload failed')
        }

        // Save to local file index
        const fileInfo = {
            ...result.file,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: Date.now(),
        }

        await this.saveFileToIndex(fileInfo)

        return fileInfo
    }

    /**
     * Download a file from Telegram
     */
    async downloadFile(fileId) {
        const response = await fetch(`${API_BASE}/download?fileId=${fileId}`)

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.error || 'Download failed')
        }

        // Convert base64 to blob
        const byteCharacters = atob(result.data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)

        return new Blob([byteArray])
    }

    /**
     * Delete a file
     */
    async deleteFile(fileId, messageId) {
        const response = await fetch(
            `${API_BASE}/files?messageId=${messageId}&userId=${this.user?.id}`,
            { method: 'DELETE' }
        )

        const result = await response.json()

        if (result.success) {
            await this.removeFileFromIndex(fileId)
        }

        return result.success
    }

    /**
     * Save file info to local index
     */
    async saveFileToIndex(fileInfo) {
        const files = (await fileStorage.getItem('files')) || []
        files.push(fileInfo)
        await fileStorage.setItem('files', files)
        this.files.set(fileInfo.fileId, fileInfo)
    }

    /**
     * Remove file from local index
     */
    async removeFileFromIndex(fileId) {
        const files = (await fileStorage.getItem('files')) || []
        const filtered = files.filter((f) => f.fileId !== fileId)
        await fileStorage.setItem('files', filtered)
        this.files.delete(fileId)
    }

    /**
     * Get all files from local index
     */
    async getFiles(path = '/') {
        const files = (await fileStorage.getItem('files')) || []
        this.files = new Map(files.map((f) => [f.fileId, f]))

        if (path === '/') {
            return files
        }

        return files.filter((f) => f.path === path)
    }

    /**
     * Create a folder (virtual - stored in local index)
     */
    async createFolder(name, parentPath = '/') {
        const folder = {
            id: `folder_${Date.now()}`,
            name,
            path: parentPath,
            isFolder: true,
            createdAt: Date.now(),
        }

        const folders = (await fileStorage.getItem('folders')) || []
        folders.push(folder)
        await fileStorage.setItem('folders', folders)

        return folder
    }

    /**
     * Get all folders
     */
    async getFolders(parentPath = '/') {
        const folders = (await fileStorage.getItem('folders')) || []

        if (parentPath === '/') {
            return folders
        }

        return folders.filter((f) => f.path === parentPath)
    }

    /**
     * Delete a folder
     */
    async deleteFolder(folderId) {
        const folders = (await fileStorage.getItem('folders')) || []
        const filtered = folders.filter((f) => f.id !== folderId)
        await fileStorage.setItem('folders', filtered)
    }
}

const telegramBotService = new TelegramBotService()

export default telegramBotService
export { TelegramBotService }
