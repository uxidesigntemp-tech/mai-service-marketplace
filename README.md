# MAI SERVICE — FULL-STACK WEB APPLICATION

A complete, responsive, production-oriented home services marketplace called **MAI Service** (`MYPROJECT.AI` / `MAICART`). The platform connects customers (Project Owners) who need quality home services with vetted local trade professionals (Carpentry, PVC door installation, plumbing, electrical, painting, and property maintenance).

---

## 🎨 Mandatory MAI Service Brand Identity & Visual System

- **Brand Colors**:
  - **Primary Terracotta**: `#DE5426` / `#C8461C`
  - **Hero & Charcoal**: `#1E130F` / `#261611`
  - **Navy Brand Anchor**: `#14223E` (from official `mailogo1.png`)
  - **Background Canvas**: Warm Cream `#FAF8F5`
  - **Cards & Containers**: Clean White `#FFFFFF`
  - **Borders & Dividers**: Subtle Light `#EFECE6`
  - **Muted Text**: `#716B67`
  - **Rating Stars**: Amber Gold `#F59E0B`
- **Typography**: Plus Jakarta Sans (Primary UI & Display) + Inter (Body).
- **Brand Assets**: Official `mailogo1.png` & `mai_logo_white.png` incorporated into public headers, footers, receipts, and persistent dashboard sidebar.
- **Dashboard Reference Layout**: Follows persistent left sidebar, top workspace breadcrumb and search navigation, metric summary cards, empty states, and recommended professionals grid.

---

## 🚀 Key Functional Modules & Implemented Workflows

### 1. Public Service Discovery (Unauthenticated Experience)
- **Public Header & Footer**: Instant navigation across Home, Categories, Services, Professionals, How It Works, and Login / Sign Up modal.
- **Home Page**: Hero keyword search, popular trade categories with live counters, featured trade specialists, popular services, 4-step process guide, and trust & insurance verification.
- **Category Hierarchy**: Full multi-tier data hierarchy:
  $$\text{Category} \longrightarrow \text{Subcategory} \longrightarrow \text{Services} \longrightarrow \text{Service Details}$$
  *Example*: `Carpenter` $\rightarrow$ `Door Installation` $\rightarrow$ `PVC Door Installation (£100/hr)`.
- **All Services Directory**: Dynamic keyword search, category filtering, pricing model filter (`hourly` vs `fixed`), and price range sorting.
- **Service Details Page**: Complete overview with inclusions checklist, exclusions, preparation requirements, assigned specialist profile, and direct booking trigger.
- **Professionals Directory & Profile**: Verified trade professionals (`Thomas Jenkins`, `David Miller`, `Marcus Lee`, `Liam O'Connor`, `Sarah Green`, `Elena Rostova`), verified ID badges, CIPHE/NICEIC certifications, bio, services offered, and genuine client reviews.

### 2. Complete 8-Step Booking Workflow
1. **Select Service**: Preserves service metadata and authoritative backend rates.
2. **Enter Booking Details**: Selects saved address from user's address book or custom address, duration/units, and notes.
3. **Select Professional**: Preserves selected professional or picks from eligible specialists.
4. **Select Date & Time**: Morning, midday, or afternoon appointment window.
5. **Review Booking**: Authoritative backend calculation:
   $$\text{Subtotal} = \text{Unit Rate} \times \text{Duration (or Qty)}$$
   $$\text{Total} = \text{Subtotal} + \text{Platform Fee (5\%)} - \text{Discount}$$
6. **Confirm Booking**: Server-side validation and unique reference generation (`MAI-BK-XXXXX`).
7. **Modular Payment**: Dev-safe payment adapter processing transactions and generating payment records (`MAI-PAY-XXXXX`).
8. **Confirmation Screen**: Live confirmation with direct navigation to My Bookings and Dashboard.
- **Auth-Gated Persistence**: If an unauthenticated visitor clicks "Book Now", login/registration preserves their selected service and returns them directly to complete the booking.

### 3. Customer Dashboard & Account Management
- **Dashboard Home**: Derived backend metrics (Total Bookings, Upcoming & Active Visits, Lifetime Spend £), empty states, and quick actions.
- **My Bookings**: Filter by status (`Upcoming`, `In Progress`, `Completed`, `Cancelled`), view details modal, cancel booking action, and pay booking action.
- **Payments & Receipts**: Verified payment records, status tracking (`PAID`), and printable official VAT invoice receipt modal.
- **Saved Items**: Persistent shortlist for both services and professionals.
- **Direct Messaging**: In-app conversation threads with booked professionals.
- **My Addresses**: Structured address book (Add, Edit, Delete, Set Default Address).
- **Notifications Centre**: Event-driven alerts with read/unread tracking and navigation links.
- **Settings & Help**: Email and dispatch notification toggles, password updates, FAQs accordion, and support ticket system (`MAI-TCK-XXXXX`).

### 4. Security & Resource-Level Authorization (Workflow G)
- **Password Security**: PBKDF2 hashing with unique cryptographic salt per user.
- **Protected Endpoints**: Bearer token session authentication and cookie handling.
- **Ownership Isolation**: Customers can strictly access only their own bookings, payment records, addresses, and private conversation threads. Attempts to access another customer's record return `403 Forbidden`.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: Single-Page React 18 Application, Tailwind CSS (brand tokens configured), Lucide Icons, Plus Jakarta Sans font.
- **Backend**: Node.js & Express.js REST API with modular routers (`server/routes/*`), validation middleware, centralized error handling, and CORS.
- **Database Architecture**:
  - Production Schema: `prisma/schema.prisma` with models for `User`, `Professional`, `Category`, `Subcategory`, `Service`, `Address`, `Booking`, `Payment`, `SavedItem`, `Conversation`, `Message`, `Notification`, and `SupportTicket`.
  - Structured Self-Contained Store: `server/data/store.js` + `server/data/db.json` with persistence across server restarts.

---

## 📂 Project Directory Structure

```
mai-service-marketplace/
├── client/
│   ├── public/
│   │   ├── assets/              # High-res logos & image assets
│   │   ├── app.js               # Main React SPA & Workflow controller
│   │   ├── dashboard-components.js # Reusable dashboard, sidebar & pages
│   │   └── index.html           # HTML5 entrypoint with brand Tailwind tokens
│   └── src/                     # Source directory
├── dist/                        # Production build bundle
├── prisma/
│   └── schema.prisma            # PostgreSQL Prisma ORM relational schema
├── server/
│   ├── data/
│   │   ├── db.json              # Persistent database file
│   │   ├── seed.js              # Initial database seed script
│   │   └── store.js             # Data store & CRUD interface
│   ├── middleware/
│   │   ├── auth.js              # Session auth, role checks, password hashing
│   │   ├── errorHandler.js      # Centralized error handler
│   │   └── validation.js        # Server-side input validation
│   ├── routes/
│   │   ├── addressRoutes.js     # /api/addresses
│   │   ├── authRoutes.js        # /api/auth
│   │   ├── bookingRoutes.js     # /api/bookings
│   │   ├── categoryRoutes.js    # /api/categories
│   │   ├── messageRoutes.js     # /api/messages
│   │   ├── notificationRoutes.js# /api/notifications
│   │   ├── paymentRoutes.js     # /api/payments
│   │   ├── professionalRoutes.js# /api/professionals
│   │   ├── savedRoutes.js       # /api/saved
│   │   ├── serviceRoutes.js     # /api/services
│   │   ├── subcategoryRoutes.js # /api/subcategories
│   │   ├── supportRoutes.js     # /api/support
│   │   └── userRoutes.js        # /api/users
│   └── server.js                # Express REST API application
├── tests/
│   └── acceptance.test.js       # End-to-end acceptance suite (Workflows A - H)
├── .env.example                 # Documented environment variables
├── build.js                     # Production bundler & verifier
├── package.json                 # Node.js project manifest & scripts
└── verify.js                    # Component verification script
```

---

## ⚙️ Installation & Running the Application

### 1. Prerequisites
- Node.js (v18.0.0 or higher, tested on Node v24)
- npm

### 2. Install Dependencies
```bash
npm install
```

### 3. Re-seed Database (Optional)
```bash
npm run seed
```

### 4. Build Production Distribution
```bash
npm run build
```

### 5. Run the Server
```bash
npm start
```
The server will start on:
- **Application URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`

### 6. Run Acceptance Tests
To execute the automated end-to-end verification covering Workflows A through H:
```bash
npm test
```

---

## 🔐 Demo Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Customer (Primary)** | Alex Morgan | `alex@example.com` | `Password123!` |
| **Customer (Secondary)** | Sarah Jenkins | `sarah.b@example.com` | `Password123!` |
| **Professional (Carpenter)** | Thomas Jenkins | `thomas@example.com` | `Password123!` |
| **Professional (Plumber)** | David Miller | `david.m@example.com` | `Password123!` |

*(The login modal also provides a 1-click "Fill Demo (Alex Morgan)" button for instant authentication testing).*

---

## 🧪 Acceptance Test Results Summary

- **Workflow A: Public Browsing** — Verified category retrieval, Carpenter subcategories (`Door Installation`, `Cupboards & Drawers`, `Kitchen Fittings`), and PVC Door Installation (£100/hr).
- **Workflow B: Professional Discovery** — Verified name search, trade filtering, and professional profile with service catalog.
- **Workflow C & D: Registration & Auth-Gated Booking** — Verified registration, login session, and redirect preservation.
- **Workflow E: Complete Booking Workflow** — Verified authoritative price calculation, `MAI-BK-XXXXX` reference generation, payment processing, and linking in My Bookings.
- **Workflow F: Dashboard & All Modules** — Verified addresses, saved items, messaging threads, notifications, and support tickets.
- **Workflow G: Resource-Level Authorization** — Verified Customer A cannot access Customer B's bookings, payments, or conversations (`403 Forbidden`).
- **Workflow H: Error Handling & Server-Side Validation** — Verified duplicate emails (`409 Conflict`), incorrect passwords (`401 Unauthorized`), and invalid booking payloads (`400 Bad Request`).
