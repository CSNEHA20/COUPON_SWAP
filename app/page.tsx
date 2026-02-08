'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import CouponCard from '@/components/CouponCard'
import { Coupon } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Loader2,
  Search,
  Filter,
  X,
  ChevronDown,
  Calendar,
  DollarSign,
  ArrowUpDown,
  ShoppingBag,
  Utensils,
  Plane,
  Smartphone,
  Shirt,
  MoreHorizontal,
  Clock,
  History,
  Briefcase,
  Ticket,
  Activity
} from 'lucide-react'
import { useDebounce } from 'use-debounce'

const CATEGORIES = [
  { id: 'All', name: 'All', icon: ShoppingBag },
  { id: 'Food', name: 'Food', icon: Utensils },
  { id: 'Fashion', name: 'Fashion', icon: Shirt },
  { id: 'Travel', name: 'Travel', icon: Plane },
  { id: 'Tech', name: 'Tech', icon: Smartphone },
  { id: 'Work', name: 'Work', icon: Briefcase },
  { id: 'Fun', name: 'Fun', icon: Ticket },
  { id: 'Health', name: 'Health', icon: Activity },
  { id: 'Other', name: 'Other', icon: MoreHorizontal },
]

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First', field: 'created_at', ascending: false },
  { id: 'oldest', label: 'Oldest First', field: 'created_at', ascending: true },
  { id: 'price_asc', label: 'Price: Low to High', field: 'price_credits', ascending: true },
  { id: 'price_desc', label: 'Price: High to Low', field: 'price_credits', ascending: false },
  { id: 'expiring', label: 'Expiring Soon', field: 'expiry_date', ascending: true },
]

const PRICE_RANGES = [
  { id: 'all', label: 'All Prices', min: null, max: null },
  { id: 'under10', label: 'Under 10 Credits', min: 0, max: 10 },
  { id: '10-50', label: '10 - 50 Credits', min: 10, max: 50 },
  { id: '50-100', label: '50 - 100 Credits', min: 50, max: 100 },
  { id: '100plus', label: '100+ Credits', min: 100, max: null },
]

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter States
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [debouncedSearch] = useDebounce(searchTerm, 300)

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All')
  const [priceRange, setPriceRange] = useState(searchParams.get('price') || 'all')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')
  const [hideExpired, setHideExpired] = useState(searchParams.get('hideExpired') === 'true')
  const [showExpiringSoon, setShowExpiringSoon] = useState(searchParams.get('expiringSoon') === 'true')

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const isConfigMissing = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Sync with URL Params
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (selectedCategory !== 'All') params.set('category', selectedCategory)
    if (priceRange !== 'all') params.set('price', priceRange)
    if (sortBy !== 'newest') params.set('sort', sortBy)
    if (hideExpired) params.set('hideExpired', 'true')
    if (showExpiringSoon) params.set('expiringSoon', 'true')

    const query = params.toString()
    router.replace(query ? `/?${query}` : '/')
  }, [debouncedSearch, selectedCategory, priceRange, sortBy, hideExpired, showExpiringSoon, router])

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('coupons')
        .select(`
          *,
          seller:profiles!seller_id(average_rating, verified_seller)
        `)
        .eq('is_sold', false)

      // Search SearchTerm
      if (debouncedSearch) {
        query = query.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`)
      }

      // Category Filter
      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory)
      }

      // Price Range Filter
      const activeRange = PRICE_RANGES.find(r => r.id === priceRange)
      if (activeRange) {
        if (activeRange.min !== null) query = query.gte('price_credits', activeRange.min)
        if (activeRange.max !== null) query = query.lte('price_credits', activeRange.max)
      }

      // Expiry Filters
      const now = new Date().toISOString()
      if (hideExpired) {
        query = query.gte('expiry_date', now)
      }

      if (showExpiringSoon) {
        const sevenDaysLater = new Date()
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
        query = query.gte('expiry_date', now).lte('expiry_date', sevenDaysLater.toISOString())
      }

      // Sort
      const activeSort = SORT_OPTIONS.find(s => s.id === sortBy) || SORT_OPTIONS[0]
      query = query.order(activeSort.field, { ascending: activeSort.ascending })

      const { data, error } = await query

      if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2))
        throw error
      }
      setError(null)
      setCoupons(data || [])
    } catch (error: any) {
      console.error('Error fetching coupons:', error.message || error)
      setError(error.message || 'Failed to connect to the marketplace. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, selectedCategory, priceRange, sortBy, hideExpired, showExpiringSoon])

  useEffect(() => {
    fetchCoupons()
  }, [fetchCoupons])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('All')
    setPriceRange('all')
    setSortBy('newest')
    setHideExpired(false)
    setShowExpiringSoon(false)
  }

  const activeFilterCount = [
    selectedCategory !== 'All',
    priceRange !== 'all',
    sortBy !== 'newest',
    hideExpired,
    showExpiringSoon
  ].filter(Boolean).length

  if (isConfigMissing) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 p-4 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[32px] max-w-md shadow-2xl">
          <div className="bg-red-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <X className="text-red-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Configuration Missing</h2>
          <p className="text-gray-400 mb-6">The Supabase environment variables are missing in Vercel. Please add them to your project settings.</p>
          <div className="text-left bg-black/40 p-4 rounded-xl font-mono text-xs text-red-300 border border-white/5">
            1. NEXT_PUBLIC_SUPABASE_URL<br />
            2. NEXT_PUBLIC_SUPABASE_ANON_KEY
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-sm flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <X className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {/* Hero Section */}
      <div className="text-center relative py-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        <h1 className="text-5xl font-black text-white sm:text-7xl tracking-tighter mb-4 drop-shadow-2xl">
          Coupon<span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">Swap</span>
        </h1>
        <p className="max-w-xl mx-auto text-lg text-gray-400 font-medium">
          The ultimate marketplace for unused rewards and vouchers.
        </p>
      </div>

      {/* Modern Filter Interface */}
      <div className="sticky top-0 z-30 space-y-4 pt-4">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 shadow-2xl flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-1/2 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
            <input
              type="text"
              placeholder="Search coupons (e.g. 'Amazon', 'Pizza')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all border ${showAdvanced || activeFilterCount > 0
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="md:w-48 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold text-gray-300 outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer hover:bg-white/10"
            >
              {SORT_OPTIONS.map((opt: any) => (
                <option key={opt.id} value={opt.id} className="bg-slate-900 text-white">{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Pill View */}
        <div className="w-full overflow-x-auto no-scrollbar py-2">
          <div className="flex space-x-3 min-w-max px-1">
            {CATEGORIES.map(({ id, name, icon: Icon }) => {
              const isActive = selectedCategory === id
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCategory(id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${isActive
                    ? 'bg-white text-slate-900 border-white shadow-xl scale-105'
                    : 'bg-white/5 text-gray-200 border-white/5 hover:border-white/20 hover:text-white'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : ''}`} />
                  {name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvanced && (
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Price filter */}
              <div className="space-y-3">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> Price Range
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((range: any) => (
                    <button
                      key={range.id}
                      onClick={() => setPriceRange(range.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${priceRange === range.id
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300'
                        }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry filter */}
              <div className="space-y-3">
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Availability
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={hideExpired}
                        onChange={(e) => setHideExpired(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-6 rounded-full transition-colors ${hideExpired ? 'bg-purple-600' : 'bg-white/10'}`}></div>
                      <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${hideExpired ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Hide Expired</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={showExpiringSoon}
                        onChange={(e) => setShowExpiringSoon(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-6 rounded-full transition-colors ${showExpiringSoon ? 'bg-yellow-600' : 'bg-white/10'}`}></div>
                      <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${showExpiringSoon ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Expiring Soon (7d)</span>
                  </label>
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-3 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Active Filters</p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-tighter transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeFilterCount > 0 ? (
                    <>
                      {selectedCategory !== 'All' && (
                        <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
                          Category: {selectedCategory}
                        </span>
                      )}
                      {priceRange !== 'all' && (
                        <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold">
                          {PRICE_RANGES.find(r => r.id === priceRange)?.label}
                        </span>
                      )}
                      {sortBy !== 'newest' && (
                        <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                          Sorted by: {SORT_OPTIONS.find(s => s.id === sortBy)?.label}
                        </span>
                      )}
                      {hideExpired && (
                        <span className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                          Hiding Expired
                        </span>
                      )}
                      {showExpiringSoon && (
                        <span className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold">
                          Expiring Soon
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-gray-600 italic">No advanced filters applied</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Controls */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
          {loading ? 'Searching...' : `Showing ${coupons.length} coupon${coupons.length === 1 ? '' : 's'}`}
        </p>
        <div className="flex items-center gap-4">
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-tighter"
            >
              Clear All Filters
            </button>
          )}
          {loading && <Loader2 className="h-4 w-4 animate-spin text-purple-500" />}
        </div>
      </div>

      {/* Marketplace Grid */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white/5 rounded-[32px] aspect-[4/3] mb-4"></div>
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-white/5 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : !coupons || coupons.length === 0 ? (
          <div className="text-center py-24 glass-panel rounded-[40px] border-dashed border-2 border-white/5">
            <div className="mx-auto h-24 w-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Search className="h-10 w-10 text-gray-700" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              {searchTerm ? `No results found for '${searchTerm}'` : 'No match found'}
            </h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto">
              We couldn't find any coupons matching your criteria. Try adjusting your filters or search terms.
            </p>
            <button
              onClick={clearFilters}
              className="mt-8 px-8 py-3 bg-white text-slate-900 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon: Coupon) => (
              <div key={coupon.id} className="animate-in fade-in zoom-in duration-300">
                <CouponCard coupon={coupon} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen justify-center items-center bg-slate-950">
        <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
