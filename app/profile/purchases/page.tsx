'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    ShoppingBag,
    Calendar,
    Eye,
    Copy,
    Check,
    ArrowLeft,
    Loader2,
    Clock,
    X,
    CreditCard,
    Tag,
    Star
} from 'lucide-react'
import Link from 'next/link'
import { Coupon } from '@/types'
import ReviewModal from '@/components/ReviewModal'

export default function PurchasesPage() {
    const router = useRouter()
    const [purchases, setPurchases] = useState<(Coupon & { transaction?: { id: string }, existing_review?: { id: string } })[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    const [revealCode, setRevealCode] = useState<{ id: string, code: string } | null>(null)
    const [copied, setCopied] = useState(false)
    const [selectedForReview, setSelectedForReview] = useState<any>(null)

    useEffect(() => {
        const fetchPurchases = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }
                setUser(user)

                const { data, error } = await supabase
                    .from('coupons')
                    .select(`
                        *,
                        transaction:transactions!coupon_id(id),
                        existing_review:reviews!coupon_id(id)
                    `)
                    .eq('buyer_id', user.id)
                    .eq('is_sold', true)
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Supabase error details:', JSON.stringify(error, null, 2))
                    throw error
                }
                setPurchases(data || [])
            } catch (err: any) {
                console.error('Error fetching purchases:', err.message || err)
            } finally {
                setLoading(false)
            }
        }

        fetchPurchases()
    }, [router])

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const isExpired = (date: string | null | undefined) => {
        if (!date) return false
        return new Date(date) < new Date()
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-slate-950 p-4 md:p-8 text-white">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div>
                        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4 group">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Profile
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <ShoppingBag className="h-8 w-8 text-purple-400" />
                            My Purchases
                        </h1>
                        <p className="text-gray-400 mt-1">Access your acquired coupon codes and vouchers</p>
                    </div>
                    <Link href="/" className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all">
                        Marketplace
                    </Link>
                </div>

                {purchases.length === 0 ? (
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-16 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/50 text-gray-400 mb-6">
                            <ShoppingBag className="h-10 w-10" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white">No purchases yet</h3>
                        <p className="text-gray-400 mt-2 max-w-sm mx-auto">
                            You haven't purchased any coupons. Visit the marketplace to find great deals!
                        </p>
                        <Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-8 py-3 text-sm font-bold text-white hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/30">
                            Browse Marketplace
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {purchases.map((coupon: any) => {
                            const expired = isExpired(coupon.expiry_date);
                            const cardBorderClass = expired ? 'border-red-500/20 grayscale-[0.5]' : 'border-white/10 hover:border-purple-500/30';

                            return (
                                <div
                                    key={coupon.id}
                                    className={`relative group rounded-2xl bg-white/5 backdrop-blur-md border transition-all overflow-hidden flex flex-col ${cardBorderClass}`}
                                >
                                    {expired && (
                                        <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center pointer-events-none">
                                            <span className="rotate-[-12deg] px-4 py-1.5 bg-red-600/90 text-white font-bold text-xs tracking-widest border-2 border-red-400 rounded-md shadow-2xl uppercase">
                                                Expired
                                            </span>
                                        </div>
                                    )}

                                    <div className="h-32 w-full bg-slate-800 relative">
                                        {coupon.image_url ? (
                                            <img src={coupon.image_url} alt={coupon.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-indigo-900/40" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent" />
                                        <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider border border-white/10">
                                            {coupon.category || 'Other'}
                                        </span>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col space-y-3">
                                        <h3 className="font-bold text-lg line-clamp-1 leading-tight group-hover:text-purple-400 transition-colors">
                                            {coupon.title}
                                        </h3>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center text-xs text-gray-400">
                                                <Calendar className="w-3.5 h-3.5 mr-2 shrink-0" />
                                                Purchased on {new Date(coupon.created_at).toLocaleDateString()}
                                            </div>

                                            {coupon.expiry_date && (
                                                <div className={`flex items-center text-xs ${expired ? 'text-red-400' : 'text-gray-400'}`}>
                                                    <Clock className="w-3.5 h-3.5 mr-2 shrink-0" />
                                                    Expiry: {new Date(coupon.expiry_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-4 mt-auto border-t border-white/10 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-purple-400 font-bold">
                                                <CreditCard className="w-4 h-4" />
                                                <span>{coupon.price_credits}</span>
                                            </div>

                                            <div className="flex gap-2">
                                                {coupon.transaction && !coupon.existing_review && !expired && (
                                                    <button
                                                        onClick={() => setSelectedForReview(coupon)}
                                                        className="px-4 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-slate-900 border border-yellow-500/30 text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-1.5"
                                                    >
                                                        <Star className="w-3 h-3 fill-current" />
                                                        Review
                                                    </button>
                                                )}
                                                {coupon.existing_review && (
                                                    <span className="px-3 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black uppercase flex items-center gap-1.5">
                                                        <Check className="w-3 h-3" />
                                                        Reviewed
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => setRevealCode({ id: coupon.id, code: coupon.code })}
                                                    className="px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-2"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedForReview && (
                <ReviewModal
                    isOpen={!!selectedForReview}
                    onClose={() => {
                        setSelectedForReview(null);
                        window.location.reload();
                    }}
                    transactionId={selectedForReview.transaction?.id}
                    sellerId={selectedForReview.seller_id}
                    couponId={selectedForReview.id}
                    couponTitle={selectedForReview.title}
                />
            )}

            {revealCode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />
                        <button onClick={() => setRevealCode(null)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-full hover:bg-white/5">
                            <X className="h-5 w-5" />
                        </button>
                        <div className="mx-auto h-20 w-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <Tag className="h-10 w-10 text-purple-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Your Coupon Code</h3>
                        <p className="text-sm text-gray-400 mb-8">Copy and use this code at the checkout</p>
                        <div className="relative group cursor-pointer" onClick={() => handleCopy(revealCode.code || '')}>
                            <div className="w-full py-5 px-6 rounded-2xl bg-white/5 border border-white/10 text-2xl font-mono font-black tracking-[0.2em] text-purple-300 shadow-inner group-hover:border-purple-500/50 transition-all">
                                {revealCode.code}
                            </div>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy className="w-5 h-5 text-purple-400" />
                            </div>
                        </div>
                        <button
                            onClick={() => handleCopy(revealCode.code || '')}
                            className={`mt-8 w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${copied ? 'bg-green-600 text-white' : 'bg-white text-slate-900 hover:bg-gray-200'}`}
                        >
                            {copied ? <><Check className="w-5 h-5" /> Copied!</> : <><Copy className="w-5 h-5" /> Copy to Clipboard</>}
                        </button>
                        <p className="mt-6 text-[10px] text-gray-600 uppercase tracking-widest font-bold">Secure Redemption Code</p>
                    </div>
                </div>
            )}
        </div>
    );
}
