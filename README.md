# City of David Church Website

A modern, responsive website for City of David church built with React, TypeScript, Material-UI, and Supabase.

## Features

- **Landing Page**: Beautiful hero section with church information and founders
- **Contact Us**: Contact form with church address and phone information
- **Our Members**: Display of church leaders and regular members
- **Events & Programs**: Regular program schedule and interactive calendar for events
- **Requests**: Submit prayer requests, support requests, and testimony requests
- **Admin Panel**: Full CRUD interface for managing all content

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI (MUI)
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build Tool**: Vite
- **Calendar**: react-big-calendar

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd cdd
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Follow the instructions in `supabase/README.md`
   - Create a `.env` file with your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout/         # Header, Footer
│   ├── Admin/         # Admin panel components
│   └── common/        # Common utilities
├── pages/             # Page components
│   └── admin/         # Admin pages
├── services/          # Supabase service functions
├── context/           # React context (Auth)
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and constants
```

## Admin Access

1. Create an admin user in Supabase (see `supabase/README.md`)
2. Navigate to `/admin/login`
3. Log in with your admin credentials
4. Access the admin dashboard at `/admin/dashboard`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

The application can be deployed to:
- Vercel
- Netlify
- Any static hosting service

Make sure to set the environment variables in your hosting platform's settings.

## License

© 2024 City of David. All rights reserved.
Designed by AfermathTechnologies
