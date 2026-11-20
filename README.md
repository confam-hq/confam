# Confam

Confam is a social-commerce escrow and delivery-tracking app. Buyers can fund a deal, vendors can attach packing and waybill proof, and buyers can confirm delivery to release funds. A dispute freezes escrow for admin review; funds are not automatically released while a dispute is open.

The project has two parts:

- `confam-api/` — Laravel 13 JSON API, database, escrow workflow, and integrations.
- `confam-web/` — React 19 and TypeScript single-page app, built with Vite.

## Features

- Vendor registration, login, and deal dashboards.
- Shareable deal rooms with item, payment, and delivery status.
- Paystack checkout and transaction verification; webhooks are signature-checked.
- Bank listing and Nigerian account resolution through Paystack.
- Packing-video upload or live capture, SHA-256 integrity checking, and optional Gemini proof audit.
- Waybill receipt OCR and vendor-entered dispatch details.
- Driver location pings through a shareable, no-install link.
- OTP-based settlement and dispute freeze.
- Buyer and vendor dashboards, with admin dispute resolution.
- 5% vendor-deducted platform fee for new deals; existing deals retain their original fee terms.
- Terms, Privacy, and Cookies pages (drafts pending entity/jurisdiction and legal review).

## Requirements

- PHP 8.3 or later and Composer.
- Node.js and npm.
- SQLite (the default database), or a database supported by Laravel.

## Local development

### 1. Configure and start the API

In PowerShell:

```powershell
cd confam-api
composer install
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}
php artisan key:generate
```

The example environment uses SQLite. Ensure `database\database.sqlite` exists, then run migrations:

```powershell
if (-not (Test-Path database\database.sqlite)) {
    New-Item -ItemType File database\database.sqlite | Out-Null
}
php artisan migrate
php artisan storage:link
```

Start the API:

```powershell
php artisan serve
```

By default, the API is available at `http://127.0.0.1:8000` and its v1 endpoints are under `/api/v1`.

### 2. Configure and start the web app

In a second terminal:

```powershell
cd confam-web
npm install
```

Create `confam-web\.env.local` with the local API URL:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Start Vite:

```powershell
npm run dev
```

Open the URL Vite prints (by default, `http://localhost:5173`). The API's `FRONTEND_URL` in `confam-api\.env` should match this origin for cross-origin requests; the example already uses `http://localhost:5173`.

## Integrations and demo mode

The API reads integration settings from `confam-api/.env`:

| Variable | Purpose |
| --- | --- |
| `PAYSTACK_SECRET_KEY` | Server-side Paystack transactions, account resolution, and transfers |
| `GEMINI_API_KEY` | Gemini waybill OCR and packing-proof audit |
| `GEMINI_MODEL` | Gemini model name |
| `FRONTEND_URL` | Web app origin allowed by the API and used for payment callbacks |

Set `VITE_PAYSTACK_PUBLIC_KEY` in `confam-web/.env.local` to configure the browser-side Paystack popup. A valid public key and the Paystack popup SDK are required for native checkout. Do not commit `.env` files or put secret keys in frontend variables; `VITE_` variables are included in the browser build.

Without a configured Paystack secret key, the API uses a local mock checkout and mock settlement references. Without a Gemini API key, OCR and proof-audit endpoints return demo data. These fallbacks are for local development only and do not process real payments or verify real evidence. Configure valid service credentials before evaluating live flows.

## Useful commands

From `confam-web/`:

```powershell
npm run build
npm run lint
```

From `confam-api/`:

```powershell
php artisan test
```

## API overview

All API routes are prefixed with `/api/v1`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API health check |
| `POST` | `/auth/register`, `/auth/login` | Buyer or vendor account access |
| `GET` | `/banks`, `POST /banks/resolve` | Bank list and account lookup |
| `POST` | `/deals` | Create a deal |
| `GET` | `/deals/{short_code}` | View a deal |
| `POST` | `/deals/{short_code}/pay` | Initialize checkout |
| `POST` | `/deals/{short_code}/verify-payment` | Verify checkout callback |
| `POST` | `/webhooks/paystack` | Receive Paystack webhook events |
| `POST` | `/deals/{short_code}/proof` | Upload and audit packing video |
| `POST` | `/deals/{short_code}/parse-waybill` | OCR a waybill receipt |
| `POST` | `/deals/{short_code}/dispatch` | Submit packing proof and dispatch information |
| `GET`, `POST` | `/driver/{ping_token}`, `/driver/{ping_token}/ping` | View a driver manifest and submit a location ping |
| `POST` | `/deals/{short_code}/release` | Release escrow with an OTP |
| `POST` | `/deals/{short_code}/confirm-delivery` | Buyer confirms receipt and condition |
| `POST` | `/deals/{short_code}/dispute` | Buyer or vendor freezes escrow for admin review |
| `GET` | `/admin/disputes`, `/admin/revenue` | Admin dispute queue and fee totals |
| `POST` | `/admin/deals/{short_code}/resolve` | Admin releases funds or submits a buyer refund |

New deals charge buyers the item and delivery amounts only. At settlement, Confam deducts 5% of those proceeds from the vendor payout. Historical deals retain their previously displayed pricing. Neither buyer non-response nor a pending dispute triggers automatic payout.

Admin registration is intentionally disabled. A trusted operator must assign the `admin` role to an account through a controlled administrative process before it can access the dispute queue or resolve cases.

## Project layout

```text
confam-api/
  app/                 API controllers, models, and escrow/AI services
  database/migrations/ Database schema
  routes/api.php       Versioned API routes
  tests/               Laravel/Pest tests
confam-web/
  src/api/             API client
  src/components/      Shared UI components
  src/pages/           App pages and role dashboards
```