/**
 * TeleDrive - Client-side Encryption
 * AES-256-GCM encryption for file content
 */

import CryptoJS from 'crypto-js'

// Derive key from password using PBKDF2
function deriveKey(password, salt) {
    return CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 100000,
        hasher: CryptoJS.algo.SHA256
    })
}

// Generate random salt
function generateSalt() {
    return CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Base64)
}

// Generate random IV
function generateIV() {
    return CryptoJS.lib.WordArray.random(12) // 96 bits for GCM
}

/**
 * Encrypt data with password
 * @param {ArrayBuffer|Uint8Array|string} data - Data to encrypt
 * @param {string} password - Encryption password
 * @returns {{ encrypted: string, salt: string, iv: string }}
 */
export function encrypt(data, password) {
    const salt = generateSalt()
    const iv = generateIV()
    const key = deriveKey(password, salt)

    // Convert data to WordArray
    let wordArray
    if (data instanceof ArrayBuffer) {
        wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(data))
    } else if (data instanceof Uint8Array) {
        wordArray = CryptoJS.lib.WordArray.create(data)
    } else if (typeof data === 'string') {
        wordArray = CryptoJS.enc.Utf8.parse(data)
    } else {
        throw new Error('Unsupported data type')
    }

    // Encrypt using AES
    const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    })

    return {
        encrypted: encrypted.toString(),
        salt: salt,
        iv: iv.toString(CryptoJS.enc.Base64)
    }
}

/**
 * Decrypt data with password
 * @param {string} encryptedData - Encrypted data (base64)
 * @param {string} password - Decryption password
 * @param {string} salt - Salt used for encryption
 * @param {string} iv - IV used for encryption
 * @returns {Uint8Array}
 */
export function decrypt(encryptedData, password, salt, iv) {
    const key = deriveKey(password, salt)
    const ivWordArray = CryptoJS.enc.Base64.parse(iv)

    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    })

    // Convert back to Uint8Array
    const words = decrypted.words
    const sigBytes = decrypted.sigBytes
    const bytes = new Uint8Array(sigBytes)

    for (let i = 0; i < sigBytes; i++) {
        bytes[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
    }

    return bytes
}

/**
 * Encrypt a file with password
 * @param {File} file - File to encrypt
 * @param {string} password - Encryption password
 * @returns {Promise<{ encryptedBlob: Blob, metadata: object }>}
 */
export async function encryptFile(file, password) {
    const buffer = await file.arrayBuffer()
    const { encrypted, salt, iv } = encrypt(buffer, password)

    // Create blob from encrypted data
    const encryptedBlob = new Blob([encrypted], { type: 'application/octet-stream' })

    return {
        encryptedBlob,
        metadata: {
            encrypted: true,
            salt,
            iv,
            originalType: file.type,
            originalName: file.name,
            originalSize: file.size
        }
    }
}

/**
 * Decrypt a file with password
 * @param {ArrayBuffer} encryptedBuffer - Encrypted file buffer
 * @param {string} password - Decryption password
 * @param {object} metadata - Encryption metadata
 * @returns {Blob}
 */
export function decryptFile(encryptedBuffer, password, metadata) {
    // Convert buffer to string
    const encryptedString = new TextDecoder().decode(encryptedBuffer)

    const decrypted = decrypt(
        encryptedString,
        password,
        metadata.salt,
        metadata.iv
    )

    return new Blob([decrypted], { type: metadata.originalType || 'application/octet-stream' })
}

/**
 * Hash a password for storage (for verifying encryption password)
 * @param {string} password - Password to hash
 * @returns {string}
 */
export function hashPassword(password) {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Base64)
}

/**
 * Generate a random password
 * @param {number} length - Password length (default: 32)
 * @returns {string}
 */
export function generatePassword(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    const randomValues = new Uint32Array(length)
    crypto.getRandomValues(randomValues)

    for (let i = 0; i < length; i++) {
        password += chars[randomValues[i] % chars.length]
    }

    return password
}

export default {
    encrypt,
    decrypt,
    encryptFile,
    decryptFile,
    hashPassword,
    generatePassword
}
