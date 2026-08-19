# Reverse Tech - Medical Equipment Website

Reverse Tech is a bilingual website for a medical equipment and reverse engineering company. It combines a polished public-facing experience with a content management dashboard for projects, services, pricing, and customer orders.

## ✨ What’s included

- Bilingual Arabic/English experience with RTL/LTR switching
- Responsive homepage, services pages, order pages, and contact pages
- Interactive PCB quote calculator with Gerber upload support
- Service media slider with image and video support
- Admin dashboard for:
  - managing projects
  - updating service media and images
  - reviewing customer orders and contact messages
  - editing pricing configurations
- Favicon and branding support for browser tabs and mobile shortcuts

## 🛠 Tech stack

- Node.js + Express
- Static frontend pages under the public folder
- Supabase integration for persistent data and media storage (optional fallback available)
- JWT-based admin authentication

## 🚀 Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Start the server

```bash
node server.js
```

The app will run on port 3000 by default. You can override it with:

```bash
PORT=3001 node server.js
```

### 3) Open the site

Visit:

- http://localhost:3000
- or http://localhost:3001 if you used the override

## 🔐 Admin access

The default admin credentials are configured in the server environment variables:

- ADMIN_USERNAME
- ADMIN_PASSWORD

If you do not set them, the app uses built-in defaults.

## 📦 Optional configuration

For full persistence with Supabase, configure these environment variables:

- SUPABASE_URL
- SUPABASE_SECRET_KEY
- JWT_SECRET

If Supabase is not configured, the site still works for local browsing and will fall back to local storage for some media updates.

## 📁 Main folders

- public: frontend pages, styles, and scripts
- media: site media files
- data: JSON data and local fallback content
- server.js: Express server and API routes

## ✅ Notes & Recent Updates

Recent updates include:

- **Consistent Favicon configuration**: Replaced relative paths with uniform root-level `/favicon.png` with `type="image/png"` and `apple-touch-icon` across all 17 HTML files (both Arabic and English pages).
- **Service Slider Enhancements**: Resolved first-slide duplication and fixed deleted images reappearing by pulling media arrays exclusively from database/JSON stores instead of appending fallback default items.
- **Projects SWR Caching**: Implemented Stale-While-Revalidate caching pattern using `localStorage` on projects page and homepage to instantly load cached cards on page load (eliminating loading flash), followed by a background database query to dynamically update any new project cards in the DOM.
- **Robust Admin Pricing & Fallback**: Resolved potential ReferenceError script crashes on the admin panel by properly declaring global pricing caches and defaults. Added database fallback loading (`data/pcb-pricing.json`) on the backend server to keep front-end pricing calculators working even if Supabase is offline.
- **Dynamic SMT Stencil Options**: Connected the SMT Stencil page's thickness select options directly to the admin pricing database parameters, ensuring admin configurations update customer drop-down selections in real time.
- **Resilient Emailing (SMTP Fallback)**: Built a self-healing SMTP transporter that automatically attempts common mailer hosts (GoDaddy, Microsoft 365, cPanel secure mail) to bypass port/firewall blocks during production domain deployments.

