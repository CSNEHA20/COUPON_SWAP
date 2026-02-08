'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Star, Loader2, CheckCircle2 } from 'lucide-react'

interface ReviewModalProps {
    isOpen: boolean
    onClose: () => void
    transactionId: string
    sellerId: string
    couponId: string
    couponTitle: string
}

export default function ReviewModal({
    isOpen,
    onClose,
    transactionId,
    sellerId,
    couponId,
    couponTitle
}: ReviewModalProps) {
    const [rating, setRating] = useState(0)
    const [hover, setHover] = useState(0)
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!isOpen) {
            setRating(0)
            setComment('')
            setSubmitted(false)
            setError(null)
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) {
            setError('Please select a rating')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error: insertError } = await supabase.from('reviews').insert({
                transaction_id: transactionId,
                reviewer_id: user.id,
                seller_id: sellerId,
                coupon_id: couponId,
                rating,
                comment: comment.trim() || null
            })

            if (insertError) {
                if (insertError.code === '23505') {
                    throw new Error('You have already reviewed this transaction')
                }
                throw insertError
            }

            setSubmitted(true)
            setTimeout(() => {
                onClose()
            }, 2000)
        } catch (err: any) {
            console.error('Error submitting review:', err)
            setError(err.message || 'Failed to submit review')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8">
                    {submitted ? (
                        <div className="text-center py-8 animate-in zoom-in duration-500">
                            <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-10 h-10 text-green-400" />
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Review Submitted!</h3>
                            <p className="text-gray-400">Thanks for sharing your feedback.</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-black text-white mb-2">Rate your purchase</h2>
                            <p className="text-gray-400 text-sm mb-8">
                                How was your experience with <span className="text-purple-400 font-bold">{couponTitle}</span>?
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Star Rating */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHover(star)}
                                                onMouseLeave={() => setHover(0)}
                                                className="p-1 transition-transform active:scale-90"
                                            >
                                                <Star
                                                    className={`w-10 h-10 transition-colors duration-200 ${(hover || rating) >= star
                                                            ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]'
                                                            : 'text-white/10 hover:text-white/20'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                        {rating === 1 && 'Terrible'}
                                        {rating === 2 && 'Poor'}
                                        {rating === 3 && 'Good'}
                                        {rating === 4 && 'Great'}
                                        {rating === 5 && 'Excellent'}
                                        {!rating && 'Select a rating'}
                                    </span>
                                </div>

                                {/* Comment */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest px-1">
                                        Your Comment (Optional)
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value.slice(0, 500))}
                                            placeholder="What did you like or dislike?"
                                            rows={4}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none transition-all resize-none"
                                        />
                                        <div className="absolute bottom-3 right-4 text-[10px] font-bold text-gray-600">
                                            {comment.length}/500
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-red-400 text-xs font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20 text-center">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || rating === 0}
                                    className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-white/5 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Submit Review'
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
