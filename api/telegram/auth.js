/**
 * Telegram Bot Code-based Authentication
 * Verifies auth codes sent by the Telegram bot
 * 
 * The bot stores auth codes in a simple in-memory map (or you can use Redis/DB).
 * For this demo, we use a static map that the bot webhook would update.
 */

// In-memory auth codes store (in production, use Redis or database)
// Format: { code: { userId, firstName, lastName, username, expiresAt } }
const authCodes = new Map()

// Cleanup expired codes periodically
setInterval(() => {
    const now = Date.now()
    for (const [code, data] of authCodes) {
        if (data.expiresAt < now) {
            authCodes.delete(code)
        }
    }
}, 60000) // Clean every minute

/**
 * Store an auth code (called by bot webhook)
 */
export function storeAuthCode(code, userData) {
    authCodes.set(code.toUpperCase(), {
        ...userData,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Verify and consume an auth code
 */
function verifyAuthCode(code) {
    const upperCode = code.toUpperCase()
    const data = authCodes.get(upperCode)

    if (!data) {
        return { valid: false, error: 'Invalid or expired code' }
    }

    if (data.expiresAt < Date.now()) {
        authCodes.delete(upperCode)
        return { valid: false, error: 'Code expired. Please request a new one.' }
    }

    // Consume the code (one-time use)
    authCodes.delete(upperCode)

    return {
        valid: true,
        user: {
            id: data.userId,
            firstName: data.firstName,
            lastName: data.lastName || '',
            username: data.username || '',
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
        const { code } = req.body

        if (!code) {
            return res.status(400).json({ error: 'Authentication code required' })
        }

        const result = verifyAuthCode(code)

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

// Export for bot webhook to use
export { authCodes }
