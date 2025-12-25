/**
 * TeleDrive - Drop Zone Component
 */

import { useState, useCallback, useRef } from 'react'
import { useFileSystem } from '../context/FileSystemContext'
import './DropZone.css'

function DropZone({ children }) {
    const { uploadFile, uploadProgress } = useFileSystem()
    const [isDragging, setIsDragging] = useState(false)
    const dragCounter = useRef(0)
    const fileInputRef = useRef(null)
    // Check if drag contains only internal TeleDrive files (not external files)
    const isInternalDrag = useCallback((e) => {
        // Check drag types - if it has our custom type, it's internal
        return e.dataTransfer.types.includes('application/teledrive-file')
    }, [])

    const handleDragEnter = useCallback((e) => {
        e.preventDefault()
        // Don't block internal drags - let them reach folder items
        if (isInternalDrag(e)) return

        e.stopPropagation()
        dragCounter.current++
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true)
        }
    }, [isInternalDrag])

    const handleDragLeave = useCallback((e) => {
        e.preventDefault()
        if (isInternalDrag(e)) return

        e.stopPropagation()
        dragCounter.current--
        if (dragCounter.current === 0) {
            setIsDragging(false)
        }
    }, [isInternalDrag])

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        // Don't block internal drags
        if (isInternalDrag(e)) return
        e.stopPropagation()
    }, [isInternalDrag])

    const handleDrop = useCallback(async (e) => {
        e.preventDefault()
        setIsDragging(false)
        dragCounter.current = 0

        // Check if this is an internal TeleDrive file drag (for moving files to folders)
        // If so, don't handle it here - let it bubble to the folder items
        const internalData = e.dataTransfer.getData('application/teledrive-file')
        if (internalData) {
            // This is an internal file move, not an external upload
            return
        }

        // Only handle external file drops (from desktop/file manager)
        const files = Array.from(e.dataTransfer.files)
        if (files.length === 0) return

        e.stopPropagation()

        // Parallel upload with Promise.allSettled for better mobile performance
        const uploadPromises = files.map(file => uploadFile(file))
        const results = await Promise.allSettled(uploadPromises)

        // Log failed uploads for debugging
        const failed = results.filter(r => r.status === 'rejected')
        if (failed.length > 0) {
            console.warn(`${failed.length} of ${files.length} uploads failed:`, failed)
        }
    }, [uploadFile])

    const handleFileSelect = useCallback(async (e) => {
        const files = Array.from(e.target.files || [])

        if (files.length === 0) {
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            return
        }

        // Parallel upload with Promise.allSettled for better mobile performance
        const uploadPromises = files.map(file => uploadFile(file))
        const results = await Promise.allSettled(uploadPromises)

        // Log failed uploads for debugging
        const failed = results.filter(r => r.status === 'rejected')
        if (failed.length > 0) {
            console.warn(`${failed.length} of ${files.length} uploads failed:`, failed)
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [uploadFile])

    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    const activeUploads = Object.entries(uploadProgress)

    return (
        <div
            className="drop-zone-container"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {children}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={handleFileSelect}
            />

            {/* Drag overlay */}
            {isDragging && (
                <div className="drop-overlay">
                    <div className="drop-content">
                        <div className="drop-icon">📤</div>
                        <h3>Drop files here</h3>
                        <p>Files will be uploaded to current folder</p>
                    </div>
                </div>
            )}

            {/* Upload progress */}
            {activeUploads.length > 0 && (
                <div className="upload-progress-container">
                    {activeUploads.map(([id, upload]) => (
                        <div key={id} className={`upload-item ${upload.status}`}>
                            <div className="upload-info">
                                <span className="upload-name">{upload.name}</span>
                                <span className="upload-status">
                                    {upload.status === 'uploading' && `${upload.progress}%`}
                                    {upload.status === 'retrying' && `Yeniden deneniyor (${upload.retries})`}
                                    {upload.status === 'complete' && '✓'}
                                    {upload.status === 'error' && '✗'}
                                </span>
                            </div>
                            <div className="upload-bar">
                                <div
                                    className="upload-progress"
                                    style={{ width: `${upload.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Export file picker trigger
export function useFilePicker() {
    const openFilePicker = useCallback(() => {
        // Find the hidden input and trigger it
        const input = document.querySelector('.drop-zone-container input[type="file"]')
        input?.click()
    }, [])

    return { openFilePicker }
}

export default DropZone
