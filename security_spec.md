# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default Deny:** Any path not explicitly matched is denied for both read and write (`match /{document=**} { allow read, write: if false; }`).
2. **Admin Authority:** Admin write privileges require a verified authenticated user whose UID exists in `/admins/{uid}` or matches the bootstrapped owner email (`junestudioimagineai@gmail.com` with `email_verified == true`).
3. **Public Catalog vs Draft Isolation:** Public readers can only read `products` where `resource.data.status == 'published'` (or admins can read all). Public readers can only read `categories` where `resource.data.visible == true`.
4. **PII Isolation on Orders & Leads:** `orders/{orderRef}` and `leads/{leadId}` contain customer PII (`phone`, `email`, `address`). Public `list` or unauthenticated `get` on `orders` and `leads` is strictly forbidden; order lookup goes through `/api/order/lookup` verifying orderRef + phone, while admins can read/manage orders.
5. **Strict Key & Size Validation:** Every string field is bounded by `.size() <= MAX` and document IDs are validated by `isValidId(id)`.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Product Creation:** Guest attempts `create` on `/products/prod-1` -> `PERMISSION_DENIED`.
2. **Unverified Email Admin Spoof:** User with `email == 'junestudioimagineai@gmail.com'` but `email_verified == false` attempts `update` on `/settings/theme` -> `PERMISSION_DENIED`.
3. **Shadow Field Injection on Product:** Admin sends valid product fields plus `isSuperHack: true` -> `PERMISSION_DENIED` via `hasOnly`.
4. **Draft Product Scraping:** Unauthenticated user attempts `get` or `list` on `/products/draft-laptop` where `status == 'draft'` -> `PERMISSION_DENIED`.
5. **PII Order Scraping:** Unauthenticated or non-admin user attempts `list` on `/orders` -> `PERMISSION_DENIED`.
6. **Direct Client Order Status Tampering:** Client attempts to update `/orders/IR-ABCDEF` `status` from `'pending_payment'` to `'paid'` -> `PERMISSION_DENIED`.
7. **Oversized Lead Payload (Denial of Wallet):** Guest submits `/leads/lead-1` with a 50KB `requirements` string -> `PERMISSION_DENIED`.
8. **ID Poisoning on Lead:** Guest attempts to create `/leads/invalid$$id!!` -> `PERMISSION_DENIED` via `isValidId`.
9. **Lead Read by Public User:** Public user attempts `get` or `list` on `/leads` -> `PERMISSION_DENIED`.
10. **Negative Price Product Write:** Admin attempts to write `priceKobo: -500` -> `PERMISSION_DENIED`.
11. **Self-Privilege Escalation in `/admins`:** Non-owner attempts to create `/admins/{theirUid}` -> `PERMISSION_DENIED`.
12. **Audit Log Deletion/Tampering:** User attempts `delete` or `update` on `/auditLog/{logId}` -> `PERMISSION_DENIED` (immutable append-only).
