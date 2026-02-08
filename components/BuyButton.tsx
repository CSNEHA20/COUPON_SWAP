'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { buyCoupon } from '@/actions/buyCoupon'
import { supabase } from '@/lib/supabase'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface BuyButtonProps {
    couponId: string
    price: number
    sellerId: string
}

export default function BuyButton({ couponId, price, sellerId }: BuyButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [credits, setCredits] = useState<number | null>(null)
    const [status, setStatus] = useState<'idle' | 'checking' | 'insufficient' | 'own_listing' | 'ready'>('checking')

    useEffect(() => {
        const checkUserStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                if (user.id === sellerId) {
                    setStatus('own_listing')
                    return
                }

                const { data } = await supabase
                    .from('profiles')
                    .select('credits')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setCredits(data.credits)
                    if (data.credits < price) {
                        setStatus('insufficient')
                    } else {
                        setStatus('ready')
                    }
                } else {
                    // Fallback if profile fetch fails
                    setStatus('ready')
                }
            } else {
                setStatus('ready') // Allow click to trigger login prompt
            }
        }
        checkUserStatus()
    }, [sellerId, price])

    const handleBuy = async () => {
        // 1. Check logged in
        if (!user) {
            if (confirm('You must be logged in to buy coupons. Go to login?')) {
                router.push('/login')
            }
            return
        }

        if (status === 'insufficient') {
            alert('You do not have enough credits to buy this coupon.')
            return
        }

        if (!confirm(`Are you sure you want to buy this coupon for ${price} credits?`)) {
            return
        }

        setLoading(true)
        try {
            const result = await buyCoupon(couponId, user.id)

            if (result.success) {
                alert(`Purchase Successful! \n\nCOUPON CODE: ${result.code}`)
                // Optionally redirect to profile or just refresh
                router.refresh()
                // Update local credits display if needed, but page refresh handles it
            } else {
                alert(`Purchase Failed: ${result.error}`)
            }
        } catch (err: any) {
            alert('An unexpected error occurred')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (status === 'checking') {
        return (
            <div className="w-full h-10 bg-gray-100 rounded-lg animate-pulse" />
        )
    }

    if (status === 'own_listing') {
        return (
            <button
                disabled
                className="w-full bg-gray-100 border border-gray-200 text-gray-400 font-medium py-2 px-4 rounded-lg cursor-not-allowed flex justify-center items-center"
            >
                Your Listing
            </button>
        )
    }

    if (status === 'insufficient') {
        return (
            <button
                disabled
                className="w-full bg-red-50 border border-red-200 text-red-400 font-medium py-2 px-4 rounded-lg cursor-not-allowed flex justify-center items-center"
            >
                Insufficient Credits
            </button>
        )
    }

    return (
        <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-white border border-indigo-600 text-indigo-600 font-medium py-2 px-4 rounded-lg hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Buy Now'}
        </button>
    )
}
