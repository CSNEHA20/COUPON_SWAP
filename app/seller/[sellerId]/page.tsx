'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    Star,
    BadgeCheck,
    ShoppingBag,
    Calendar,
    ArrowLeft,
    Loader2,
    Filter,
    ChevronLeft,
    ChevronRight,
    User
} from 'lucide-react'
import Link from 'next/link'
import CouponCard from '@/components/CouponCard'
import RatingStats from '@/components/RatingStats'
import { Profile, Review, Coupon } from '@/types'

export default function SellerProfilePage() {
    const params = useParams()
    const sellerId = params.sellerId as string
    const [seller, setSeller] = useState<Profile | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [listings, setListings] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all')

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                // 1. Fetch Seller Profile
                const { data: sellerData, error: sellerError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', sellerId)
                    .single()

                if (sellerError) throw sellerError
                setSeller(sellerData)

                // 2. Fetch Reviews
                let reviewsQuery = supabase
                    .from('reviews')
                    .select(`
            *,
            reviewer:profiles!reviewer_id(email),
            coupon:coupons(title)
          `)
                    .eq('seller_id', sellerId)
                    .order('created_at', { ascending: false })

                if (ratingFilter !== 'all') {
                    reviewsQuery = reviewsQuery.eq('rating', ratingFilter)
                }

                const { data: reviewsData, error: reviewsError } = await reviewsQuery
                    .range(page * 10, (page + 1) * 10 - 1)

                if (reviewsError) throw reviewsError
                setReviews(reviewsData || [])

                // 3. Fetch Active Listings
                const { data: listingsData, error: listingsError } = await supabase
                    .from('coupons')
                    .select('*')
                    .eq('seller_id', sellerId)
                    .eq('is_sold', false)
                    .limit(6)

                if (listingsError) throw listingsError
                setListings(listingsData || [])

            } catch (err: any) {
                console.error('Error fetching seller data:', err.message || err)
                if (err.message) {
                    // Try to log more details if it's a supabase error
                    console.error('Supabase error details:', JSON.stringify(err, null, 2))
                }
            } finally {
                setLoading(false)
            }
        }

        if (sellerId) fetchData()
    }, [sellerId, page, ratingFilter])

    // Calculate rating stats for the component
    const ratingCounts = reviews.reduce((acc: any, rev) => {
        acc[rev.rating] = (acc[rev.rating] || 0) + 1
        return acc
    }, {})

    if (loading && !seller) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        )
    }

    if (!seller) {
        return <div className="p-20 text-center text-white">Seller not found</div>
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-4 md:p-8 text-white">
            <div className="mx-auto max-w-6xl space-y-12">

                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Marketplace
                </Link>

                {/* Hero Section */}
                <div className="relative rounded-[48px] bg-slate-900/50 border border-white/10 p-8 md:p-12 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />

                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                        <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[32px] flex items-center justify-center shadow-2xl relative">
                            <User className="w-16 h-16 text-white/50" />
                            {seller.verified_seller && (
                                <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2 border-4 border-slate-900 shadow-xl">
                                    <BadgeCheck className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <h1 className="text-4xl font-black tracking-tight">{seller.email.split('@')[0]}</h1>
                                    {seller.verified_seller && (
                                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                                            Verified Seller
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-400 flex items-center justify-center md:justify-start gap-2 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    Member since {new Date(seller.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4">
                                <div className="text-center md:text-left">
                                    <p className="text-2xl font-black text-white">{seller.total_reviews}</p>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Reviews</p>
                                </div>
                                <div className="w-px h-10 bg-white/5" />
                                <div className="text-center md:text-left">
                                    <p className="text-2xl font-black text-white">{listings.length}</p>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Listings</p>
                                </div>
                            </div>
                        </div>

                        <button className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 h-fit">
                            Message Seller
                        </button>
                    </div>
                </div>

                {/* Stats and Reviews Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Left Column: Ratings */}
                    <div className="lg:col-span-1 space-y-8">
                        <h3 className="text-xl font-black uppercase tracking-widest text-gray-400">Rating Breakdown</h3>
                        <RatingStats
                            averageRating={seller.average_rating || 0}
                            totalReviews={seller.total_reviews || 0}
                            ratingCounts={ratingCounts}
                        />
                    </div>

                    {/* Right Column: Reviews List */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black uppercase tracking-widest text-gray-400">Customer Reviews</h3>

                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select
                                    value={ratingFilter}
                                    onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-purple-500/50"
                                >
                                    <option value="all">All Ratings</option>
                                    <option value="5">5 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="2">2 Stars</option>
                                    <option value="1">1 Star</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {reviews.length === 0 ? (
                                <div className="p-12 text-center bg-white/5 border border-dashed border-white/10 rounded-[32px]">
                                    <p className="text-gray-500 italic">No reviews found for this criteria.</p>
                                </div>
                            ) : (
                                reviews.map((review) => (
                                    <div key={review.id} className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-1 text-yellow-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${review.rating > i ? 'fill-current' : 'text-white/10'}`} />
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-gray-300 leading-relaxed font-medium capitalize first-letter:text-2xl first-letter:font-black first-letter:text-purple-400">
                                            {review.comment || 'No comment provided.'}
                                        </p>
                                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                            <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black uppercase">
                                                {review.reviewer?.email[0]}
                                            </div>
                                            <p className="text-xs font-bold text-gray-500">
                                                {review.reviewer?.email.split('@')[0]} <span className="text-gray-700 mx-1">•</span> Verified Buyer
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Pagination */}
                            {reviews.length > 0 && (
                                <div className="flex items-center justify-center gap-4 pt-8">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage(p => p - 1)}
                                        className="p-3 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-black text-gray-500 uppercase tracking-widest">Page {page + 1}</span>
                                    <button
                                        disabled={reviews.length < 10}
                                        onClick={() => setPage(p => p + 1)}
                                        className="p-3 rounded-xl bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Listings */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase tracking-widest text-gray-400">From this Seller</h3>
                        <Link href="/" className="text-xs font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest transition-colors">
                            View All Marketplace
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {listings.map((coupon) => (
                            <CouponCard key={coupon.id} coupon={coupon} />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
