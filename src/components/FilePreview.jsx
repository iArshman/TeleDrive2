/**
 * TeleDrive - File Preview Component
 * Handles image lightbox, video player, and document preview
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useFileSystem } from '../context/FileSystemContext'
import { formatSize, formatDate } from '../lib/virtualFS'
import './FilePreview.css'

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
)

const DownloadIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
)

const ZoomInIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7H9v2H7v1h2v2h1v-2h2V9h-2V7z" />
    </svg>
)

const ZoomOutIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7V9z" />
    </svg>
)

function ImagePreview({ file, src }) {
    const [zoom, setZoom] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const lastPosition = useRef({ x: 0, y: 0 })

    const handleWheel = (e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)))
    }

    const handleMouseDown = (e) => {
        if (zoom > 1) {
            setIsDragging(true)
            lastPosition.current = { x: e.clientX, y: e.clientY }
        }
    }

    const handleMouseMove = (e) => {
        if (isDragging) {
            const deltaX = e.clientX - lastPosition.current.x
            const deltaY = e.clientY - lastPosition.current.y
            setPosition(prev => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY
            }))
            lastPosition.current = { x: e.clientX, y: e.clientY }
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.25))
    const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.25))
    const handleReset = () => {
        setZoom(1)
        setPosition({ x: 0, y: 0 })
    }

    return (
        <div className="preview-content image-preview">
            <div
                className="image-container"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
                <img
                    src={src}
                    alt={file.name}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease'
                    }}
                    draggable={false}
                />
            </div>
            <div className="zoom-controls">
                <button className="btn-icon" onClick={handleZoomOut}>
                    <ZoomOutIcon />
                </button>
                <button className="zoom-reset" onClick={handleReset}>
                    {Math.round(zoom * 100)}%
                </button>
                <button className="btn-icon" onClick={handleZoomIn}>
                    <ZoomInIcon />
                </button>
            </div>
        </div>
    )
}

function VideoPreview({ file, src }) {
    const videoRef = useRef(null)

    return (
        <div className="preview-content video-preview">
            <video
                ref={videoRef}
                src={src}
                controls
                autoPlay
                className="video-player"
            >
                Your browser does not support video playback.
            </video>
        </div>
    )
}

function AudioPreview({ file, src }) {
    return (
        <div className="preview-content audio-preview">
            <div className="audio-icon">🎵</div>
            <h3>{file.name}</h3>
            <audio src={src} controls autoPlay className="audio-player" />
        </div>
    )
}

function DocumentPreview({ file, src }) {
    const [text, setText] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (file.mimeType === 'application/pdf') {
            setIsLoading(false)
        } else if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json') {
            fetch(src)
                .then(res => res.text())
                .then(content => {
                    setText(content)
                    setIsLoading(false)
                })
                .catch(() => setIsLoading(false))
        } else {
            setIsLoading(false)
        }
    }, [src, file.mimeType])

    if (isLoading) {
        return (
            <div className="preview-content document-preview loading">
                <div className="spinner"></div>
                <p>Loading document...</p>
            </div>
        )
    }

    if (file.mimeType === 'application/pdf') {
        return (
            <div className="preview-content pdf-preview">
                <iframe src={src} title={file.name} />
            </div>
        )
    }

    if (text) {
        return (
            <div className="preview-content text-preview">
                <pre>{text}</pre>
            </div>
        )
    }

    return (
        <div className="preview-content document-preview unsupported">
            <div className="unsupported-icon">📄</div>
            <h3>{file.name}</h3>
            <p>Preview not available for this file type</p>
            <p className="file-type">{file.mimeType}</p>
        </div>
    )
}

function FilePreview({ file, onClose }) {
    const { downloadFile } = useFileSystem()
    const [src, setSrc] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [downloadProgress, setDownloadProgress] = useState(0)

    useEffect(() => {
        loadFile()

        // Close on Escape
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [file.id])

    const loadFile = async () => {
        setIsLoading(true)
        try {
            const buffer = await downloadFile(file.id, (progress) => {
                setDownloadProgress(Math.round(progress * 100))
            })

            if (buffer) {
                const blob = new Blob([buffer], { type: file.mimeType })
                const url = URL.createObjectURL(blob)
                setSrc(url)
            }
        } catch (err) {
            console.error('Preview error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownload = async () => {
        if (src) {
            const a = document.createElement('a')
            a.href = src
            a.download = file.name
            a.click()
        }
    }

    // Cleanup URL on unmount
    useEffect(() => {
        return () => {
            if (src) {
                URL.revokeObjectURL(src)
            }
        }
    }, [src])

    const renderPreview = () => {
        if (isLoading) {
            return (
                <div className="preview-loading">
                    <div className="spinner"></div>
                    <p>Loading... {downloadProgress}%</p>
                    <div className="progress-bar">
                        <div className="progress" style={{ width: `${downloadProgress}%` }}></div>
                    </div>
                </div>
            )
        }

        if (!src) {
            return (
                <div className="preview-error">
                    <p>Failed to load preview</p>
                </div>
            )
        }

        switch (file.fileType) {
            case 'image':
                return <ImagePreview file={file} src={src} />
            case 'video':
                return <VideoPreview file={file} src={src} />
            case 'audio':
                return <AudioPreview file={file} src={src} />
            case 'pdf':
            case 'document':
            case 'text':
                return <DocumentPreview file={file} src={src} />
            default:
                return (
                    <div className="preview-content unsupported">
                        <div className="unsupported-icon">📄</div>
                        <h3>{file.name}</h3>
                        <p>Preview not available</p>
                    </div>
                )
        }
    }

    return (
        <div className="file-preview-overlay" onClick={onClose}>
            <div className="preview-container" onClick={e => e.stopPropagation()}>
                <div className="preview-header">
                    <h2 className="preview-title">{file.name}</h2>
                    <div className="preview-meta">
                        <span>{formatSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.modifiedAt)}</span>
                    </div>
                    <div className="preview-actions">
                        <button className="btn-icon" onClick={handleDownload} title="Download">
                            <DownloadIcon />
                        </button>
                        <button className="btn-icon" onClick={onClose} title="Close">
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <div className="preview-body">
                    {renderPreview()}
                </div>
            </div>
        </div>
    )
}

export default FilePreview
