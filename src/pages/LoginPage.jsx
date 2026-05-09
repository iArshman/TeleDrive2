/**
 * TeleDrive - Login Page
 * Uses Telegram Login Widget for authentication
 */

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

// Bot username for Telegram Login Widget - set this in your .env
const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'YourBotUsername'

function LoginPage() {
    const { isLoading, error, loginWithTelegram, setError } = useAuth()
    const [widgetLoaded, setWidgetLoaded] = useState(false)
    const widgetRef = useRef(null)

    // Load Telegram Login Widget script
    useEffect(() => {
        // Create callback function for Telegram
        window.onTelegramAuth = async (user) => {
            // user contains: id, first_name, last_name, username, photo_url, auth_date, hash
            await loginWithTelegram(user)
        }

        // Load the widget script
        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-widget.js?22'
        script.async = true
        script.setAttribute('data-telegram-login', BOT_USERNAME)
        script.setAttribute('data-size', 'large')
        script.setAttribute('data-radius', '8')
        script.setAttribute('data-onauth', 'onTelegramAuth(user)')
        script.setAttribute('data-request-access', 'write')

        script.onload = () => setWidgetLoaded(true)
        script.onerror = () => setError('Failed to load Telegram login widget')

        if (widgetRef.current) {
            widgetRef.current.innerHTML = ''
            widgetRef.current.appendChild(script)
        }

        return () => {
            delete window.onTelegramAuth
        }
    }, [loginWithTelegram, setError])

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">
                        <svg viewBox="0 0 100 100" className="logo-icon">
                            <defs>
                                <linearGradient id="teleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#0088cc' }} />
                                    <stop offset="100%" style={{ stopColor: '#00a8e8' }} />
                                </linearGradient>
                            </defs>
                            <circle cx="50" cy="50" r="45" fill="url(#teleGrad)" />
                            <path d="M30 50 L45 50 L50 35 L55 60 L60 50 L70 50" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M25 65 L75 65" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
                            <path d="M30 72 L70 72" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
                        </svg>
                    </div>
                    <h1>TeleDrive</h1>
                    <p className="login-subtitle">Cloud storage powered by Telegram</p>
                </div>

                {error && (
                    <div className="login-error">
                        <span className="error-icon">&#9888;</span>
                        <span>{error}</span>
                        <button className="error-close" onClick={() => setError(null)}>&#215;</button>
                    </div>
                )}

                <div className="telegram-login-section">
                    <p className="login-instruction">
                        Click the button below to login with your Telegram account
                    </p>

                    {/* Telegram Login Widget container */}
                    <div className="telegram-widget-wrapper">
                        {isLoading && (
                            <div className="widget-loading">
                                <span className="spinner"></span>
                                <span>Authenticating...</span>
                            </div>
                        )}

                        {!isLoading && (
                            <div
                                ref={widgetRef}
                                className="telegram-widget"
                            />
                        )}

                        {!widgetLoaded && !isLoading && (
                            <div className="widget-placeholder">
                                <span className="spinner"></span>
                                <span>Loading Telegram Login...</span>
                            </div>
                        )}
                    </div>

                    <div className="login-features">
                        <div className="feature">
                            <span className="feature-icon">&#128274;</span>
                            <span>Secure OAuth login</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">&#128247;</span>
                            <span>No password required</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">&#9889;</span>
                            <span>Instant access</span>
                        </div>
                    </div>
                </div>

                <div className="login-footer">
                    <p>Your files are stored securely via Telegram Bot</p>
                    <p className="security-note">Powered by Telegram Bot API</p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
