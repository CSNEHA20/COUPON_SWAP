'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link' // Import Link
import { supabase } from '@/lib/supabase'
import { Upload, Eye, EyeOff, Loader2, Type, FileText, Lock, DollarSign, Tag, Calendar, X } from 'lucide-react'

export default function SellPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [authChecking, setAuthChecking] = useState(true)

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [code, setCode] = useState('')
    const [price, setPrice] = useState('')
    const [category, setCategory] = useState('Food')
    const [expiryDate, setExpiryDate] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>('')
    const [showCode, setShowCode] = useState(false)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setAuthChecking(false)
        }
        checkUser()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            let finalizedImageUrl = ''

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `${user.id}/${fileName}`

                const { error: uploadError, data } = await supabase.storage
                    .from('coupons')
                    .upload(filePath, imageFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('coupons')
                    .getPublicUrl(filePath)

                finalizedImageUrl = publicUrl
            }

            const { error } = await supabase.from('coupons').insert({
                seller_id: user.id,
                title,
                description,
                code,
                price_credits: parseInt(price),
                category,
                expiry_date: expiryDate || null,
                is_sold: false,
                image_url: finalizedImageUrl || `https://source.unsplash.com/600x400/?${category},coupon`
            })

            if (error) {
                console.error('Supabase error details:', JSON.stringify(error, null, 2))
                throw error
            }

            alert('Coupon listed successfully!')
            router.push('/')
            router.refresh()
        } catch (error: any) {
            console.error('Error listing coupon:', error)
            alert('Error listing coupon: ' + (error.message || JSON.stringify(error)))
        } finally {
            setLoading(false)
        }
    }

    if (authChecking) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Please login to list a coupon</h2>
                    <p className="text-gray-500 mb-6">You need an account to sell your unused coupons.</p>
                    <Link
                        href="/login"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">List a Coupon</h1>
                    <p className="text-gray-500">Turn your unused coupons into credits.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                            <Type className="w-4 h-4 mr-2 text-gray-400" />
                            Coupon Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            required
                            maxLength={50}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border text-gray-900"
                            placeholder="e.g. 50% Off Pizza Hut"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                            <Upload className="w-4 h-4 mr-2 text-gray-400" />
                            Upload Coupon Image/Voucher Screenshot
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-400 transition-colors cursor-pointer relative">
                            <div className="space-y-1 text-center">
                                {previewUrl ? (
                                    <div className="relative h-48 w-full">
                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-md" />
                                        <button
                                            type="button"
                                            onClick={() => { setImageFile(null); setPreviewUrl(''); }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                            <FileText className="w-4 h-4 mr-2 text-gray-400" />
                            Description
                        </label>
                        <textarea
                            id="description"
                            rows={3}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border text-gray-900"
                            placeholder="Terms and conditions, minimum order value, etc."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Coupon Code */}
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                            <Lock className="w-4 h-4 mr-2 text-gray-400" />
                            Coupon Code (Hidden until purchase) *
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                type={showCode ? "text" : "password"}
                                id="code"
                                required
                                className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border pr-10 text-gray-900"
                                placeholder="SECRET-CODE-123"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowCode(!showCode)}
                            >
                                {showCode ? (
                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <Eye className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Price & Category Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                                <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                                Price (Credits) *
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <input
                                    type="number"
                                    id="price"
                                    required
                                    min="1"
                                    max="1000"
                                    className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border pl-7 text-gray-900"
                                    placeholder="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Suggested: 10-50 credits</p>
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                                <Tag className="w-4 h-4 mr-2 text-gray-400" />
                                Category
                            </label>
                            <select
                                id="category"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border text-gray-900"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="Food">Food</option>
                                <option value="Fashion">Fashion</option>
                                <option value="Travel">Travel</option>
                                <option value="Tech">Tech</option>
                                <option value="Work">Work</option>
                                <option value="Fun">Fun</option>
                                <option value="Health">Health</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 flex items-center mb-1">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            Expiry Date
                        </label>
                        <input
                            type="date"
                            id="expiry"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border text-gray-900"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                    Listing Coupon...
                                </div>
                            ) : 'List Coupon'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
