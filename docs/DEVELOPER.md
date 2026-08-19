# Developer & AI IDE Documentation

This guide provides technical specs, database structures, and development guidelines for developers and AI agents working on the Reverse Tech codebase.

---

## 🛠️ Technical Stack

- **Backend:** Node.js, Express.js.
- **File Uploads:** Multer (Gerber archives to `data/gerber-uploads`, project images to `public/uploads/projects`).
- **Authentication:** JSON Web Tokens (JWT) signed with a localized secret.
- **Frontend:** Vanilla HTML5, CSS3, and modern Vanilla ES6 Javascript. No external CSS frameworks are used (Tailwind-free), utilizing curated native CSS variables instead.
- **Fonts:** 
  - Arabic: **Cairo** (headings) & **Tajawal** (body)
  - English: **Inter** (headings) & **Outfit** (body)

---

## 📁 Directory Structure

```
├── backup-old/          # Archived legacy files and prototypes
├── data/                # Data persistence layer
│   ├── gerber-uploads/  # Zip/Rar PCB manufacturing archives
│   ├── projects.json    # Local JSON database for projects
│   ├── default-projects.json # Fallback initial project values
│   ├── pcb-pricing.json # Dynamic pricing parameters
│   └── pcb-orders.json  # Saved customer PCB requests
├── node_modules/        # Vendor packages
├── public/              # Static frontend assets
│   ├── uploads/         # Uploaded images (projects/ subfolder)
│   ├── admin.html       # Content and order management panel
│   ├── admin.css        # Dashboard styling rules
│   ├── main.html        # Public-facing homepage landing page
│   ├── style.css        # Core custom variables & layout styles
│   └── script.js        # Calculator logic & language toggle script
├── package.json         # Node manifest and dependencies
└── server.js            # Main backend application server
```

---

## 🔒 Security & Environments

Central credentials and settings are defined in [server.js](file:///d:/reverse tech/01- website/server.js) with fallback values:
- **Port:** `process.env.PORT || 3000`
- **Username:** `process.env.ADMIN_USERNAME || 'reversetech_admin'`
- **Password:** `process.env.ADMIN_PASSWORD || 'reversetech.2024'`
- **JWT Secret:** `process.env.JWT_SECRET || 'reverse-tech-please-change-this-secret'`

---

## 📡 API Endpoints Spec

### Public Endpoints
- `GET /api/projects` - Retrieves all current projects.
- `POST /api/pcb-quote` - Calculates quote based on submitted PCB parameters.
- `POST /api/pcb-orders` - Submits a new order and uploads Gerber file.
- `POST /api/login` - Authenticates admin and returns a JWT valid for 12 hours.

### Protected Endpoints (Requires `Authorization: Bearer <token>`)
- `POST /api/projects` - Adds a new project.
- `PUT /api/projects/:id` - Updates project details.
- `DELETE /api/projects/:id` - Deletes a project.
- `POST /api/projects/reset` - Restores list to default projects.
- `GET /api/pcb-pricing` - Retrieves raw PCB pricing parameters.
- `PUT /api/pcb-pricing` - Modifies PCB pricing settings.
- `GET /api/service-pricing/:service` - Retrieves pricing configurations for `printing`, `stencil`, `mechanical` services.
- `PUT /api/service-pricing/:service` - Updates pricing configurations for those services.
- `GET /api/pcb-orders` - Lists all submitted PCB requests.
- `PUT /api/pcb-orders/:id` - Updates order workflow status.
- `DELETE /api/pcb-orders/:id` - Deletes a PCB order and unlinks its Gerber file.
- `GET /api/service-images` - Gets service media files configured for sliders.
- `PUT /api/service-images/:service` - Saves custom media array for service sliders.
- `POST /api/upload-project-image` - Uploads a custom PNG/JPG image file.
- `POST /api/upload-service-media` - Uploads a media file (image/video) for sliders.

---

## ⚡ Performance & Caching Patterns

### Stale-While-Revalidate (SWR) Caching
The homepage and projects page implement local cache optimization.
1. When a user visits, project cards are immediately loaded from browser `localStorage` and rendered to the DOM, ensuring a **0ms loading flash**.
2. An asynchronous background fetch triggers (`GET /api/projects`) to check for changes on Supabase.
3. Once the database responds, the script seamlessly updates `localStorage` and updates the DOM if any additions, modifications, or order changes occurred.

---

## 🤖 Guidelines for AI Agents

1. **Anti-Caching Header Rules:** In [server.js](file:///d:/reverse tech/01- website/server.js), `express.static` uses custom headers to disable browser caching on HTML files. When adding new pages, ensure they do not conflict with these rules to keep local developer iteration instant.
2. **Resilient Mailer Configuration:** The nodemailer engine uses fallback routing. It automatically tries alternative ports and legacy hosts (`smtp.office365.com` and `smtpout.secureserver.net`) if primary GoDaddy environment variables fail connection checks. Do not simplify or bypass this fallback mechanism.
3. **Database & Pricing Fallbacks:** All user-facing price calculations (like `getPricing()` and `getServicePricing()`) must have local JSON file backups. If Supabase goes offline, always return fallbacks from `data/pcb-pricing.json` and default objects rather than throwing HTTP 500 errors to the client.

