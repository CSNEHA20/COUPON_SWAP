'use client'

import { Star } from 'lucide-react'

interface RatingStatsProps {
    averageRating: number
    totalReviews: number
    ratingCounts: { [key: number]: number }
}

export default function RatingStats({ averageRating, totalReviews, ratingCounts }: RatingStatsProps) {
    const ratings = [5, 4, 3, 2, 1]

    return (
        <div className="bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Average Score */}
                <div className="text-center md:text-left space-y-2">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Average Rating</p>
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <h2 className="text-6xl font-black text-white">{averageRating.toFixed(1)}</h2>
                        <div className="flex flex-col">
                            <div className="flex text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-5 h-5 ${Math.round(averageRating) > i ? 'fill-current' : 'text-white/10'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-sm font-bold text-gray-400 mt-1">{totalReviews} reviews</p>
                        </div>
                    </div>
                </div>

                {/* Rating Bars */}
                <div className="flex-1 w-full space-y-3">
                    {ratings.map((score) => {
                        const count = ratingCounts[score] || 0
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

                        return (
                            <div key={score} className="flex items-center gap-4 group">
                                <div className="flex items-center gap-2 min-w-[50px]">
                                    <span className="text-sm font-black text-white">{score}</span>
                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                </div>
                                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${score >= 4 ? 'bg-indigo-500' : score === 3 ? 'bg-purple-500' : 'bg-slate-700'
                                            }`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <div className="min-w-[40px] text-right">
                                    <span className="text-xs font-black text-gray-500 group-hover:text-gray-300 transition-colors">
                                        {count}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
