/**
 * TeleDrive - Telegram Client Library
 * Handles all Telegram MTProto operations using GramJS
 */

// Use single import from main package which is browser-compatible
import { TelegramClient, Api } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { CustomFile } from 'telegram/client/uploads'

// API Credentials from Telegram App Configuration
const API_ID = 19527810
const API_HASH = '247d76d57082a5f89609e5010283a919'

// Session storage key
const SESSION_KEY = 'teledrive_session'
const ACCOUNTS_KEY = 'teledrive_accounts'

class TelegramService {
    constructor() {
        this.client = null
        this.session = null
        this.currentAccount = null
    }

    /**
     * Initialize the Telegram client
     */
    async init(sessionString = '') {
        this.session = new StringSession(sessionString)

        this.client = new TelegramClient(
            this.session,
            API_ID,
            API_HASH,
            {
                connectionRetries: 5,
                useWSS: true,
                baseLogger: {
                    log: () => { },
                    info: () => { },
                    warn: console.warn,
                    error: console.error,
                    debug: () => { },
                }
            }
        )

        await this.client.connect()
        return this.client
    }

    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        if (!this.client) return false
        try {
            const me = await this.client.getMe()
            return !!me
        } catch {
            return false
        }
    }

    /**
     * Start authentication with phone number
     */
    async sendCode(phoneNumber) {
        if (!this.client) {
            throw new Error('Client not initialized')
        }

        const result = await this.client.sendCode(
            {
                apiId: API_ID,
                apiHash: API_HASH,
            },
            phoneNumber
        )

        return result
    }

    /**
     * Complete authentication with code
     */
    async signIn(phoneNumber, phoneCode, phoneCodeHash) {
        if (!this.client) {
            throw new Error('Client not initialized')
        }

        try {
            const result = await this.client.invoke(
                new Api.auth.SignIn({
                    phoneNumber,
                    phoneCodeHash,
                    phoneCode,
                })
            )

            // Save session
            const sessionString = this.session.save()
            this.saveSession(sessionString)

            return result
        } catch (error) {
            if (error.errorMessage === 'SESSION_PASSWORD_NEEDED') {
                throw { type: '2FA_REQUIRED', error }
            }
            throw error
        }
    }

    /**
     * Complete 2FA authentication
     */
    async signInWith2FA(password) {
        if (!this.client) {
            throw new Error('Client not initialized')
        }

        const result = await this.client.signInWithPassword(
            {
                apiId: API_ID,
                apiHash: API_HASH,
            },
            {
                password: async () => password,
                onError: (err) => { throw err }
            }
        )

        // Save session
        const sessionString = this.session.save()
        this.saveSession(sessionString)

        return result
    }

    /**
     * Get current user info
     */
    async getMe() {
        if (!this.client) return null
        try {
            return await this.client.getMe()
        } catch {
            return null
        }
    }

    /**
     * Get messages from Saved Messages (self chat)
     */
    async getSavedMessages(limit = 100, offsetId = 0) {
        if (!this.client) {
            throw new Error('Client not initialized')
        }

        const messages = await this.client.getMessages('me', {
            limit,
            offsetId,
        })

        return messages
    }

    /**
     * Send a text message to Saved Messages (used for folder markers)
     */
    async sendMessage(text) {
        if (!this.client) {
            throw new Error('Client not initialized')
        }

        const result = await this.client.sendMessage('me', {
            message: text,
        })

        return result
    }

    /**
     * Send a file to Saved Messages
     */
    async sendFile(file, caption = '', progressCallback = null) {
        if (!this.client) {
            throw new Error('Client not initialized')
        }

        // Convert browser File to ArrayBuffer for GramJS
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const result = await this.client.sendFile('me', {
            file: new CustomFile(file.name, file.size, '', buffer),
            caption,
            progressCallback,
            forceDocument: true,
        })

        return result
    }

    /**
     * Send a photo to Saved Messages
     */
    async sendPhoto(file, caption = '', progressCallback = null) {
        if (!this.client) {
            throw new Error('Client not initialized')
        }

        // Convert browser File to ArrayBuffer for GramJS
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const result = await this.client.sendFile('me', {
            file: new CustomFile(file.name, file.size, '', buffer),
            caption,
            progressCallback,
            forceDocument: false,
        })

        return result
    }

    /**
     * Download media from a message
     */
    async downloadMedia(message, progressCallback = null) {
        if (!this.client) {
            throw new Error('Client not initialized')
        }

        const buffer = await this.client.downloadMedia(message, {
            progressCallback,
        })

        return buffer
    }

    /**
     * Get downloadable URL for streaming (for videos)
     */
    async getStreamUrl(message) {
        // GramJS doesn't provide direct streaming URLs
        // We'll need to download in chunks for streaming
        // This will be handled by the streaming component
        return null
    }

    /**
     * Edit message caption (for updating metadata)
     */
    async editMessageCaption(messageId, newCaption) {
        if (!this.client) {
            throw new Error('Client not initialized')
        }

        const result = await this.client.invoke(
            new Api.messages.EditMessage({
                peer: 'me',
                id: messageId,
                message: newCaption,
            })
        )

        return result
    }

    /**
     * Delete messages
     */
    async deleteMessages(messageIds) {
        if (!this.client) {
            throw new Error('Client not initialized')
        }

        const result = await this.client.invoke(
            new Api.messages.DeleteMessages({
                id: messageIds,
                revoke: true,
            })
        )

        return result
    }

    /**
     * Send a text message (for folder markers)
     */
    async sendMessage(text) {
        if (!this.client) {
            throw new Error('Client not initialized')
        }

        const result = await this.client.sendMessage('me', {
            message: text,
        })

        return result
    }

    /**
     * Search messages
     */
    async searchMessages(query, limit = 50) {
        if (!this.client) {
            throw new Error('Client not initialized')
        }

        const result = await this.client.invoke(
            new Api.messages.Search({
                peer: 'me',
                q: query,
                filter: new Api.InputMessagesFilterEmpty(),
                minDate: 0,
                maxDate: 0,
                offsetId: 0,
                addOffset: 0,
                limit,
                maxId: 0,
                minId: 0,
                hash: BigInt(0),
            })
        )

        return result.messages || []
    }

    /**
     * Save session to localStorage
     */
    saveSession(sessionString) {
        try {
            localStorage.setItem(SESSION_KEY, sessionString)
        } catch (e) {
            console.error('Failed to save session:', e)
        }
    }

    /**
     * Load session from localStorage
     */
    loadSession() {
        try {
            return localStorage.getItem(SESSION_KEY) || ''
        } catch {
            return ''
        }
    }

    /**
     * Clear session
     */
    clearSession() {
        try {
            localStorage.removeItem(SESSION_KEY)
        } catch (e) {
            console.error('Failed to clear session:', e)
        }
    }

    /**
     * Log out
     */
    async logout() {
        if (this.client) {
            try {
                await this.client.invoke(new Api.auth.LogOut())
            } catch (e) {
                console.error('Logout error:', e)
            }
        }
        this.clearSession()
        this.client = null
        this.session = null
    }

    /**
     * Get all saved accounts
     */
    getAccounts() {
        try {
            const accounts = localStorage.getItem(ACCOUNTS_KEY)
            return accounts ? JSON.parse(accounts) : []
        } catch {
            return []
        }
    }

    /**
     * Add account to saved accounts
     */
    addAccount(account) {
        const accounts = this.getAccounts()
        const exists = accounts.find(a => a.id === account.id)
        if (!exists) {
            accounts.push(account)
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
        }
    }

    /**
     * Remove account from saved accounts
     */
    removeAccount(accountId) {
        const accounts = this.getAccounts()
        const filtered = accounts.filter(a => a.id !== accountId)
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filtered))
    }

    /**
     * Switch to a different account
     */
    async switchAccount(sessionString) {
        await this.logout()
        await this.init(sessionString)
        return await this.isAuthenticated()
    }
}

// Singleton instance
const telegramService = new TelegramService()

export default telegramService
export { TelegramService, API_ID, API_HASH }
