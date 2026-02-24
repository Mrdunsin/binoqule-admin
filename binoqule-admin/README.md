# Binoqule Admin Panel

A full-featured CMS for managing the Binoqule TMT law newsletter.

## Features
- ✅ Secure authentication
- ✅ Posts management (create, edit, publish)
- ✅ Team members management
- ✅ Subscriber list management
- ✅ Newsletter composition & sending
- ✅ "Ask A Lawyer" submissions dashboard

## Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Email**: Resend API
- **Editor**: TipTap (rich text)
- **UI Components**: shadcn/ui

## Setup Instructions

### 1. Supabase Setup
Run the SQL in `supabase-schema.sql` in your Supabase SQL editor.

### 2. Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
```

### 3. Install & Run
```bash
npm install
npm run dev
```

Admin panel will be at http://localhost:3000

## Deployment
Deploy to Vercel:
```bash
vercel --prod
```

Your live site on Netlify will auto-rebuild when you publish posts via webhook.
