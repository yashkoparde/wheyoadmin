# Wheyo Admin

> **Brutalist, high-performance mission control for The Protein Kitchen.**

Wheyo Admin is a cutting-edge, brutally efficient web dashboard tailored for real-time operations, product management, and analytics. Powered by a modern React stack and Supabase backend, it delivers uncompromised performance and a distinct, high-contrast user interface.

---

## Features

- **Mission Control Dashboard**: Real-time performance analytics and vital business metrics at a glance using `recharts`.
- **Live Order Feed**: Instantaneous order tracking and processing. Never miss a beat when operations get busy.
- **Product CRM**: Complete CRUD capabilities for your protein product catalog, including inventory management and pricing.
- **Coupon Manager**: Advanced promotional engine with expiry dates, minimum order values, and precise usage limits.
- **Order History**: Filterable, searchable, and exportable order records (PDF export via `jspdf`).
- **Secure Authentication**: Integrated with Supabase Auth for robust login and session management.

---

## Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend & Auth**: [Supabase](https://supabase.com/)
- **Animations**: [Motion](https://motion.dev/) (Framer Motion)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) & jspdf-autotable

---

## Getting Started

### Prerequisites

Ensure you have Node.js installed (v18+ recommended) and Git.

### 1. Clone the repository

```bash
git clone https://github.com/yashkoparde/wheyoadmin.git
cd wheyoadmin
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory and add your Supabase credentials. Refer to `.env.example` if available.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Build for Production

To create a highly optimized production build:

```bash
npm run build
```

This will run to outputs in the `dist` folder. The chunking limits are configured in `vite.config.ts` to ensure smooth deployment on platforms like Vercel.

---

## Deployment (Vercel)

This project is optimized for deployment on Vercel. A `vercel.json` file is included to handle SPA routing seamlessly:

1. Push your code to a GitHub repository.
2. Sign in to Vercel and create a new project.
3. Import your repository.
4. Add your Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel dashboard.
5. Click **Deploy**.

---

## Design Philosophy

Wheyo Admin embraces a "Brutalist" design language:
- High contrast, dark-themed aesthetics (`bg-brand-dark`, neon accents).
- Monospaced fonts for tabular and technical data (`JetBrains Mono`).
- Micro-animations providing immediate, satisfying tactile feedback on critical actions.
- Information density prioritization—showing you what you need, when you need it.

---

*Engineered for performance. Built for scale.*
