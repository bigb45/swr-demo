# TEIA — SWR Storefront

B2B industrial components storefront built on **Next.js 16 App Router**, talking to a **Magento 2.4.8** backend exclusively via REST API.

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16.2.2 (App Router, Turbopack in dev) |
| React | 19.2.4 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| i18n | next-intl v4.9+ — locales: **de** (default), **en**, **fr** |
| Backend | Magento 2.4.8-p4 REST API |

## Getting Started

### 1. Prerequisites

A running Magento instance. For local development, start the PHP built-in server from the Magento project root:

```bash
php -S localhost:8000 -t pub/
```

### 2. Environment variables

Create `.env.local` in the project root (never commit this file):

```env
MAGENTO_URL=http://localhost:8000
MAGENTO_MEDIA_BASE_URL=http://localhost:8000
NEXT_PUBLIC_MAGENTO_MEDIA_BASE_URL=http://localhost:8000
MAGENTO_ADMIN_USER=nextjs_api
MAGENTO_ADMIN_PASSWORD=<password>
```

> **Note:** `MAGENTO_MEDIA_BASE_URL` and `NEXT_PUBLIC_MAGENTO_MEDIA_BASE_URL` must always be identical. A mismatch causes React hydration errors on every product image.
>
> On production (Apache from project root) both values should be `http://46.224.237.247/pub`.

### 3. Install and run

```bash
npm install
npm run dev       # http://localhost:3000
```

If you see Turbopack FATAL panics after an interrupted install, run a clean reinstall:

```bash
rm -rf node_modules .next
npm install
npm run dev
```

## Environments

| Environment | URL |
|---|---|
| Local frontend | http://localhost:3000 |
| Local Magento | http://localhost:8000 |
| Dev server | http://46.224.237.247/ |
| Magento admin | http://46.224.237.247/admin |

## Project Documentation

| File | Contents |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Full architecture, data flow, API reference, i18n rules, page status, remaining work, common pitfalls — read this before writing any code |
| [`DESIGN.md`](./DESIGN.md) | Design system: color tokens, typography, component rules, do's and don'ts |

## Key Conventions

- **i18n is mandatory.** Every user-visible string must be a translation key in all three message files (`src/messages/de.json`, `en.json`, `fr.json`). Never hardcode text.
- **Links** must use `Link` from `@/i18n/navigation`, never `next/link`.
- **Prices** must use `formatAmount(eurPrice)` from `useCurrency()`. Never hardcode a currency symbol.
- **No 1px solid borders** for layout sectioning — use tonal background color shifts instead (see `DESIGN.md`).
- **Cart page is intentionally SSR-disabled.** The cart lives in `localStorage`; skipping SSR prevents hydration mismatches.
