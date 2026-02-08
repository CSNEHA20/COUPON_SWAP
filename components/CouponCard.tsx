import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Tag, CreditCard, Trash2, Loader2, Star, BadgeCheck, Maximize2 } from 'lucide-react'
import { Coupon } from '@/types'
import BuyButton from './BuyButton'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import ImageModal from './ImageModal'

interface CouponCardProps {
    coupon: Coupon
}

export default function CouponCard({ coupon }: CouponCardProps) {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        checkUser()
    }, [])

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this listing?')) return

        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', coupon.id)

            if (error) throw error

            alert('Listing deleted successfully')
            router.refresh()
        } catch (error: any) {
            alert('Error deleting listing: ' + error.message)
        } finally {
            setIsDeleting(false)
        }
    }

    const isOwner = user?.id === coupon.seller_id

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full group relative">
            {/* Delete button for owners */}
            {isOwner && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="absolute top-2 left-2 z-10 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-full shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Delete listing"
                >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
            )}

            {/* Image Area */}
            <div
                className="h-40 w-full bg-gray-100 relative overflow-hidden cursor-zoom-in group/image"
                onClick={() => coupon.image_url && setPreviewOpen(true)}
            >
                {coupon.image_url ? (
                    <>
                        <img
                            src={coupon.image_url}
                            alt={coupon.title}
                            className="w-full h-full object-cover transform group-hover/image:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
                            <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover/image:opacity-100 transform scale-50 group-hover/image:scale-100 transition-all duration-300" />
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white/20">
                        <Tag className="w-16 h-16" />
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm">
                        {coupon.category || 'Other'}
                    </span>
                </div>
            </div>

            {/* Full Screen Image Modal */}
            {coupon.image_url && (
                <ImageModal
                    isOpen={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    imageUrl={coupon.image_url}
                    title={coupon.title}
                />
            )}

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    {coupon.expiry_date && (
                        <span className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3 mr-1" />
                            Expires {new Date(coupon.expiry_date).toLocaleDateString()}
                        </span>
                    )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors" title={coupon.title}>
                    {coupon.title}
                </h3>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow" title={coupon.description || ''}>
                    {coupon.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex items-center text-indigo-600 font-bold text-lg">
                        <CreditCard className="w-5 h-5 mr-1.5" />
                        {coupon.price_credits}
                    </div>

                    <Link
                        href={`/seller/${coupon.seller_id}`}
                        className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-gray-50 transition-colors group/seller"
                    >
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter group-hover/seller:text-indigo-500 transition-colors">Seller</span>
                            <div className="flex items-center gap-1">
                                {(coupon as any).seller?.verified_seller && (
                                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                                )}
                                <span className="text-xs font-bold text-gray-700">
                                    {(coupon as any).seller?.average_rating > 0
                                        ? `⭐ ${(coupon as any).seller.average_rating}`
                                        : 'New'}
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            <div className="px-5 pb-5">
                <BuyButton couponId={coupon.id} price={coupon.price_credits} sellerId={coupon.seller_id} />
            </div>
        </div>
    )
}
