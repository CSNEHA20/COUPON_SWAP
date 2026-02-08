'use server'

import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'
import { sendPurchaseConfirmation, sendSaleNotification } from '@/lib/emailService'

interface BuyResult {
    success: boolean
    code?: string
    error?: string
    emailError?: boolean
}

export async function buyCoupon(couponId: string, buyerId: string): Promise<BuyResult> {
    console.log('Attempting purchase:', { couponId, buyerId })

    // 1. Fetch Coupon Details
    const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .single()

    if (couponError || !coupon) {
        console.error('Coupon fetch error:', couponError)
        return { success: false, error: 'Coupon not found' }
    }

    if (coupon.is_sold) {
        return { success: false, error: 'Coupon already sold' }
    }

    if (coupon.seller_id === buyerId) {
        return { success: false, error: 'You cannot buy your own coupon' }
    }

    // 2. Fetch Buyer Credits
    const { data: buyer, error: buyerError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', buyerId)
        .single()

    if (buyerError || !buyer) {
        return { success: false, error: 'Buyer profile not found' }
    }

    if (buyer.credits < coupon.price_credits) {
        return { success: false, error: `Insufficient credits. You need ${coupon.price_credits} but have ${buyer.credits}.` }
    }

    // 3. Perform Transaction (Sequential with Manual Rollback)
    // Step A: Deduct from Buyer
    const { error: deductError } = await supabase
        .from('profiles')
        .update({ credits: buyer.credits - coupon.price_credits })
        .eq('id', buyerId)

    if (deductError) {
        console.error('Deduct Error:', deductError)
        return { success: false, error: 'Transaction failed (Deduct)' }
    }

    // Step B: Add to Seller (Fetch seller first to get current credits)
    // We need to be careful here. If this fails, we must refund buyer.
    const { data: seller, error: sellerFetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', coupon.seller_id)
        .single()

    if (sellerFetchError || !seller) {
        // ROLLBACK A
        await supabase.from('profiles').update({ credits: buyer.credits }).eq('id', buyerId)
        return { success: false, error: 'Seller profile not found. Transaction cancelled.' }
    }

    const { error: addError } = await supabase
        .from('profiles')
        .update({ credits: seller.credits + coupon.price_credits })
        .eq('id', coupon.seller_id)

    if (addError) {
        // ROLLBACK A
        await supabase.from('profiles').update({ credits: buyer.credits }).eq('id', buyerId)
        return { success: false, error: 'Transaction failed (Add)' }
    }

    // Step C: Mark Coupon as Sold & Link Buyer
    const { error: updateCouponError } = await supabase
        .from('coupons')
        .update({
            is_sold: true,
            buyer_id: buyerId
        })
        .eq('id', couponId)

    if (updateCouponError) {
        // ROLLBACK B (Remove from seller) & A (Refund buyer)
        // Note: This is getting messy, but it's manual rollback.
        await supabase.from('profiles').update({ credits: seller.credits }).eq('id', coupon.seller_id)
        await supabase.from('profiles').update({ credits: buyer.credits }).eq('id', buyerId)
        return { success: false, error: 'Failed to update coupon status' }
    }

    // Step D: Record Transaction
    const { error: txnError } = await supabase
        .from('transactions')
        .insert({
            buyer_id: buyerId,
            seller_id: coupon.seller_id,
            amount_credits: coupon.price_credits,
            coupon_id: couponId
        })

    if (txnError) {
        console.error('Transaction log error details:', JSON.stringify(txnError, null, 2))
        // Rollback
        await supabase.from('coupons').update({ is_sold: false, buyer_id: null }).eq('id', couponId)
        await supabase.from('profiles').update({ credits: seller.credits }).eq('id', coupon.seller_id)
        await supabase.from('profiles').update({ credits: buyer.credits }).eq('id', buyerId)
        return { success: false, error: `Failed to record transaction: ${txnError.message || JSON.stringify(txnError)}` }
    }

    // Success
    revalidatePath('/') // Update marketplace

    // 4. Send Email Notifications (Don't let email failure break the successful purchase)
    try {
        // Fetch seller email (we already have seller credits, but need email)
        const { data: sellerProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', coupon.seller_id)
            .single()

        // Fetch buyer email
        const { data: buyerProfile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', buyerId)
            .single()

        if (sellerProfile?.email && buyerProfile?.email) {
            await Promise.all([
                sendPurchaseConfirmation(
                    buyerProfile.email,
                    coupon.title,
                    coupon.code,
                    coupon.price_credits,
                    coupon.expiry_date
                ),
                sendSaleNotification(
                    sellerProfile.email,
                    coupon.title,
                    coupon.price_credits,
                    buyerProfile.email
                )
            ])
        }
    } catch (emailError) {
        console.error('Email sending failed:', emailError)
        return { success: true, code: coupon.code, emailError: true }
    }

    return { success: true, code: coupon.code }
}
