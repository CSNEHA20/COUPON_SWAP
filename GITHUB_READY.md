# 🚀 GitHub Safe Upload Guide

To upload your project securely, follow this checklist. This ensures your private keys stay hidden and your database remains protected.

## 1. Verify `.gitignore`
Your project is already configured to hide sensitive files. Ensure your `.gitignore` contains these lines:
```gitignore
# env files
.env*
.env.local
.env.development.local
.env.test.local
.env.production.local

# dependencies
/node_modules
```
> [!IMPORTANT]
> **Never** remove `.env.local` from this file. This prevents your Supabase Secret Keys from being leaked online.

## 2. Final Security SQL (Run in Supabase)
Ensure your database is locked down. This script enables **Row Level Security (RLS)** for all sensitive tables:

```sql
-- Lock down Coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select" ON coupons;
CREATE POLICY "Public select" ON coupons FOR SELECT USING (is_sold = false);
DROP POLICY IF EXISTS "Owner delete" ON coupons;
CREATE POLICY "Owner delete" ON coupons FOR DELETE USING (auth.uid() = seller_id);

-- Lock down Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view average ratings" ON profiles;
CREATE POLICY "Anyone can view average ratings" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Lock down Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read reviews" ON reviews;
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Buyers can review" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
```

## 3. GitHub Upload Steps
Run these commands in your VS Code terminal (Step-by-Step):

1.  **Initialize Git** (if not done):
    ```powershell
    git init
    ```
2.  **Add all files**:
    ```powershell
    git add .
    ```
3.  **Check ignored files**:
    ```powershell
    git status
    ```
    *(Check that `.env.local` is **NOT** listed under "Changes to be committed")*
4.  **Commit**:
    ```powershell
    git commit -m "Initial secure commit"
    ```
5.  **Push to GitHub**:
    *   Create a **New Repository** on GitHub.com.
    *   Follow the "Push an existing repository" instructions provided by GitHub.

## 4. Production Environment (e.g., Vercel)
When you deploy your site, you will need to add your environment variables manually in the hosting dashboard (Vercel/Netlify):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
