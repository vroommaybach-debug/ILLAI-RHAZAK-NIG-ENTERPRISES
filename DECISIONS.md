# ILLAI-RHASAK Nig. Enterprises — Architecture & Open Decisions (`DECISIONS.md`)

This document tracks architectural choices made where requirements needed safe defaults, along with open client confirmations required prior to production cutover (per Section A15.6 and Part D).

---

## 1. Open Client Decisions (TODOs before Live Launch)

- [ ] **TODO (D1 - Warranty Durations & Terms):** Confirm exact warranty durations per product/brand with ILLAI-RHASAK management.
  - *Safe Default Implemented:* Warranty is attached strictly per product (`warrantyMonths` and `warrantyTerms` on each `Product` record, e.g., 12–24 months depending on the machine) and never promised as a blanket brand warranty.
- [ ] **TODO (D2 - Paystack Live Account & KYB Verification):** Confirm who completes Paystack business verification and supplies `VITE_PAYSTACK_PUBLIC_KEY` (live) and `PAYSTACK_SECRET_KEY` (live).
  - *Safe Default Implemented:* Paystack initialization (`/api/order/create`), verification (`/api/order/verify`), and HMAC SHA-512 webhook (`/api/paystack/webhook`) run server-side with deterministic test-mode support when live keys are not yet configured.
- [ ] **TODO (D3 - Delivery Zones, Fees & Exact Ikeja Pickup Address):** Confirm street number/suite in Computer Village, Ikeja, Lagos, and exact logistics partner rates.
  - *Safe Default Implemented:* Stored in `settings/site.deliveryZones` (Ikeja Pickup at ₦0, Lagos Mainland, Lagos Island & Lekki, Southwest Inter-State, Nationwide Air/Road). Editable via CMS/Settings without code changes.
- [ ] **TODO (D4 - Returns Windows & Restocking Conditions):** Confirm exact number of days for DOA/sealed return eligibility.
  - *Safe Default Implemented:* All `/policies/*` pages are clearly badged `DRAFT - CLIENT REVIEW REQUIRED` and managed through `settings/policies`.
- [ ] **TODO (D5 - Admin Passcode Rotation Process):** Confirm initial owner email and schedule for rotating `ADMIN_PASSCODE_HASH`.
  - *Safe Default Implemented:* Server-side constant-time passcode verification (`crypto.timingSafeEqual`) in `/api/admin/passcode`. Never verified in client code.
- [ ] **TODO (D6 - CMS Tier & Feature Flags):** Confirm whether client deploys on `"assets"`, `"middle"` (theme tokens enabled, copy/sections locked), or full `"cms"` tier.
  - *Safe Default Implemented:* Full support for `tier: "assets" | "cms"` plus granular feature flags (`theme.enabled`, `copy.enabled`, `sections.enabled`) in `settings/site`.
- [ ] **TODO (D7 - Real Product Photography):** Replace studio placeholder renders once physical product photography is supplied.
  - *Safe Default Implemented:* Every product image is explicitly flagged with `isPlaceholder: true` in seed data and falls back gracefully to a hardware studio gradient stage if an image URL is missing.
- [ ] **TODO (D8 - Customer Accounts):** Out of scope for v1 per brief. Orders use stateless reference (`IR-XXXXXX`) + checkout phone verification via `/api/order/lookup`.
