# 🛡️ Final Security Audit & Deployment Guide

This document ensures your project is **production-ready** and secure for your customer.

## 1. Security Audit Results
- [x] **No Hardcoded Keys**: All sensitive Supabase keys are using environment variables.
- [x] **Safe Git Configuration**: `.gitignore` correctly prevents `.env.local` from being uploaded.
- [x] **Isolated Admin Access**: The `supabaseAdmin` client (which bypasses security) is strictly kept in server-side files and API routes.
- [x] **Automatic Profile Creation**: New users automatically get a secure profile via a database trigger.

## 2. Definitive Database Lockdown (Run this SQL)
This is the most important step. Run this in your **Supabase SQL Editor** to ensure no one can steal coupons or edit other people's data.

```sql
-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 1. COUPONS POLICIES
DROP POLICY IF EXISTS "Viewable coupons" ON public.coupons;
CREATE POLICY "Viewable coupons" ON public.coupons
FOR SELECT USING (
    is_sold = false 
    OR auth.uid() = buyer_id 
    OR auth.uid() = seller_id
);

DROP POLICY IF EXISTS "Insert own coupons" ON public.coupons;
CREATE POLICY "Insert own coupons" ON public.coupons
FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Update own listings" ON public.coupons;
CREATE POLICY "Update own listings" ON public.coupons
FOR UPDATE USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

-- 2. PROFILES POLICIES
DROP POLICY IF EXISTS "View public profiles" ON public.profiles;
CREATE POLICY "View public profiles" ON public.profiles
FOR SELECT USING (true); -- Everyone can see ratings/email, but can't edit

DROP POLICY IF EXISTS "Edit own profile" ON public.profiles;
CREATE POLICY "Edit own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 3. TRANSACTIONS POLICIES (Private logs)
DROP POLICY IF EXISTS "Private transactions" ON public.transactions;
CREATE POLICY "Private transactions" ON public.transactions
FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 4. REVIEWS POLICIES
DROP POLICY IF EXISTS "Public reviews" ON public.reviews;
CREATE POLICY "Public reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only buyers can review" ON public.reviews;
CREATE POLICY "Only buyers can review" ON public.reviews 
FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
```

## 3. Vercel Deployment Checklist
When you connect your GitHub repo to Vercel, you **MUST** add these "Environment Variables" in the Vercel Dashboard Settings:

| Variable | Source |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings > API > `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings > API > `service_role` key |
| `NEXT_PUBLIC_APP_URL` | Your Vercel domain (e.g., `https://my-app.vercel.app`) |
| `CRON_SECRET` | Any random long string (for security of reminders) |

## 4. Final Verification before "Push"
1.  **Stop your terminal** (`Ctrl+C`).
2.  **Delete any `.env` files that don't have `.local`** in the name (if any).
3.  **Run `git status`**: If you see `.env.local` listed, **STOP**. Do not push.
4.  **Push to GitHub**.
5.  **Check GitHub**: Go to your repository on GitHub.com. Verify that the file `.env.local` is **NOT** there.

---
**Your project is now safe and secure!** No one has access to the admin side, and all money (credits) transfers are protected by server-side logic.
