/**
 * TeleDrive - Drive Page (Main File Manager)
 */

import { useState, useCallback } from 'react'
import { useFileSystem } from '../context/FileSystemContext'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import FileGrid from '../components/FileGrid'
import DropZone from '../components/DropZone'
import FilePreview from '../components/FilePreview'
import PreviewPanel from '../components/PreviewPanel'
import './DrivePage.css'

function NewFolderModal({ isOpen, onClose, onCreate }) {
    const [name, setName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsCreating(true)
        await onCreate(name.trim())
        setName('')
        setIsCreating(false)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content new-folder-modal" onClick={e => e.stopPropagation()}>
                <h2>New Folder</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Folder name"
                        autoFocus
                        disabled={isCreating}
                    />
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={!name.trim() || isCreating}>
                            {isCreating ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function DrivePage() {
    const { isLoading, error, createFolder } = useFileSystem()
    const [showNewFolderModal, setShowNewFolderModal] = useState(false)
    const [previewFile, setPreviewFile] = useState(null)
    const [selectedFile, setSelectedFile] = useState(null)

    const handleUpload = useCallback(() => {
        // Trigger file input click via DropZone
        const input = document.querySelector('.drop-zone-container input[type="file"]')
        input?.click()
    }, [])

    // Single click - show side panel preview
    const handleSelectFile = useCallback((file) => {
        if (file && file.type !== 'folder') {
            setSelectedFile(file)
        } else {
            setSelectedFile(null)
        }
    }, [])

    // Double click - open full preview modal
    const handleOpenFile = useCallback((file) => {
        if (file.type !== 'folder') {
            setPreviewFile(file)
        }
    }, [])

    const handleNewFolder = useCallback(() => {
        setShowNewFolderModal(true)
    }, [])

    return (
        <div className="drive-page no-sidebar">
            <main className={`drive-main ${selectedFile ? 'with-preview' : ''}`}>
                <Header onUpload={handleUpload} onNewFolder={handleNewFolder} />

                <div className="drive-content">
                    <DropZone>
                        {isLoading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Loading files...</p>
                            </div>
                        ) : error ? (
                            <div className="error-container">
                                <p className="error-message">{error}</p>
                                <button className="btn-primary" onClick={() => window.location.reload()}>
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <FileGrid onOpenFile={handleOpenFile} onSelectFile={handleSelectFile} />
                        )}
                    </DropZone>

                    {selectedFile && (
                        <PreviewPanel
                            file={selectedFile}
                            onClose={() => setSelectedFile(null)}
                        />
                    )}
                </div>
            </main>

            <NewFolderModal
                isOpen={showNewFolderModal}
                onClose={() => setShowNewFolderModal(false)}
                onCreate={createFolder}
            />

            {previewFile && (
                <FilePreview
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                    onNavigate={(file) => setPreviewFile(file)}
                />
            )}
        </div>
    )
}

export default DrivePage
