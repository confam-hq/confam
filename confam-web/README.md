# Confam Web

Confam Web is the frontend for a secure escrow and waybill-tracking platform built for Nigerian social commerce and informal trade flows. It gives vendors a merchant console for creating protected payment links, tracking deal status, and managing lock-and-release flows, while buyers can inspect items, pay securely, and verify delivery before funds are released.

This app is built with React, TypeScript, Vite, and React Router, and it connects to the Confam API for authentication, deal creation, bank resolution, payment verification, and live escrow lifecycle updates.

## Why Confam exists

Confam replaces blind WhatsApp transfers, paper-only waybill records, and informal handshakes with a transparent buyer-vendor escrow flow.

Key ideas:

- Buyers only pay into escrow once a deal is created.
- Vendors can create payment + waybill links without a full custom checkout flow.
- Funds are locked until the item is proven delivered and verified.
- Waybill manifests and proof-of-pack evidence are captured as part of the transaction record.
- Releasing funds is controlled through an OTP-based handoff and status timeline.

## Features

- Merchant dashboard with escrow metrics and deal filtering
- Secure vendor registration and login
- Deal creation form for item pricing, bank account setup, and delivery mode
- Shareable deal links for buyers and vendors
- Escrow lifecycle states like awaiting payment, funded, in transit, settled, dispute frozen, and refunded
- Payment initialization and callback verification flow
- Live proof capture and waybill scan experience for dispatch events
- Buyer and vendor role views in the deal room
- OTP release flow for settlement and payout authorization
- Search by deal code, item title, or buyer details

## Tech stack

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Lucide React
- Custom CSS + structured component layout

## Project structure

```text
src/
  api/                 API wrappers and axios client
  components/          reusable UI for auth, camera, waybill, escrow, layout
  pages/               public pages, dashboard, deal room, create flow
  types/               shared TypeScript models
  utils/               money formatting helpers
  App.tsx              routing and page composition
  main.tsx             app bootstrap
public/                static assets
.env                   frontend environment variables
```

## Prerequisites

Before you start, make sure you have:

- Node.js 18 or newer
- npm or another package manager compatible with the lockfile
- A running Confam API backend exposing the endpoints expected by the frontend

## Installation

```bash
npm install
```

## Environment configuration

Create or update your local `.env` file with values like:

```env
VITE_API_BASE_URL=http://confam-api.test/api/v1
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
```

Notes:

- `VITE_API_BASE_URL` is the base URL for the Confam API.
- `VITE_PAYSTACK_PUBLIC_KEY` is used for payment flow integration.
- If your backend runs on a different host or port, update the value accordingly.

## Running the app

Start the development server:

```bash
npm run dev
```

Then open the local Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Production build

```bash
npm run build
```

This compiles the application into the `dist/` folder for deployment.

## Linting

```bash
npm run lint
```

## Core user flows

### Vendor flow

1. Register or log in from the auth screens.
2. Open the merchant dashboard.
3. Create a deal with item details, pricing, and account information.
4. Share the generated deal link with the buyer.
5. Monitor the deal as payment, proof-of-pack, and dispatch updates arrive.
6. Release the payout when the buyer confirms delivery or after the required steps are met.

### Buyer flow

1. Open the public deal room from a shared link.
2. Review the item, escrow total, and shipping details.
3. Complete payment using the checkout flow.
4. Receive proof and verification updates as the vendor dispatches the item.
5. Inspect the package and confirm release using the assigned OTP.

## API integration notes

The frontend expects a backend that supports:

- `/auth/register`
- `/auth/login`
- `/vendor/deals`
- `/banks/resolve`
- `/deals`
- `/deals/:shortCode`
- `/deals/:shortCode/pay`
- `/deals/:shortCode/verify-payment`
- `/deals/:shortCode/dispatch`
- `/deals/:shortCode/release`
- `/deals/:shortCode/dispute`
- `/driver/:pingToken`
- `/driver/:pingToken/ping`

These are wired through the client in `src/api/dealApi.ts`.

## License

This project is currently configured for local development and internal product use. Add licensing information here if you plan to publish or distribute it externally.

## Contributing

If you are extending the Confam frontend:

- Prefer small, focused UI components.
- Keep API logic centralized in `src/api`.
- Reuse typed models in `src/types` instead of duplicating shapes.
- Maintain the app’s existing dark, trust-focused product design language.

## Notes

Confam Web is designed around a specific market reality: many transactions happen through informal logistics, WhatsApp, and motor-park dispatch systems. The app’s UI and flows mirror that environment while making the money movement auditable, verifiable, and safer for both buyer and seller.
