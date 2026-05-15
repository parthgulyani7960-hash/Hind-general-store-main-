# Firestore Security Specification

1. Data Invariants: 
   - A user profile must belong to the logged-in user.
   - Products can only be listed by admins.
   - Orders must belong to the placing user or be managed by admins.

2. The "Dirty Dozen" Payloads (Examples to test):
   - Shadow Update: { uid: "evil", role: "admin" } -> Should fail rule validation.
   - PII Leak: Get request by non-owner on a user doc -> Should fail.
   - Orphaned Order: Create order with non-existent userId -> Should fail.

3. Test Runner: (Plan to create `firestore.rules.test.ts`)
