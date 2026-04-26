# 🛒 KelalShop: The Hybrid Importer Marketplace

KelalShop is a premium, high-performance marketplace platform built for the modern Ethiopian economy. It bridges the gap between local buyers and verified international shoppers/importers, combining traditional e-commerce listings with a bespoke "item request" service.

![Project Preview](https://github.com/oliyad-chala/kelalshop/blob/main/public/preview.png?raw=true) *(Note: Add your actual preview image here)*

---

## 🌟 Key Features

### 🏢 Dual-Role Ecosystem
- **Shoppers (Importers)**: Create professional storefronts, list imported goods, manage inventory, and provide custom shopping services.
- **Buyers**: Browse products, track orders, and interact directly with importers.

### 📦 Item Requests (Concierge Service)
- Buyers can post specific items they need (using links from Amazon, AliExpress, Shein, etc.).
- Shoppers can respond to these requests, quote prices, and handle the entire import process.

### 💬 Real-time Secure Chat
- Built-in negotiation system powered by **Supabase Realtime**.
- Direct buyer-to-shopper communication specifically linked to active orders and requests.

### 🛡️ Identity Verification (Trust System)
- Robust verification workflow where shoppers upload government-issued IDs.
- Verified shoppers receive the **"Verified Importer"** amber badge to build buyer confidence.

### 📊 Comprehensive Dashboard
- Dedicated, role-aware dashboards for managing products, incoming requests, and order status.

---

## 🛠️ Technical Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **State Management**: [React 19 Server Actions & `useActionState`](https://react.dev/reference/react/useActionState)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Realtime Services**: Supabase Realtime Channels
- **File Storage**: Supabase Storage Buckets (Avatars, Products, ID Documents)

---

## 🚀 Installation & Setup

### 1. Initial Setup
```bash
# Clone the repository
git clone https://github.com/oliyad-chala/kelalshop.git

# Install dependencies
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Preparation
Apply the complete schema by running the script in `supabase/schema.sql` inside your Supabase **SQL Editor**. This will:
- Create all relational tables (`profiles`, `products`, `orders`, etc.).
- Set up **PostgreSQL Triggers** for automatic profile management.
- Configure **Row Level Security (RLS)** policies to ensure data privacy.

---

## 📂 Project Structure

```text
├── app/                  # Next.js App Router (Pages, Layouts, API)
├── components/           # Reusable UI components
│   ├── auth/             # Sign-up and Login forms
│   ├── layout/           # Shared Navbar, Sidebar, Footer
│   ├── ui/               # Primary Atomic UI components (Buttons, Inputs)
│   └── chat/             # Realtime messaging components
├── lib/                  # Core logic and utilities
│   ├── actions/          # Next.js Server Actions (Auth, DB Updates)
│   ├── supabase/         # Supabase client configurations
│   └── utils/            # Shared formatting and validation logic
├── supabase/             # Database schema and seed files
└── types/                # TypeScript interfaces and DB types
```

---

## 🎨 Design System

KelalShop uses a **Navy & Amber** theme designed to feel reliable, secure, and professional.
- **Primary Navy**: For authority and trust.
- **Action Amber**: For highlights and verification badges.
- **Glassmorphism**: Subtle backgrounds and modern transitions throughout the dashboard.

---

## 📄 License

This project is licensed under the MIT License. Built with ❤️ for the Ethiopian marketplace.
