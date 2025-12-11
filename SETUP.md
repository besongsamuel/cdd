# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Supabase**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL migration from `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor
   - Create storage buckets: `member-photos`, `founder-photos`, `event-photos` (all public)
   - Create an admin user in Authentication > Users

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Public site: http://localhost:5173
   - Admin login: http://localhost:5173/admin/login

## Initial Data Setup

After running the migration, you'll have:
- Regular programs pre-populated
- Initial church info record

You can update church info and add founders' images through the admin panel after logging in.

## Admin Access

1. Go to `/admin/login`
2. Use the credentials you created in Supabase
3. Access the dashboard at `/admin/dashboard`

## Features to Configure

- **Founders Images**: Upload founder images through Supabase Storage or update URLs in the admin panel
- **Regular Programs**: Already seeded, but can be modified in admin panel
- **Members**: Add leaders and regular members through the admin panel
- **Events**: Add upcoming events through the admin panel

## Troubleshooting

- **CORS Issues**: Make sure your Supabase project allows requests from `localhost:5173`
- **RLS Policies**: If you can't access data, check that RLS policies are correctly set
- **Image Uploads**: Ensure storage buckets are created and have proper policies


