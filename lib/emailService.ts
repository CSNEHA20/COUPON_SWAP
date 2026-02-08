import { supabaseAdmin } from './supabaseAdmin';

interface EmailData {
    to: string;
    subject: string;
    html: string;
}

async function sendEmail(emailData: EmailData) {
    // Using Supabase's inviteUserByEmail as a notification hack as requested
    // Note: This requires a custom invitation template in the Supabase dashboard to handle 'subject' and 'html' if possible,
    // or it will just send a standard invitation.
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        emailData.to,
        {
            data: {
                subject: emailData.subject,
                html: emailData.html
            }
        }
    );

    if (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
    return data;
}

export async function sendPurchaseConfirmation(
    buyerEmail: string,
    couponTitle: string,
    couponCode: string,
    pricePaid: number,
    expiryDate: string
) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); 
                  color: white; padding: 40px 20px; text-align: center; border-radius: 20px 20px 0 0; }
        .content { background: #ffffff; padding: 40px; border-radius: 0 0 20px 20px; border: 1px solid #e2e8f0; border-top: none; }
        .code-box { background: #f8fafc; border: 2px dashed #6366f1; padding: 24px; 
                    margin: 24px 0; text-align: center; border-radius: 16px; }
        .code { font-size: 32px; font-weight: 800; color: #4f46e5; letter-spacing: 4px; }
        .button { display: inline-block; background: #6366f1; color: white; 
                  padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; margin: 24px 0; }
        .footer { text-align: center; margin-top: 40px; font-size: 14px; color: #64748b; }
        .details { margin: 20px 0; padding: 16px; background: #f1f5f9; border-radius: 12px; }
        .details p { margin: 8px 0; font-size: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 28px;">🎉 Purchase Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p>Great news! You've successfully purchased <strong>${couponTitle}</strong> on CouponSwap.</p>
          
          <div class="code-box">
            <p style="margin-top:0; color: #64748b; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Your Coupon Code:</p>
            <div class="code">${couponCode}</div>
          </div>
          
          <div class="details">
            <p><strong>Credits Spent:</strong> 💰 ${pricePaid}</p>
            <p><strong>Expires On:</strong> 📅 ${new Date(expiryDate).toLocaleDateString()}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile/purchases" class="button">
              View Your Purchases
            </a>
          </div>
          
          <p style="margin-bottom:0;">Happy saving! If you have any issues, reply to this email.</p>
        </div>
        <div class="footer">
          <p><strong>CouponSwap</strong> - The Ultimate Coupon Marketplace</p>
          <p style="margin-top: 8px;">123 Swap St, Digital City</p>
          <p style="margin-top: 16px; font-size: 11px;"><a href="#" style="color: #94a3b8;">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: buyerEmail,
        subject: `You purchased ${couponTitle} on CouponSwap!`,
        html
    });
}

export async function sendSaleNotification(
    sellerEmail: string,
    couponTitle: string,
    priceEarned: number,
    buyerEmail: string
) {
    const hiddenBuyer = buyerEmail.replace(/(.{1}).+(@.+)/, '$1***$2');
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                  color: white; padding: 40px 20px; text-align: center; border-radius: 20px 20px 0 0; }
        .content { background: #ffffff; padding: 40px; border-radius: 0 0 20px 20px; border: 1px solid #e2e8f0; border-top: none; }
        .details { margin: 24px 0; padding: 20px; background: #f0fdf4; border-radius: 16px; border: 1px solid #bbf7d0; }
        .button { display: inline-block; background: #059669; color: white; 
                  padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; margin: 24px 0; }
        .footer { text-align: center; margin-top: 40px; font-size: 14px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 28px;">💰 Coupon Sold!</h1>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p>Woohoo! Your coupon "<strong>${couponTitle}</strong>" has been sold.</p>
          
          <div class="details">
            <p style="margin-top:0;"><strong>Credits Earned:</strong> 💎 ${priceEarned}</p>
            <p><strong>Sold to:</strong> ${hiddenBuyer}</p>
            <p style="margin-bottom:0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile/sales" class="button">
              View Your Sales
            </a>
          </div>
          
          <p>Keep listing more coupons to earn more credits!</p>
        </div>
        <div class="footer">
          <p><strong>CouponSwap</strong> - The Ultimate Coupon Marketplace</p>
          <p style="margin-top: 16px; font-size: 11px;"><a href="#" style="color: #94a3b8;">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: sellerEmail,
        subject: `Your coupon '${couponTitle}' was sold!`,
        html
    });
}

export async function sendExpiryReminder(
    buyerEmail: string,
    couponTitle: string,
    couponCode: string,
    expiryDate: string
) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                  color: white; padding: 40px 20px; text-align: center; border-radius: 20px 20px 0 0; }
        .content { background: #ffffff; padding: 40px; border-radius: 0 0 20px 20px; border: 1px solid #e2e8f0; border-top: none; }
        .warning-box { border: 2px solid #fef3c7; background: #fffbeb; padding: 20px; border-radius: 16px; margin: 24px 0; text-align: center; }
        .code { font-size: 24px; font-weight: 800; color: #b45309; }
        .button { display: inline-block; background: #d97706; color: white; 
                  padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; margin: 24px 0; }
        .footer { text-align: center; margin-top: 40px; font-size: 14px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 28px;">⏰ Expiry Warning!</h1>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p>Your coupon "<strong>${couponTitle}</strong>" is expiring in less than 24 hours!</p>
          
          <div class="warning-box">
            <p style="margin-top:0; color: #92400e; font-size: 14px;">Use this code before it's gone:</p>
            <div class="code">${couponCode}</div>
            <p style="margin-bottom:0; color: #92400e; font-size: 14px; margin-top: 8px;">Expires: ${new Date(expiryDate).toLocaleString()}</p>
          </div>
          
          <p style="text-align: center; font-weight: bold; color: #b45309;">Don't let your credits go to waste!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile/purchases" class="button">
              View Coupon Details
            </a>
          </div>
        </div>
        <div class="footer">
          <p><strong>CouponSwap</strong> - The Ultimate Coupon Marketplace</p>
          <p style="margin-top: 16px; font-size: 11px;"><a href="#" style="color: #94a3b8;">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: buyerEmail,
        subject: `Your ${couponTitle} coupon expires in 24 hours!`,
        html
    });
}

export async function sendWelcomeEmail(userEmail: string, userName: string) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); 
                  color: white; padding: 40px 20px; text-align: center; border-radius: 20px 20px 0 0; }
        .content { background: #ffffff; padding: 40px; border-radius: 0 0 20px 20px; border: 1px solid #e2e8f0; border-top: none; }
        .credit-badge { background: #e0e7ff; color: #4338ca; padding: 12px 24px; border-radius: 99px; font-weight: 800; display: inline-block; margin: 20px 0; }
        .step { background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 12px; }
        .button { display: inline-block; background: #6366f1; color: white; 
                  padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; margin: 24px 0; }
        .footer { text-align: center; margin-top: 40px; font-size: 14px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 28px;">👋 Welcome to CouponSwap!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We're thrilled to have you join our community! To get you started, we've added some free credits to your account:</p>
          
          <div style="text-align: center;">
            <div class="credit-badge">✨ 100 STARTING CREDITS ✨</div>
          </div>
          
          <h3 style="color: #4f46e5; margin-top: 32px;">How it works:</h3>
          <div class="step">
            <strong>1. Browse</strong> 🛒 - Find great deals on gift cards and vouchers.
          </div>
          <div class="step">
            <strong>2. Swap</strong> 🔄 - Use your credits to buy coupons instantly.
          </div>
          <div class="step">
            <strong>3. Sell</strong> 💰 - List your unused coupons and earn more credits!
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">
              Explore the Marketplace
            </a>
          </div>
        </div>
        <div class="footer">
          <p><strong>CouponSwap</strong> - Your World of Savings</p>
          <p style="margin-top: 16px; font-size: 11px;"><a href="#" style="color: #94a3b8;">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: userEmail,
        subject: "Welcome to CouponSwap! Here are your 100 free credits",
        html
    });
}
