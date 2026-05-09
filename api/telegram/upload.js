/**
 * Upload file to Telegram via Bot API
 * Stores files in user's chat with the bot (or a dedicated channel)
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const STORAGE_CHAT_ID = process.env.TELEGRAM_STORAGE_CHAT_ID // Channel/group for storage

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
}

async function sendDocument(chatId, fileBuffer, fileName, caption = '') {
    const FormData = (await import('form-data')).default
    const fetch = (await import('node-fetch')).default

    const form = new FormData()
    form.append('chat_id', chatId)
    form.append('document', fileBuffer, { filename: fileName })
    if (caption) {
        form.append('caption', caption)
    }

    const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
        {
            method: 'POST',
            body: form,
        }
    )

    const result = await response.json()
    if (!result.ok) {
        throw new Error(result.description || 'Failed to upload file')
    }

    return result.result
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!BOT_TOKEN) {
        return res.status(500).json({ error: 'Bot token not configured' })
    }

    try {
        const { fileName, fileData, userId, path = '/' } = req.body

        if (!fileName || !fileData) {
            return res.status(400).json({ error: 'fileName and fileData required' })
        }

        // Decode base64 file data
        const fileBuffer = Buffer.from(fileData, 'base64')

        // Use storage channel if configured, otherwise user's chat
        const chatId = STORAGE_CHAT_ID || userId

        if (!chatId) {
            return res.status(400).json({ error: 'No storage destination configured' })
        }

        // Caption includes metadata for retrieval
        const caption = JSON.stringify({
            userId,
            path,
            fileName,
            uploadedAt: Date.now(),
        })

        const message = await sendDocument(chatId, fileBuffer, fileName, caption)

        return res.status(200).json({
            success: true,
            file: {
                id: message.message_id,
                fileId: message.document.file_id,
                fileUniqueId: message.document.file_unique_id,
                fileName: message.document.file_name,
                fileSize: message.document.file_size,
                mimeType: message.document.mime_type,
                path,
            },
        })
    } catch (error) {
        console.error('Upload error:', error)
        return res.status(500).json({ error: error.message || 'Upload failed' })
    }
}
