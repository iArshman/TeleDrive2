/**
 * Telegram Bot Webhook
 * Receives updates from Telegram and handles /start commands
 */

import { storeAuthCode } from './auth.js'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

/**
 * Send a message to a Telegram user
 */
async function sendMessage(chatId, text, options = {}) {
    const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                ...options,
            }),
        }
    )
    return response.json()
}

/**
 * Generate a random auth code
 */
function generateAuthCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!BOT_TOKEN) {
        console.error('TELEGRAM_BOT_TOKEN not configured')
        return res.status(500).json({ error: 'Bot not configured' })
    }

    try {
        const update = req.body

        // Handle message updates
        if (update.message) {
            const message = update.message
            const chatId = message.chat.id
            const text = message.text || ''
            const user = message.from

            // Handle /start command (with or without auth parameter)
            if (text.startsWith('/start')) {
                const parts = text.split(' ')
                const param = parts[1] || ''

                // Generate auth code for this user
                const authCode = generateAuthCode()

                // Store the code linked to this user
                storeAuthCode(authCode, {
                    userId: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name || '',
                    username: user.username || '',
                })

                // Send welcome message with the code
                const welcomeMessage = `
<b>Welcome to TeleDrive!</b>

Your login code is:

<code>${authCode}</code>

Copy this code and paste it in the TeleDrive app to login.

<i>This code expires in 5 minutes.</i>
                `.trim()

                await sendMessage(chatId, welcomeMessage)
            }

            // Handle /code command to get a new code
            else if (text === '/code') {
                const authCode = generateAuthCode()

                storeAuthCode(authCode, {
                    userId: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name || '',
                    username: user.username || '',
                })

                await sendMessage(chatId, `Your new login code:\n\n<code>${authCode}</code>\n\n<i>Expires in 5 minutes.</i>`)
            }

            // Handle /help command
            else if (text === '/help') {
                await sendMessage(chatId, `
<b>TeleDrive Bot Commands:</b>

/start - Get a login code
/code - Get a new login code
/help - Show this help message

<b>How to use:</b>
1. Use /start or /code to get a login code
2. Copy the code
3. Paste it in the TeleDrive web app
4. You're logged in!
                `.trim())
            }
        }

        // Always respond with 200 to acknowledge receipt
        return res.status(200).json({ ok: true })
    } catch (error) {
        console.error('Webhook error:', error)
        // Still return 200 to prevent Telegram from retrying
        return res.status(200).json({ ok: true })
    }
}
