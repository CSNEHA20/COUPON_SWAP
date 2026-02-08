'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    ArrowLeft,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Loader2,
    AlertCircle,
    Calendar,
    Tag,
    Clock,
    CreditCard
} from 'lucide-react'
import Link from 'next/link'

interface TransactionWithCoupon {
    id: string
    buyer_id: string
    seller_id: string
    amount_credits: number
    created_at: string
    coupons: {
        title: string
    } | null
}

export default function TransactionsPage() {
    const router = useRouter()
    const [transactions, setTransactions] = useState<TransactionWithCoupon[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }
                setUser(user)

                const { data, error: fetchError } = await supabase
                    .from('transactions')
                    .select(`
                        *,
                        coupons ( title )
                    `)
                    .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
                    .order('created_at', { ascending: false })

                if (fetchError) throw fetchError
                setTransactions(data || [])
            } catch (err: any) {
                console.error('Error fetching transactions:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchTransactions()
    }, [router])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-slate-950 p-4 md:p-8 text-white selection:bg-purple-500/30">
            <div className="mx-auto max-w-4xl space-y-6">

                {/* Back Link */}
                <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group mb-2"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Profile
                </Link>

                <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <History className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
                        <p className="text-gray-400 text-sm mt-1">Detailed log of all your marketplace activities</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {transactions.length === 0 ? (
                        <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-12 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50 text-gray-500 mb-4">
                                <History className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">No transactions yet</h3>
                            <p className="text-gray-400 mt-2 max-w-md mx-auto italic">
                                Once you buy or sell a coupon, your activity log will appear here.
                            </p>
                            <Link
                                href="/"
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
                            >
                                Browse Marketplace
                            </Link>
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-white/10">
                                            <th className="px-6 py-4">Transaction</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Item</th>
                                            <th className="px-6 py-4 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {transactions.map((txn) => {
                                            const isSale = txn.seller_id === user?.id
                                            return (
                                                <tr key={txn.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${isSale ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                {isSale ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                                            </div>
                                                            <span className="font-medium text-sm">
                                                                {isSale ? 'Sold' : 'Purchased'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-gray-300">
                                                                {new Date(txn.created_at).toLocaleDateString()}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500">
                                                                {new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-300 line-clamp-1 group-hover:text-white transition-colors" title={txn.coupons?.title}>
                                                            {txn.coupons?.title || 'Unknown Coupon'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        <div className={`text-sm font-bold flex items-center justify-end gap-1 ${isSale ? 'text-green-400' : 'text-red-400'}`}>
                                                            {isSale ? '+' : '-'}{txn.amount_credits}
                                                            <CreditCard className="h-3 w-3 opacity-50" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="rounded-xl bg-red-900/20 border border-red-500/50 p-4 flex items-center gap-3 text-red-200 text-sm">
                        <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
