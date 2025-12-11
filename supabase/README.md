# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from Settings > API

## 2. Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/001_initial_schema.sql`
4. Run the SQL script

## 3. Create Storage Buckets

1. Go to Storage in your Supabase dashboard
2. Create the following buckets:
   - `member-photos` (Public: Yes)
   - `founder-photos` (Public: Yes)
   - `event-photos` (Public: Yes)

For each bucket, set the following policies:

### member-photos policies:
- **Public Access**: Allow public read access
- **Upload Policy**: Allow authenticated users to upload
  ```sql
  CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'member-photos' AND
      auth.role() = 'authenticated'
    );
  ```

### founder-photos policies:
- **Public Access**: Allow public read access
- **Upload Policy**: Allow authenticated users to upload
  ```sql
  CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'founder-photos' AND
      auth.role() = 'authenticated'
    );
  ```

### event-photos policies:
- **Public Access**: Allow public read access
- **Upload Policy**: Allow authenticated users to upload
  ```sql
  CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'event-photos' AND
      auth.role() = 'authenticated'
    );
  ```

## 4. Create Admin User

1. Go to Authentication > Users in your Supabase dashboard
2. Click "Add User" > "Create new user"
3. Enter an email and password for the admin user
4. Save the credentials - you'll use these to log into the admin panel

## 5. Configure Environment Variables

1. Create a `.env` file in the project root
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Notes

- The RLS policies currently allow any authenticated user to perform admin operations. In production, you should implement proper role-based access control by checking user metadata or creating an admin table.
- For production, consider adding more restrictive policies based on user roles.


