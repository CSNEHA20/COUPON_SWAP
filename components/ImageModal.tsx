'use client'

import { X, ZoomIn, Download } from 'lucide-react'
import { useEffect } from 'react'

interface ImageModalProps {
    isOpen: boolean
    onClose: () => void
    imageUrl: string
    title: string
}

export default function ImageModal({ isOpen, onClose, imageUrl, title }: ImageModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 p-4 md:p-10"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10 hover:rotate-90"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Header Info */}
            <div className="absolute top-6 left-6 text-white/50 flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                    <ZoomIn className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">{title}</h3>
                    <p className="text-[10px] font-bold">Full Resolution Preview</p>
                </div>
            </div>

            {/* Image Container */}
            <div
                className="relative max-w-5xl w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={imageUrl}
                    alt={title}
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500"
                />

                {/* Visual Guide */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] hidden md:block">
                    Click anywhere outside to close
                </div>
            </div>
        </div>
    )
}
