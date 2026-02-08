import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendExpiryReminder } from '@/lib/emailService';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    // 1. Security Check: Verify this is being called by a cron service or authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Define timeframe: We want to find coupons expiring in exactly 24 hours (roughly)
        // We'll target coupons expiring between 23 and 25 hours from now
        const now = new Date();
        const minExpiry = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hours from now
        const maxExpiry = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now

        // Note: The user requested "expiring in the next 24-48 hours", 
        // but the email subject says "expires in 24 hours". 
        // I'll adjust the query to find coupons expiring tomorrow.
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);

        console.log('Fetching coupons expiring between:', tomorrow.toISOString(), 'and', dayAfter.toISOString());

        // 3. Query coupons with buyer emails
        const { data: expiringCoupons, error } = await supabaseAdmin
            .from('coupons')
            .select(`
        id,
        title,
        code,
        expiry_date,
        buyer_id,
        profiles!coupons_buyer_id_fkey(email)
      `)
            .eq('is_sold', true)
            .gte('expiry_date', tomorrow.toISOString())
            .lt('expiry_date', dayAfter.toISOString());

        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }

        if (!expiringCoupons || expiringCoupons.length === 0) {
            return NextResponse.json({
                success: true,
                remindersSent: 0,
                message: 'No coupons expiring in the target window.'
            });
        }

        // 4. Send reminder emails
        const emailPromises = expiringCoupons.map((coupon: any) => {
            // Handle the nested profile email structure
            const buyerEmail = coupon.profiles?.email;
            if (!buyerEmail) return Promise.resolve();

            return sendExpiryReminder(
                buyerEmail,
                coupon.title,
                coupon.code,
                coupon.expiry_date
            );
        });

        const results = await Promise.allSettled(emailPromises);
        const successCount = results.filter(r => r.status === 'fulfilled').length;

        return NextResponse.json({
            success: true,
            remindersSent: successCount,
            totalExpiring: expiringCoupons.length
        });
    } catch (error) {
        console.error('Expiry reminder cron error:', error);
        return NextResponse.json({
            error: 'Failed to send reminders',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
