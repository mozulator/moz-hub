## Budget Tracker – Product Requirements Document (PRD)

### 1. Purpose & Scope

- **Goal**: A single-user web app that helps you understand where your money goes each month by importing bank transaction files, categorizing payments into custom payment types, and summarizing spending.
- **Deployment**: Local-only (personal financial data - not deployed to cloud services).
- **Scope (v1)**:
  - One authenticated user (you) with simple login (no registration, no password reset).
  - Upload/import monthly bank exports and store payments in a **SQLite** database.
  - Manage **Payment Types** (name, color, icon, optional unsubscribe links).
  - Tag payments with a payment type.
  - **Payments page**: filter by month, view & edit payments.
  - **Overview page**: per-month summary by payment type.
  - **Payment Type detail pages**: all-time history per type + unsubscribe links.

---

### 2. Core User Flows (High-Level)

- **Log in**
  - Navigate to the app → see login screen.
  - Enter username + password → on success, redirect to **Overview** (or **Payments**) as default landing.

- **Import a new month of payments**
  - Go to **Payments**.
  - Select or confirm month/year.
  - Upload the bank `.txt` file for that month.
  - App parses rows into payments (date, recipient, amount, etc.).
  - Show import summary (number of new payments, duplicates skipped, errors).

- **Manage payment types**
  - Go to **Payment Types** page.
  - Create a new type: set name, choose icon (Lucide), choose color, optional description.
  - Edit or delete existing types (with safeguards if there are linked payments).

- **Tag payments with payment types**
  - On **Payments** page, filter by month.
  - For each payment, set or change its **Payment Type** (e.g. Subscriptions, Food, Loan).
  - Support quick editing (inline select, keyboard-friendly if possible).

- **View monthly overview**
  - Go to **Overview** page.
  - Select month/year.
  - See grid of cards, one per payment type, each showing:
    - Total amount spent that month for that type.
    - Basic metadata (type name, icon, color).
  - Click a card to jump to that payment type’s detail page for deeper inspection.

- **View all-time history for a payment type + unsubscribe**
  - From **Payment Types** list or Overview, open a single Payment Type detail page.
  - See a list of all payments with that type, across all months, sorted by date (newest first or configurable).
  - For subscription-like types:
    - For each service or recipient (e.g. Netflix, Disney+), store an **unsubscribe URL**.
    - Show a clear button/link “Unsubscribe from \<Service\>” that opens the URL in a new tab.

---

### 3. Front-end (Architecture & Features)

#### 3.1 Tech Stack & Architecture (Front-end)

- **Core technologies**:
  - **HTML, JavaScript, Tailwind CSS (no custom CSS files)**.
  - **Lucide icons** for iconography.
  - Rendered via a Node.js backend:
  - Server-rendered pages (e.g. Express + basic view engine or HTML templates) with sprinkles of JavaScript for interactivity.
  - **Design quality**: Follow the principles in `designskill.md` (bold, intentional aesthetic direction; production-grade details; no generic “AI slop” patterns) and take strong layout/motion inspiration from `attio.com` (clean SaaS UI, layered cards, polished interactions) while keeping the overall tone minimal, black-and-white, and Apple-like.

- **Routing (front-end)**:
  - `/login` – login form.
  - `/overview` – monthly overview grid.
  - `/payments` – monthly payments list, import, and filtering.
  - `/payment-types` – list & manage payment types.
  - `/payment-types/:id` – detail view for a single payment type (all-time history + unsubscribe links).

#### 3.2 Page/Screen Requirements

- **Login Page (`/login`)**
  - Minimal, centered login card.
  - Fields: username, password, submit button.
  - Error state for invalid credentials.
  - On success: redirect to default page (likely `/overview`).

- **Overview Page (`/overview`)**
  - Controls:
    - Month/year selector (e.g. dropdowns or a single month picker).
  - Content:
    - Grid of cards, one per **Payment Type** that has spending for the selected month.
    - Each card shows:
      - Icon (Lucide), type name.
      - Total amount spent for that month (in Serbian dinars).
      - Optional subtext: number of payments, % of monthly total.
    - Cards are clickable → go to `/payment-types/:id?month=YYYY-MM`.

- **Payments Page (`/payments`)**
  - Controls:
    - Month/year filter.
    - Button to **Import file** (bank `.txt` for that month).
  - Table columns:
    - ID (simple incremental per payment in UI).
    - Date.
    - Recipient.
    - Payment Type (select or pill; editable).
    - Amount (RSD).
  - Features:
    - Inline editing of Payment Type (dropdown using existing types).
    - Optional text filter (search by recipient).
    - Pagination or virtual scroll if needed.

- **Payment Types List Page (`/payment-types`)**
  - Table or card list of all payment types:
    - Name.
    - Icon.
    - Color (displayed as pill/badge).
    - Number of associated payments.
  - Actions:
    - Add new payment type.
    - Edit (name, icon, color).
    - Delete (with confirmation, and clear behavior defined for existing payments – see backend).

- **Payment Type Detail Page (`/payment-types/:id`)**
  - Header:
    - Type name, icon, color.
    - Aggregate stats: total all-time amount, total number of payments.
  - Controls:
    - Optional filters by date range (future enhancement; v1 can show all with simple pagination).
  - Content:
    - List/table of all payments with this type (all months), sorted by date.
    - Group or highlight by **Recipient** so that each recurring service (e.g. “Netflix”) is easy to spot.
  - **Unsubscribe links**:
    - For each recurring service/recipient, allow storing one or more unsubscribe URLs.
    - On the page, show a clear button/link “Unsubscribe from \<Service\>” that navigates to the stored URL.

#### 3.3 Front-end State & Behavior

- **Auth state**:
  - Use server-side session; front-end sees logged-in state via protected routes.
  - Display basic user indicator and logout option in the top-right.

- **Filtering & navigation**:
  - Month/year selections should be reflected in URLs (query params) so pages are shareable and reload-safe.
  - Changes in payment types or new imports should immediately reflect across pages (reload or lightweight async refresh).

---

### 4. Back-end (Architecture & Features)

#### 4.1 Tech Stack

- **Node.js** with an HTTP framework (**Express**).
- **Prisma** ORM for database access.
- **SQLite** as primary database (local file-based, no external services).
- **Authentication & sessions**:
  - Single user seeded in DB.
  - Password hashed with bcrypt.
  - Session-based auth with secure cookies.

#### 4.2 Data Model (Prisma – Proposed)

_Exact schema to be finalized with you; below is a starting point._

- **User**
  - `id`
  - `username`
  - `passwordHash`

- **PaymentType**
  - `id`
  - `name` (e.g. “Subscriptions”)
  - `icon` (Lucide icon name)
  - `color` (Tailwind color identifier or hex that we map to Tailwind classes)
  - `description` (optional)
  - Timestamps: `createdAt`, `updatedAt`

- **Service** (for unsubscribe links / recurring services) – proposed
  - `id`
  - `paymentTypeId` → `PaymentType`
  - `name` (e.g. “Netflix”)
  - `unsubscribeUrl` (optional)

- **Payment**
  - `id`
  - `date` (date of purchase)
  - `recipient` (raw text from bank + optional normalized form)
  - `amount` (numeric, stored in RSD)
  - `paymentTypeId` (nullable until tagged)
  - `serviceId` (optional; link to Service if we normalize by recipient)
  - `rawData` (JSON or text, optional, holding original row for traceability)
  - `monthKey` (e.g. `"2025-11"` for fast monthly queries)
  - Timestamps: `createdAt`, `updatedAt`

#### 4.3 Authentication & Authorization

- **Requirements**
  - Only you can log in.
  - No registration or password reset flows.

- **Implementation (proposed)**
  - Hardcode a single `User` record in the DB seed, or derive username/password from environment variables.
  - `/login` POST:
    - Validate credentials, set signed session cookie on success.
  - Protected routes (`/overview`, `/payments`, `/payment-types`, `/payment-types/:id`) require a valid session.
  - `/logout` route clears session.

#### 4.4 Importing Bank `.txt` Files

- **Upload**
  - Endpoint: `POST /payments/import?month=YYYY-MM` (or month passed in request body).
  - Accept single text file (multipart/form-data).

- **Parsing**
  - Parsing logic tailored to your bank’s `.txt` export format (columns, delimiters, date formats, decimal formats).
  - Steps:
    - Validate file encoding & structure.
    - Map columns to `Payment` fields (date, recipient, amount, etc.).
    - Convert amounts to numeric format and normalize date.
    - Derive `monthKey` from transaction date.

- **Import rules**
  - Idempotent behavior: avoid inserting the same row twice (e.g. by hashing a combination of date + amount + recipient + reference).
  - Associate all created payments with the appropriate `monthKey`.
  - Return summary:
    - Count of new payments inserted.
    - Count of duplicates skipped.
    - Any rows that could not be parsed (with reasons).

#### 4.5 API Surface (High-Level, to be refined)

- **Auth**
  - `POST /login`
  - `POST /logout`

- **Payments**
  - `GET /payments?month=YYYY-MM`
  - `POST /payments/import?month=YYYY-MM`
  - `PATCH /payments/:id` (update payment type, maybe recipient normalization, etc.)

- **Payment Types**
  - `GET /payment-types`
  - `POST /payment-types`
  - `PATCH /payment-types/:id`
  - `DELETE /payment-types/:id` (define behavior for existing payments: either disallow delete or set their type to null/default)

- **Payment Type Detail / Services**
  - `GET /payment-types/:id` (with optional date filters)
  - `POST /payment-types/:id/services` (create service with unsubscribe URL)
  - `PATCH /services/:id`
  - `DELETE /services/:id`

#### 4.6 Security & Performance

- **Security**
  - Use HTTPS in production (handled by Render).
  - Store secrets (session secret, DB URL, admin credentials) in environment variables.
  - Protect all non-login routes with auth middleware.
  - Basic input validation on all endpoints.

- **Performance**
  - Indexes on `Payment.monthKey`, `Payment.paymentTypeId`, `Payment.date`.
  - Consider simple pagination for large tables.

---

### 5. Design (UX & Visual System)

#### 5.1 Overall Style

- **Look & feel**
  - Minimal, clean, professional.
  - Black-and-white base palette with restrained use of subtle grays, plus a single, carefully-chosen accent color where needed.
  - Blend **Apple-like refinement** (generous white space, precise alignment, subtle depth) with an **Attio-inspired SaaS feel**: layered cards, structured grids, and polished micro-interactions.
  - Use accent color primarily for:
    - Payment type accents (badges, icons, cards).
    - Primary CTAs and navigation highlights.
    - Feedback states (success, error, warnings) – still subtle and consistent.

- **Typography**
  - Follow `designskill.md` typography guidance:
    - Use a **distinctive display font** for headings and a **refined, highly-readable body font** (avoid generic system defaults like Arial/Roboto/Inter and overused “standard AI” pairings).
    - Establish a clear, consistent typographic scale (H1–H4, body, caption) with spacing and weight that feels as intentional and polished as a high-end SaaS app like Attio.
  - Maintain excellent readability and contrast in a mostly light (white/near-white) theme.

#### 5.2 Layout & Components

- **Shell**
  - Top navigation bar or minimal sidebar:
    - App name / logo.
    - Links: Overview, Payments, Payment Types.
    - User badge + logout.
  - Content area with max width and centered alignment on large screens.
  - Responsive layout that scales gracefully down to tablet/small screens.

- **Key components (Tailwind-only)**
  - **Cards**: used on Overview and Payment Types.
    - Rounded corners, subtle border (`border border-zinc-200`), and refined shadows that echo Attio’s layered panels (slightly elevated, but never heavy or noisy).
  - **Tables**: used on Payments and Payment Type detail.
    - Alternating row backgrounds, sticky header for long lists.
  - **Forms**: login, add/edit payment types, add edit services.
    - Consistent input styling (rounded, subtle border, focus ring) with Attio-like clarity and spacing.
  - **Buttons**:
    - Primary, secondary, and subtle icon buttons (e.g. edit, delete).
  - **Badges/Pills**:
    - Show payment type color accent + name.

#### 5.3 Iconography (Lucide)

- Use **Lucide icons** for:
  - Navigation items (Overview, Payments, Payment Types).
  - Payment Type icons (user selectable from a curated list).
  - Action icons (edit, delete, external link, unsubscribe).
- Implementation:
  - Include via CDN or as SVG sprites (to be decided).
  - Keep icon sizes and stroke width consistent across the app, and use motion/hover states inspired by high-end SaaS apps like Attio (subtle scale, opacity, or color shifts—never gimmicky).

---

### 6. Local Development Setup

- **Repository**
  - Initialize a GitHub repo for the project.
  - Branch strategy:
    - `master` as the main branch.
    - Feature branches merged into `master` via PRs (optional for solo dev but recommended).

- **Environment configuration**
  - `.env` (not committed) with:
    - `DATABASE_URL` (SQLite file path)
    - `SESSION_SECRET`
  - Template `.env.example` checked into repo.

- **Local deployment**
  - Run `npm install` to install dependencies.
  - Run `npx prisma migrate dev` to set up the database.
  - Run `npm run seed` to create the admin user.
  - Run `npm run dev` to start the development server.

- **Note**: This app is designed for local-only use due to personal financial data. Do not deploy to cloud services.

---

### 7. Open Questions / Decisions to Confirm

To avoid assumptions, these points need your input before implementation:

- **Bank `.txt` format**
  - What is the exact structure (delimiters, column order, header row, date & amount format)?
  - Are there multiple accounts in one file or one account per file?

- **Front-end architecture**
  - Do you prefer:
    - **Option A**: Simple server-rendered pages (Express + templates + light JS).
    - **Option B**: SPA with a front-end framework (e.g. React) on top of the Node backend?

- **Unsubscribe links**
  - Should unsubscribe URLs be:
    - Stored **per service/recipient** (e.g. one entry for “Netflix” reused across all payments)?
    - Or **per individual payment** (each row may have its own URL, but more repetitive)?

- **Deletion behavior**
  - When deleting a **Payment Type**, what should happen to its payments?
    - Disallow delete if payments exist?
    - Allow delete but set their type to `null`?

- **Default landing page**
  - After login, should the app go to **Overview** or **Payments** by default?

Once these are confirmed, we can lock the architecture and start implementing the backend skeleton, Prisma schema, Tailwind setup, and the initial page layouts.


