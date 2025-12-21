// Buffer polyfill MUST be imported first before anything else
import { Buffer } from 'buffer'

// Make Buffer globally available
window.Buffer = Buffer
globalThis.Buffer = Buffer

// Now import React and other modules
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>,
)
