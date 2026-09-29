# GM RH Kitchen — Food Ordering Web App

A food ordering and delivery web application for a kitchen/catering business.
Customers browse the menu and order online; the kitchen manages orders from an
admin dashboard.

## Features

- **Customer flow** — browse the menu, add to cart, checkout, order confirmation
- **Admin dashboard** — manage menu items, orders, and order status
- **Authentication** — customer accounts with protected routes
- **Online payment** — Midtrans payment gateway integration
- **Responsive UI** — mobile-first layout with Tailwind CSS

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Database & auth | Supabase |
| Payments | Midtrans |
| Styling | Tailwind CSS |
| Icons | Lucide |

## Project structure

```
src/
├── app/
│   ├── (auth)/        # login / register routes
│   ├── (main)/        # customer-facing pages
│   ├── admin/         # admin dashboard
│   └── api/           # route handlers
├── components/        # UI components
├── context/           # app state
├── data/              # seed / static data
├── hooks/             # custom hooks
├── lib/               # helpers (Supabase client, utils)
│   └── middleware_backup.ts
├── proxy.ts
└── types/
```

## Setup

1. Clone and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in your Supabase and Midtrans keys.
3. Run the Supabase schema in `supabase/`.
4. Start the dev server:
   ```bash
   npm run dev
   ```

See `docs/` for the design planning notes.

## Notes

Vocational competency (ujikom) project — built end to end, from database schema
to payment integration and admin tooling.
