'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { User as UserIcon, Coins, TrendingUp, ShoppingCart, Loader2, AlertCircle, Plus, X, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface Profile {
    id: string
    email: string
    credits: number
    created_at: string
}

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({
        earnings: 0,
        spent: 0,
        activeListings: 0,
        totalSold: 0,
        totalPurchased: 0
    })

    // Buy Credits State
    const [showBuyModal, setShowBuyModal] = useState(false)
    const [buyingCredits, setBuyingCredits] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                // 1. Get User
                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError || !user) {
                    router.push('/login')
                    return
                }

                setUser(user)

                // 2. Get Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle()

                if (profileError) throw profileError
                setProfile(profileData)

                // 3. Get Stats
                // Sales Count
                const { count: salesCount } = await supabase
                    .from('coupons')
                    .select('id', { count: 'exact', head: true })
                    .eq('seller_id', user.id)
                    .eq('is_sold', true)

                // Purchases Count
                const { count: purchasesCount } = await supabase
                    .from('coupons')
                    .select('id', { count: 'exact', head: true })
                    .eq('buyer_id', user.id)

                // Active Listings
                const { count: activeListingsCount } = await supabase
                    .from('coupons')
                    .select('id', { count: 'exact', head: true })
                    .eq('seller_id', user.id)
                    .eq('is_sold', false)

                // Earnings (sum from transactions)
                const { data: salesTransactions } = await supabase
                    .from('transactions')
                    .select('amount_credits')
                    .eq('seller_id', user.id)

                const earnings = salesTransactions?.reduce((sum: number, txn: any) => sum + txn.amount_credits, 0) || 0

                // Spent (sum from transactions)
                const { data: purchaseTransactions } = await supabase
                    .from('transactions')
                    .select('amount_credits')
                    .eq('buyer_id', user.id)

                const spent = purchaseTransactions?.reduce((sum: number, txn: any) => sum + txn.amount_credits, 0) || 0

                setStats({
                    earnings,
                    spent,
                    activeListings: activeListingsCount || 0,
                    totalSold: salesCount || 0,
                    totalPurchased: purchasesCount || 0
                })

            } catch (err) {
                console.error('Error fetching profile:', err)
                setError((err as Error).message || 'Failed to load profile data')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [router])

    const handleBuyCredits = async (amount: number) => {
        if (!user) return

        try {
            setBuyingCredits(true)

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1000))

            const currentCredits = profile?.credits || 0
            const newBalance = currentCredits + amount

            console.log('Upserting profile with:', { id: user.id, credits: newBalance })

            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    email: user.email,
                    credits: newBalance,
                    ...(profile?.created_at ? { created_at: profile.created_at } : {})
                })

            if (updateError) {
                console.error('Supabase update error:', updateError)
                throw updateError
            }

            console.log('Profile updated/created successfully')

            // Update local state
            setProfile({
                id: user.id,
                email: user.email || '',
                credits: newBalance,
                created_at: profile?.created_at || new Date().toISOString()
            })
            setShowBuyModal(false)
            alert(`Successfully added ${amount} credits!`)

        } catch (err: any) {
            console.error('Error buying credits:', err)
            alert('Failed to add credits: ' + (err.message || 'Unknown error'))
        } finally {
            setBuyingCredits(false)
        }
    }

    const getCreditColor = (credits: number) => {
        if (credits > 50) return 'text-green-400'
        if (credits >= 10) return 'text-yellow-400'
        return 'text-red-400'
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 p-4">
                <div className="rounded-lg bg-red-900/20 border border-red-500/50 p-6 text-red-200">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <h2 className="text-lg font-semibold text-red-100">Error Loading Profile</h2>
                    </div>
                    <p className="mt-2 text-sm">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-slate-950 p-4 md:p-8 text-white selection:bg-purple-500/30">
            <div className="mx-auto max-w-4xl space-y-6">

                {/* Header Section */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-5">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20">
                                <UserIcon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">{profile?.email || user?.email}</h1>
                                <p className="text-sm text-gray-400">
                                    Member since {new Date(user?.created_at || '').toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Credit Balance Card */}
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 border border-white/10 min-w-[240px] shadow-lg group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-between mb-3 relative z-10">
                                <span className="text-sm font-medium text-gray-400">Available Credits</span>
                                <Coins className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div className={`text-4xl font-bold mb-4 ${getCreditColor(profile?.credits || 0)} relative z-10`}>
                                {profile?.credits || 0}
                            </div>
                            <button
                                onClick={() => setShowBuyModal(true)}
                                className="relative z-10 w-full rounded-lg bg-white/10 hover:bg-white/20 border border-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Buy More Credits
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 shadow-lg hover:border-green-500/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-green-500/10 p-3 text-green-400 border border-green-500/20">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Total Earnings</p>
                                <p className="text-2xl font-bold text-white mt-1">{stats.earnings}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 shadow-lg hover:border-red-500/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-red-500/10 p-3 text-red-400 border border-red-500/20">
                                <ShoppingCart className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Total Spent</p>
                                <p className="text-2xl font-bold text-white mt-1">{stats.spent}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 shadow-lg hover:border-purple-500/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400 border border-purple-500/20">
                                <Coins className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-400">Active Listings</p>
                                <p className="text-2xl font-bold text-white mt-1">{stats.activeListings}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Summary / Navigation */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4">Selling Activity</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <span className="text-gray-400">Coupons Sold</span>
                                <span className="font-semibold text-white">{stats.totalSold}</span>
                            </div>
                            <Link href="/profile/sales" className="block text-center w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-3 text-sm font-medium text-white transition-all">
                                View My Listings
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4">Buying Activity</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-white/5">
                                <span className="text-gray-400">Coupons Purchased</span>
                                <span className="font-semibold text-white">{stats.totalPurchased}</span>
                            </div>
                            <Link href="/profile/purchases" className="block text-center w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-3 text-sm font-medium text-white transition-all">
                                View My Purchases
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <Link href="/profile/transactions" className="text-sm text-gray-400 hover:text-purple-400 transition-colors underline decoration-dashed underline-offset-4">
                        View Full Transaction History
                    </Link>
                </div>

            </div>

            {/* Buy Credits Modal */}
            {showBuyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">Add Credits</h3>
                                <button
                                    onClick={() => setShowBuyModal(false)}
                                    className="rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-400 mb-6">
                                Select an amount to add to your wallet. Prices are in mock currency.
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {[100, 500, 1000, 5000].map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => handleBuyCredits(amount)}
                                        disabled={buyingCredits}
                                        className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/50 p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                    >
                                        <Coins className="h-6 w-6 text-yellow-500 group-hover:scale-110 transition-transform" />
                                        <span className="font-bold text-white">+{amount}</span>
                                        <span className="text-xs text-gray-500 group-hover:text-gray-300">Credits</span>
                                    </button>
                                ))}
                            </div>

                            {buyingCredits && (
                                <div className="flex items-center justify-center gap-2 text-sm text-purple-400 animate-pulse">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing secure payment...
                                </div>
                            )}
                        </div>
                        <div className="bg-slate-950/50 p-4 border-t border-white/5 text-center">
                            <p className="text-xs text-gray-600 flex items-center justify-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                Secure Mock Payment Gateway
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
