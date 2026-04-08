# KelalShop Marketplace

A hybrid e-commerce + service marketplace connecting Ethiopian buyers with verified local shoppers and importers. Built with Next.js 16 (App Router), Supabase, and Tailwind CSS.

## Features

- **Dual-Role System:** Users can sign up as Buyers or Shoppers.
- **Product Listings:** Shoppers can create, edit, and categorize products they import.
- **Buyer Requests:** Buyers can post links/descriptions of items they want, letting shoppers bid/create orders for them.
- **Realtime Chat:** Next.js integrated directly with Supabase Realtime to allow seamless communication for active orders.
- **Dashboard Management:** Dedicated UI for tracking orders, messages, and profile verification status.

## Tech Stack

- Next.js 16 (App Router)
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- Tailwind CSS v4

## Getting Started

1. Clone the repository
2. Run `npm install`
3. Set your environment variables (copy `.env.local.example` to `.env.local` and add your Supabase keys).
4. Apply the SQL schema located in `supabase/schema.sql` to your Supabase project using the SQL editor.
5. Run the development server: `npm run dev`

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the platform.

## Architecture Guidelines

- Server-side data fetching happens primarily in Next.js Server Components.
- Forms use React 19 `useActionState` tied to Next.js Server Actions.
- Supabase SSR tools are used across the app (Middleware, Service Roles, Next Requests) to handle cookie-based sessions robustly.
