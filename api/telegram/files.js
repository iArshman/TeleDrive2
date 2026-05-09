/**
 * List/manage files stored in Telegram
 * Uses message history from storage chat
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const STORAGE_CHAT_ID = process.env.TELEGRAM_STORAGE_CHAT_ID

async function getMessages(chatId, limit = 100) {
    const fetch = (await import('node-fetch')).default

    // Note: Bot API doesn't have getHistory, we need to track files in a database
    // For now, we'll use a simple in-memory/localStorage approach on the client
    // This endpoint is a placeholder for future database integration

    return []
}

async function deleteMessage(chatId, messageId) {
    const fetch = (await import('node-fetch')).default

    const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
            }),
        }
    )

    const result = await response.json()
    return result.ok
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    if (!BOT_TOKEN) {
        return res.status(500).json({ error: 'Bot token not configured' })
    }

    const chatId = STORAGE_CHAT_ID || req.query.userId

    if (!chatId) {
        return res.status(400).json({ error: 'No storage chat configured' })
    }

    try {
        if (req.method === 'GET') {
            // List files - client maintains its own index
            // This is a placeholder; real implementation needs database
            return res.status(200).json({
                success: true,
                files: [],
                message: 'File index maintained client-side',
            })
        }

        if (req.method === 'DELETE') {
            const { messageId } = req.query

            if (!messageId) {
                return res.status(400).json({ error: 'messageId required' })
            }

            const deleted = await deleteMessage(chatId, messageId)

            return res.status(200).json({
                success: deleted,
            })
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
        console.error('Files API error:', error)
        return res.status(500).json({ error: error.message || 'Operation failed' })
    }
}
