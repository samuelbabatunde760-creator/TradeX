# ⚠️ CRITICAL: Vercel Environment Variable Setup

## Required Steps BEFORE Next Deployment

### 1. Go to Vercel Project Settings
- Visit: https://vercel.com/dashboard
- Click your **TradeX** project
- Click **Settings** tab
- Click **Environment Variables** in left sidebar

### 2. Add Admin Password Variable
**Exact Configuration:**
- **Name**: `NEXT_PUBLIC_ADMIN_PASSWORD`
- **Value**: `TFOGeb9VO4=WypyRa3^zz!$udb8IJL4w`
- **Environments**: Select **Production** (or all if preferred)
- Click **Save**

### 3. Verify It's Added
- You should see `NEXT_PUBLIC_ADMIN_PASSWORD` listed in Environment Variables
- Value should show as: `••••••••••••••••••••••••` (masked)

### 4. Redeploy
- Go to **Deployments** tab
- Click the three dots (⋮) on latest deployment
- Select **Redeploy**
- Wait for green checkmark ✅

### 5. Test Admin Access
- Go to your live app: `https://trade-x1-*.vercel.app/admin-hidden-portal`
- **Old password will NOT work anymore**
- **Use only**: `TFOGeb9VO4=WypyRa3^zz!$udb8IJL4w`
- If you see error: "Admin password not configured!" - repeat steps 1-4

## What's Fixed in This Deployment

✅ **Admin Password Security**
- Old password permanently disabled
- Only new password `TFOGeb9VO4=WypyRa3^zz!$udb8IJL4w` works
- Must be configured in Vercel environment variables

✅ **Withdrawal Management**
- Approve/Reject buttons disappear after action
- Status updates immediately (no refresh needed)
- Rejection refunds user balance automatically

✅ **Passkey Tracking**
- Shows "Used" status with timestamp
- Example: "Used at: 4/22/2026, 2:30:45 PM"
- Can't be reused after marked as used

✅ **Mobile Language Switching**
- Language selector now visible in dashboard header
- Works on mobile phones and tablets
- Changes persist with localStorage

✅ **Wallet Translation**
- "Wallet" word dynamically translates with language
- Works on desktop sidebar, mobile navigation, and header
- Supports all 7 languages

## Need Help?

If deployment fails:
1. Check the Build Logs in Vercel → Deployments
2. Verify env var is set correctly (no typos!)
3. Check that password value is: `TFOGeb9VO4=WypyRa3^zz!$udb8IJL4w`
