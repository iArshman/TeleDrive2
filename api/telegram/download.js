/**
 * Download file from Telegram via Bot API
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function getFile(fileId) {
    const fetch = (await import('node-fetch')).default

    const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    )

    const result = await response.json()
    if (!result.ok) {
        throw new Error(result.description || 'Failed to get file info')
    }

    return result.result
}

async function downloadFile(filePath) {
    const fetch = (await import('node-fetch')).default

    const response = await fetch(
        `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`
    )

    if (!response.ok) {
        throw new Error('Failed to download file')
    }

    return response.buffer()
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!BOT_TOKEN) {
        return res.status(500).json({ error: 'Bot token not configured' })
    }

    try {
        const { fileId } = req.query

        if (!fileId) {
            return res.status(400).json({ error: 'fileId required' })
        }

        // Get file path from Telegram
        const fileInfo = await getFile(fileId)

        // Download the file
        const fileBuffer = await downloadFile(fileInfo.file_path)

        // Return as base64 for frontend consumption
        return res.status(200).json({
            success: true,
            data: fileBuffer.toString('base64'),
            size: fileBuffer.length,
        })
    } catch (error) {
        console.error('Download error:', error)
        return res.status(500).json({ error: error.message || 'Download failed' })
    }
}
