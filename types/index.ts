export interface Profile {
    id: string
    email: string
    phone?: string | null
    kyc_id_number?: string | null
    kyc_verified: boolean
    credits: number
    average_rating: number
    total_reviews: number
    verified_seller: boolean
    created_at: string
}

export interface Coupon {
    id: string
    seller_id: string
    title: string
    description?: string | null
    code: string
    price_credits: number
    category?: 'Food' | 'Fashion' | 'Travel' | 'Tech' | 'Other' | string | null
    expiry_date?: string | null
    image_url?: string | null
    is_sold: boolean
    buyer_id?: string | null
    created_at: string
}

export interface Transaction {
    id: string
    buyer_id: string
    seller_id: string
    amount_credits: number
    coupon_id: string
    created_at: string
}

export interface Message {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
}

export interface Review {
    id: string;
    transaction_id: string;
    reviewer_id: string;
    seller_id: string;
    coupon_id: string | null;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer?: {
        email: string;
    };
    coupon?: {
        title: string;
    };
}
