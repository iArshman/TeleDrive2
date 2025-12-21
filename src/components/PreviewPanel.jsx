/**
 * TeleDrive - Preview Panel Component
 * Shows file preview and metadata in a side panel
 */

import { useState, useEffect, useCallback } from 'react'
import { useFileSystem } from '../context/FileSystemContext'
import { formatSize, formatDate } from '../lib/virtualFS'
import './PreviewPanel.css'

function PreviewPanel({ file, onClose }) {
    const { downloadFile } = useFileSystem()
    const [previewUrl, setPreviewUrl] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    // Load preview when file changes
    useEffect(() => {
        if (!file) {
            setPreviewUrl(null)
            return
        }

        // Only load preview for images and videos
        if (!['image', 'video'].includes(file.fileType)) {
            setPreviewUrl(null)
            return
        }

        let cancelled = false

        const loadPreview = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const buffer = await downloadFile(file.id)
                if (cancelled) return

                if (buffer) {
                    const blob = new Blob([buffer], { type: file.mimeType || 'application/octet-stream' })
                    const url = URL.createObjectURL(blob)
                    setPreviewUrl(url)
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Preview load error:', err)
                    setError('Failed to load preview')
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }

        loadPreview()

        return () => {
            cancelled = true
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [file?.id])

    // Cleanup URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    if (!file) return null

    const isImage = file.fileType === 'image'
    const isVideo = file.fileType === 'video'
    const isAudio = file.fileType === 'audio'

    return (
        <div className="preview-panel">
            <div className="preview-header">
                <h3>Preview</h3>
                <button className="preview-close" onClick={onClose}>
                    ✕
                </button>
            </div>

            <div className="preview-content">
                {/* Preview Area */}
                <div className="preview-media">
                    {isLoading && (
                        <div className="preview-loading">
                            <div className="spinner"></div>
                            <span>Loading preview...</span>
                        </div>
                    )}

                    {error && (
                        <div className="preview-error">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {!isLoading && !error && previewUrl && isImage && (
                        <img
                            src={previewUrl}
                            alt={file.name}
                            className="preview-image"
                        />
                    )}

                    {!isLoading && !error && previewUrl && isVideo && (
                        <video
                            src={previewUrl}
                            controls
                            className="preview-video"
                        />
                    )}

                    {!isLoading && !error && previewUrl && isAudio && (
                        <div className="preview-audio-container">
                            <div className="audio-icon">🎵</div>
                            <audio src={previewUrl} controls className="preview-audio" />
                        </div>
                    )}

                    {!isLoading && !previewUrl && !['image', 'video', 'audio'].includes(file.fileType) && (
                        <div className="preview-placeholder">
                            <div className="placeholder-icon">📄</div>
                            <span>No preview available</span>
                        </div>
                    )}
                </div>

                {/* File Info */}
                <div className="preview-info">
                    <div className="info-item">
                        <span className="info-label">Name</span>
                        <span className="info-value" title={file.name}>{file.name}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Type</span>
                        <span className="info-value">{file.fileType}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PreviewPanel
