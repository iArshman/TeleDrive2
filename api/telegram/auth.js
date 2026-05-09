/**
 * Telegram Login Widget Authentication
 * Verifies the hash from Telegram Login Widget
 */

import crypto from 'crypto'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

function verifyTelegramAuth(data) {
    if (!BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN not configured')
    }

    const { hash, ...authData } = data

    // Create data-check-string
    const checkArr = Object.keys(authData)
        .sort()
        .map(key => `${key}=${authData[key]}`)
    const checkString = checkArr.join('\n')

    // Create secret key from bot token
    const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest()

    // Calculate HMAC
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')

    // Verify hash matches
    if (hmac !== hash) {
        return { valid: false, error: 'Invalid authentication hash' }
    }

    // Check auth_date is not too old (24 hours)
    const authDate = parseInt(authData.auth_date, 10)
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 86400) {
        return { valid: false, error: 'Authentication expired' }
    }

    return {
        valid: true,
        user: {
            id: authData.id,
            firstName: authData.first_name,
            lastName: authData.last_name || '',
            username: authData.username || '',
            photoUrl: authData.photo_url || '',
        }
    }
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const result = verifyTelegramAuth(req.body)

        if (!result.valid) {
            return res.status(401).json({ error: result.error })
        }

        return res.status(200).json({
            success: true,
            user: result.user,
        })
    } catch (error) {
        console.error('Auth error:', error)
        return res.status(500).json({ error: error.message || 'Authentication failed' })
    }
}
