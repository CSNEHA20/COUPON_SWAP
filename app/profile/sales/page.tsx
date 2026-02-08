'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    Package,
    DollarSign,
    Edit,
    Trash2,
    CheckCircle,
    ArrowLeft,
    Loader2,
    AlertCircle,
    LayoutGrid,
    History,
    TrendingUp,
    CreditCard,
    Plus,
    X
} from 'lucide-react'
import Link from 'next/link'
import { Coupon } from '@/types'

export default function SalesPage() {
    const router = useRouter()
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active')

    // Deleting state
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Editing state
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }
                setUser(user)

                const { data, error } = await supabase
                    .from('coupons')
                    .select('*')
                    .eq('seller_id', user.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setCoupons(data || [])
            } catch (err) {
                console.error('Error fetching sales:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchSalesData()
    }, [router])

    const handleDelete = async (couponId: string) => {
        if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return

        setDeletingId(couponId)
        try {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', couponId)
                .eq('seller_id', user.id) // Security check

            if (error) throw error

            setCoupons(prev => prev.filter(c => c.id !== couponId))
            alert('Listing deleted successfully.')
        } catch (err: any) {
            alert('Error deleting listing: ' + err.message)
        } finally {
            setDeletingId(null)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingCoupon) return

        setUpdating(true)
        try {
            const { error } = await supabase
                .from('coupons')
                .update({
                    title: editingCoupon.title,
                    description: editingCoupon.description,
                    code: editingCoupon.code,
                    price_credits: editingCoupon.price_credits,
                    category: editingCoupon.category,
                    expiry_date: editingCoupon.expiry_date
                })
                .eq('id', editingCoupon.id)
                .eq('seller_id', user.id)

            if (error) throw error

            setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? editingCoupon : c))
            setEditingCoupon(null)
            alert('Listing updated successfully!')
        } catch (err: any) {
            alert('Error updating listing: ' + err.message)
        } finally {
            setUpdating(false)
        }
    }

    const activeListings = coupons.filter(c => !c.is_sold)
    const soldListings = coupons.filter(c => c.is_sold)

    const totalEarnings = soldListings.reduce((sum: number, c: any) => sum + (c.price_credits || 0), 0)

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-slate-950 p-4 md:p-8 text-white">
            <div className="mx-auto max-w-5xl space-y-8">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4 group">
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Profile
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Package className="h-8 w-8 text-indigo-400" />
                            My Coupon Sales
                        </h1>
                        <p className="text-gray-400 mt-1">Manage your active listings and track your earnings</p>
                    </div>
                    <Link href="/sell" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-sm font-bold transition-all shadow-lg shadow-purple-600/20">
                        <Plus className="h-4 w-4" />
                        List New Coupon
                    </Link>
                </div>

                {/* Stats Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                            <LayoutGrid className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Listings</p>
                            <p className="text-2xl font-black text-white">{activeListings.length}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sold</p>
                            <p className="text-2xl font-black text-white">{soldListings.length}</p>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Earnings</p>
                            <p className="text-2xl font-black text-white">{totalEarnings} <span className="text-sm font-bold text-yellow-500/70">Credits</span></p>
                        </div>
                    </div>
                </div>

                {/* Custom Tabs */}
                <div className="flex p-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'active'
                            ? 'bg-white text-slate-900 shadow-xl'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Active Listings ({activeListings.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('sold')}
                        className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sold'
                            ? 'bg-white text-slate-900 shadow-xl'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <History className="h-4 w-4" />
                        Sales History ({soldListings.length})
                    </button>
                </div>

                {/* Content Section */}
                <div className="mt-8">
                    {activeTab === 'active' ? (
                        activeListings.length === 0 ? (
                            <EmptyState icon={<Package className="h-10 w-10 text-gray-500" />} text="No active listings." subtext="Got unused coupons? List them now!" href="/sell" btnText="Start Selling" />
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {activeListings.map(coupon => (
                                    <SellerCouponCard
                                        key={coupon.id}
                                        coupon={coupon}
                                        isSold={false}
                                        onDelete={handleDelete}
                                        onEdit={() => setEditingCoupon(coupon)}
                                        deleting={deletingId === coupon.id}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        soldListings.length === 0 ? (
                            <EmptyState icon={<CheckCircle className="h-10 w-10 text-gray-500" />} text="No sales history yet." subtext="Wait for buyers to purchase your items!" href="/profile" btnText="Back to Dashboard" />
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {soldListings.map(coupon => (
                                    <SellerCouponCard key={coupon.id} coupon={coupon} isSold={true} />
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingCoupon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/10 shadow-2xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />

                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Edit className="h-5 w-5 text-purple-400" />
                                Edit Listing
                            </h3>
                            <button onClick={() => setEditingCoupon(null)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block text-gray-400">Coupon Title</label>
                                <input
                                    type="text"
                                    value={editingCoupon.title}
                                    onChange={e => setEditingCoupon({ ...editingCoupon, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-gray-600"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block text-gray-400">Price (Credits)</label>
                                    <input
                                        type="number"
                                        value={editingCoupon.price_credits}
                                        onChange={e => setEditingCoupon({ ...editingCoupon, price_credits: parseInt(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block text-gray-400">Category</label>
                                    <select
                                        value={editingCoupon.category || ''}
                                        onChange={e => setEditingCoupon({ ...editingCoupon, category: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all appearance-none"
                                    >
                                        {['Food', 'Fashion', 'Travel', 'Tech', 'Work', 'Fun', 'Health', 'Other'].map(cat => (
                                            <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block text-gray-400">Description</label>
                                <textarea
                                    value={editingCoupon.description || ''}
                                    onChange={e => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all resize-none placeholder:text-gray-600"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block text-gray-400">Expiry Date</label>
                                <input
                                    type="date"
                                    value={editingCoupon.expiry_date?.split('T')[0] || ''}
                                    onChange={e => setEditingCoupon({ ...editingCoupon, expiry_date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 outline-none transition-all [color-scheme:dark]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={updating}
                                className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50"
                            >
                                {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function EmptyState({ icon, text, subtext, href, btnText }: any) {
    return (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-16 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/50 mb-6">
                {icon}
            </div>
            <h3 className="text-2xl font-semibold text-white">{text}</h3>
            <p className="text-gray-400 mt-2 max-w-sm mx-auto">{subtext}</p>
            <Link
                href={href}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-8 py-3 text-sm font-bold text-white hover:bg-purple-700 transition-all"
            >
                {btnText}
            </Link>
        </div>
    )
}

function SellerCouponCard({ coupon, isSold, onDelete, onEdit, deleting }: any) {
    return (
        <div className="group relative rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 transition-all overflow-hidden flex flex-col h-full hover:border-purple-500/30">
            {/* Status Badge */}
            <div className="absolute top-3 left-3 z-20">
                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${isSold ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    }`}>
                    {isSold ? 'Sold' : 'Active'}
                </span>
            </div>

            {/* Image Area */}
            <div className="h-32 w-full bg-slate-800 relative">
                {coupon.image_url ? (
                    <img src={coupon.image_url} alt={coupon.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-indigo-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent" />
            </div>

            <div className="p-5 flex-1 flex flex-col space-y-3">
                <h3 className="font-bold text-lg line-clamp-1 group-hover:text-purple-400 transition-colors">
                    {coupon.title}
                </h3>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center text-xs text-gray-400 uppercase tracking-wider font-bold">
                        <DollarSign className="w-3.5 h-3.5 mr-1" />
                        {coupon.price_credits} Credits
                    </div>
                    {isSold ? (
                        <div className="text-[10px] text-green-400 bg-green-500/5 p-2 rounded-lg border border-green-500/10">
                            Sold to buyer on {new Date(coupon.created_at).toLocaleDateString()}
                        </div>
                    ) : (
                        <div className="flex items-center text-[10px] text-gray-500">
                            Listed on {new Date(coupon.created_at).toLocaleDateString()}
                        </div>
                    )}
                </div>

                {!isSold && (
                    <div className="pt-4 mt-auto border-t border-white/5 grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onEdit()}
                            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(coupon.id)}
                            disabled={deleting}
                            className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
