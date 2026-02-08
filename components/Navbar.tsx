'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X, Coins } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'

export default function Navbar() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [credits, setCredits] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)

            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('credits')
                    .eq('id', user.id)
                    .single()

                if (data) {
                    setCredits(data.credits)
                }
            }
            setLoading(false)
        }

        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('credits')
                    .eq('id', session.user.id)
                    .single()
                if (data) setCredits(data.credits)
            } else {
                setCredits(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/')
    }

    return (
        <nav className="glass-nav sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-black italic bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                CouponSwap
                            </span>
                        </Link>
                    </div>

                    <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
                        <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md font-medium text-sm transition-colors">
                            Marketplace
                        </Link>
                        <Link href="/sell" className="text-gray-300 hover:text-white px-3 py-2 rounded-md font-medium text-sm transition-colors">
                            Sell Coupon
                        </Link>

                        {!loading && (
                            <>
                                {user ? (
                                    <div className="flex items-center space-x-6">
                                        <div className="flex items-center bg-white/10 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
                                            <Coins className="w-4 h-4 text-yellow-400 mr-2" />
                                            <span className="text-gray-100 font-semibold text-sm">{credits ?? 0}</span>
                                        </div>
                                        <Link href="/profile" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">
                                            Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="text-gray-400 hover:text-red-400 font-medium text-sm transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="bg-indigo-600/90 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/30"
                                    >
                                        Login
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
                        >
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="sm:hidden glass-panel border-t-0 mt-0">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link
                            href="/"
                            className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 mx-2 rounded-lg"
                        >
                            Marketplace
                        </Link>
                        <Link
                            href="/sell"
                            className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 mx-2 rounded-lg"
                        >
                            Sell Coupon
                        </Link>
                        {!loading && user && (
                            <div className="block px-3 py-2 text-base font-medium text-gray-300 mx-2">
                                <div className="flex items-center mb-2">
                                    <Coins className="w-4 h-4 text-yellow-400 mr-2" />
                                    <span>Credits: {credits ?? 0}</span>
                                </div>
                            </div>
                        )}
                        {!loading && (
                            <div className="px-3 py-2">
                                {user ? (
                                    <>
                                        <Link
                                            href="/profile"
                                            className="block w-full text-left text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg mb-1"
                                        >
                                            Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left text-base font-medium text-red-400 hover:bg-white/5 px-3 py-2 rounded-lg"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}
