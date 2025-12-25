/**
 * TeleDrive - File Preview Component
 * Handles image lightbox, video player, and document preview
 * With navigation arrows and mobile touch gestures
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

const ChevronLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
)

const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
)

function ImagePreview({ file, src }) {
    const [zoom, setZoom] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const lastPosition = useRef({ x: 0, y: 0 })
    
    // Touch gesture state
    const [initialDistance, setInitialDistance] = useState(0)
    const [initialZoom, setInitialZoom] = useState(1)
    const lastTouchPosition = useRef({ x: 0, y: 0 })
    const isTouchDragging = useRef(false)

    // Calculate distance between two touch points
    const getDistance = (touch1, touch2) => {
        const dx = touch1.clientX - touch2.clientX
        const dy = touch1.clientY - touch2.clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    // Mouse wheel zoom
    const handleWheel = (e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoom(prev => Math.max(0.5, Math.min(5, prev + delta)))
    }

    // Mouse drag handlers
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

    // Touch handlers for pinch-to-zoom and pan
    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            // Pinch start
            const distance = getDistance(e.touches[0], e.touches[1])
            setInitialDistance(distance)
            setInitialZoom(zoom)
            isTouchDragging.current = false
        } else if (e.touches.length === 1 && zoom > 1) {
            // Pan start (only when zoomed in)
            isTouchDragging.current = true
            lastTouchPosition.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            }
        }
    }

    const handleTouchMove = (e) => {
        if (e.touches.length === 2) {
            // Pinch zoom
            e.preventDefault()
            const distance = getDistance(e.touches[0], e.touches[1])
            const scale = distance / initialDistance
            const newZoom = Math.max(0.5, Math.min(5, initialZoom * scale))
            setZoom(newZoom)
        } else if (e.touches.length === 1 && isTouchDragging.current && zoom > 1) {
            // Pan move
            e.preventDefault()
            const touch = e.touches[0]
            const deltaX = touch.clientX - lastTouchPosition.current.x
            const deltaY = touch.clientY - lastTouchPosition.current.y
            setPosition(prev => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY
            }))
            lastTouchPosition.current = {
                x: touch.clientX,
                y: touch.clientY
            }
        }
    }

    const handleTouchEnd = () => {
        isTouchDragging.current = false
        setInitialDistance(0)
    }

    const handleZoomIn = () => setZoom(prev => Math.min(5, prev + 0.25))
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
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
            >
                <img
                    src={src}
                    alt={file.name}
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        transition: isDragging || isTouchDragging.current ? 'none' : 'transform 0.2s ease'
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

function FilePreview({ file, onClose, allFiles, onNavigate }) {
    const { downloadFile, currentFiles } = useFileSystem()
    const [src, setSrc] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [downloadProgress, setDownloadProgress] = useState(0)
    
    // Get navigable files (images and videos from current folder)
    const navigableFiles = (allFiles || currentFiles()).filter(f => 
        f.type !== 'folder' && ['image', 'video'].includes(f.fileType)
    )
    const currentIndex = navigableFiles.findIndex(f => f.id === file.id)
    const hasPrev = currentIndex > 0
    const hasNext = currentIndex < navigableFiles.length - 1 && currentIndex !== -1

    useEffect(() => {
        loadFile()

        // Close on Escape, navigate with arrow keys
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
            else if (e.key === 'ArrowLeft' && hasPrev) navigateToPrev()
            else if (e.key === 'ArrowRight' && hasNext) navigateToNext()
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [file.id])

    const loadFile = async () => {
        setIsLoading(true)
        setDownloadProgress(0)
        setSrc(null)
        
        try {
            const buffer = await downloadFile(file.id, (progress) => {
                // GramJS sends progress as a value between 0 and 1, or as bytes
                // We need to handle both cases and clamp to 0-100
                let percent = 0
                if (typeof progress === 'number') {
                    if (progress <= 1) {
                        // Already normalized 0-1
                        percent = Math.round(progress * 100)
                    } else {
                        // Might be bytes - just show as indeterminate
                        percent = Math.min(99, Math.round(progress))
                    }
                }
                setDownloadProgress(Math.max(0, Math.min(100, percent)))
            })

            if (buffer) {
                const blob = new Blob([buffer], { type: file.mimeType })
                const url = URL.createObjectURL(blob)
                setSrc(url)
                setDownloadProgress(100)
            }
        } catch (err) {
            console.error('Preview error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const navigateToPrev = () => {
        if (hasPrev) {
            const prevFile = navigableFiles[currentIndex - 1]
            if (onNavigate) {
                onNavigate(prevFile)
            }
        }
    }

    const navigateToNext = () => {
        if (hasNext) {
            const nextFile = navigableFiles[currentIndex + 1]
            if (onNavigate) {
                onNavigate(nextFile)
            }
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
                    <p>Yükleniyor... {downloadProgress}%</p>
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

    // Check if current file is navigable (image or video)
    const isNavigable = ['image', 'video'].includes(file.fileType)

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
                        <button className="btn-icon" onClick={handleDownload} title="İndir">
                            <DownloadIcon />
                        </button>
                        <button className="btn-icon" onClick={onClose} title="Kapat">
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <div className="preview-body">
                    {/* Left Navigation Arrow */}
                    {isNavigable && hasPrev && (
                        <button 
                            className="nav-arrow nav-arrow-left" 
                            onClick={(e) => { e.stopPropagation(); navigateToPrev(); }}
                            title="Önceki"
                        >
                            <ChevronLeftIcon />
                        </button>
                    )}

                    {renderPreview()}

                    {/* Right Navigation Arrow */}
                    {isNavigable && hasNext && (
                        <button 
                            className="nav-arrow nav-arrow-right" 
                            onClick={(e) => { e.stopPropagation(); navigateToNext(); }}
                            title="Sonraki"
                        >
                            <ChevronRightIcon />
                        </button>
                    )}
                </div>

                {/* Navigation indicator */}
                {isNavigable && navigableFiles.length > 1 && (
                    <div className="preview-nav-indicator">
                        {currentIndex + 1} / {navigableFiles.length}
                    </div>
                )}
            </div>
        </div>
    )
}

export default FilePreview
