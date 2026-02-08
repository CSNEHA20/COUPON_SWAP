# 🎫 CouponSwap: The Ultimate Digital Coupon Marketplace

CouponSwap is a full-stack, secure marketplace where users can buy, sell, and trade digital coupons, gift cards, and vouchers using a virtual credit system.

## 🚀 Tech Stack

### Frontend
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **UI Components**: Custom-built with a focus on "Rich Aesthetics" (Glassmorphism, Dark Mode support).

### Backend / Infrastructure
- **BaaS**: [Supabase](https://supabase.com/)
- **Authentication**: Supabase Auth (Email/Password)
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Storage**: Supabase Storage (for Coupon Images)
- **Server Logic**: Next.js Server Actions (private, server-side code)
- **Admin Access**: Supabase Service Role (restricted to server-side operations)
- **Email Service**: Integration with Supabase Auth for automated notifications.

---

## ✨ Features by Page

### 1. Marketplace (Home)
- **Dynamic Filtering**: Filter by category (Food, Fashion, Tech, etc.).
- **Search**: Real-time search by title or description.
- **Sorting**: Sort by "Newest First" or specific price ranges.
- **Coupon Cards**: Visual cards showing discount %, price (credits), expiry date, and seller ratings.
- **Purchase Flow**: Confirmation modal with instant balance check and secure background credit transfer.

### 2. Sell Coupon
- **Image Upload**: Upload gift card/coupon photos to secure cloud storage.
- **Detailed Form**: Title, description, secret code, category, price, and expiry date.
- **Security Check**: Only authenticated users with verified profiles can list.

### 3. User Profile Dashboard
- **Live Wallet**: Displays available credit balance.
- **Top-up System**: Integration for adding credits to the virtual wallet.
- **Global Stats**:
    - **Total Earnings**: Sum of all credits earned from sales.
    - **Total Spent**: Sum of all credits spent on purchases.
    - **Active Listings**: Count of items currently for sale.
- **Transaction History**: List of all credit changes (In/Out) with timestamps.

### 4. My Purchases
- **Code Retrieval**: Securely view the secret codes of coupons you've bought.
- **Seller Reviews**: Rate sellers and leave feedback after a successful purchase.
- **Image Preview**: Full-screen modal to view the uploaded coupon image.

### 5. Seller Profiles
- **Public Ratings**: View a seller's average star rating and verification status.
- **Reviews List**: See all feedback left by previous buyers for that seller.
- **Active Listings**: View all other coupons that specific seller currently has available.

---

## 📊 Database Schema

### `profiles` Table
Stores user-specific metadata and wallet balance.
- `id`: (UUID, Primary Key) Links to Supabase Auth.
- `email`: User's email address.
- `credits`: Integer (Default: 100).
- `average_rating`: Numeric (0.0 to 5.0).
- `total_reviews`: Integer.
- `verified_seller`: Boolean.

### `coupons` Table
Stores the actual listings.
- `id`: (UUID, PK)
- `seller_id`: (UUID) Reference to `profiles`.
- `buyer_id`: (UUID) NULL if not sold.
- `title`: String.
- `code`: String (Crypted/Hidden until sold).
- `price_credits`: Integer.
- `is_sold`: Boolean.
- `image_url`: URL to storage bucket.

### `transactions` Table
The immutable ledger for credit transfers.
- `id`: (UUID, PK)
- `buyer_id`: (UUID)
- `seller_id`: (UUID)
- `amount_credits`: Integer.
- `coupon_id`: (UUID)

### `reviews` Table
Seller feedback system.
- `transaction_id`: (UUID, PK) One review per purchase.
- `seller_id`: (UUID)
- `rating`: Integer (1-5).
- `comment`: Text.

---

## 🛡️ Security Model (The "Lockdown")

### Row-Level Security (RLS)
Every table is locked down. Users can only see:
- Their own purchases.
- Their own listings.
- Public data (unsold coupons).
- **Nobody** can edit another user's credit balance via the frontend.

### Admin Boundary
All credit transfers (`buyCoupon.ts`) happen on the **Server Side** using a `supabaseAdmin` client. This client is never exposed to the browser, ensuring it's impossible for users to "hack" their credit balance.

---

## 🛠️ Developer Maintenance

To update this project in the future:
1. **Schema Changes**: Always apply `ALTER TABLE` commands in the Supabase SQL Editor first.
2. **Environment Variables**: New keys must be added to both `.env.local` and the Vercel Dashboard.
3. **Revalidation**: Use `revalidatePath('/')` in server actions to ensure the UI updates immediately after data changes.

---

## 📦 Deployment Instructions

1. **GitHub**: Push to a private or public repo (keys are safe in `.env.local`).
2. **Vercel**: Link your repo and add your Supabase Keys in the Environment Variables section.
3. **Storage**: Ensure the `coupons` bucket in Supabase is set to "Public" for reading images but "Authenticated" for uploading.
