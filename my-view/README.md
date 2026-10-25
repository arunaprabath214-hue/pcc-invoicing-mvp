# PCC MY VIEW

Responsive Next.js prototype for PCC's internal customer, delivery, payment, and customer-report workflows.

## Run locally

- Node.js 20.9+
- `npm install`
- `npm run dev`

## Important status

This is a demo-only prototype. All records live in React state in the current browser session and disappear on refresh. Do not enter real customer or financial data. Authentication, roles, owner approval workflow, audit logs, persistent storage, Supabase/PostgreSQL, server-side transaction validation, and production PDF delivery are not implemented. Sample product names/prices are fictional.

## Vercel

Import this repository and set Root Directory to `my-view`. Vercel should detect Next.js automatically. No environment variables are required for the demo build. Do not connect production customer data until the backend and authorization controls are implemented and tested.
