# Image Coffee Roastery — Accommodation Desk

A Next.js app for managing 13 accommodation rooms at a flat UGX 100,000 per room per night. The initial interface includes room status, reservation entry, overlap checks, guest search, booking statuses, payment recording and gross room-value summaries.

## Current state

- The dashboard is a **browser-local prototype**: records are stored in the current browser's local storage.
- It is not yet a shared live booking system. Browser-local records are not visible to staff on other devices and can be cleared.
- No messages are sent, no payments are processed, and no bookings are accepted from the public website automatically.
- A Supabase migration is provided for a persistent, authenticated staff database. Apply it only after the owner selects the Supabase organization/project and authentication policies are confirmed.

## Room and pricing rules

- 13 rooms, Room 01 through Room 13.
- Flat rate: UGX 100,000 per room per night.
- Check-out date is exclusive when calculating nights.
- Reservations in reserved or checked-in status must not overlap for the same room.
- Restaurant, bar and roastery sales are outside the app's scope.

## Local development

1. Copy .env.example to .env.local when the Supabase project is ready.
2. Install dependencies with npm install.
3. Start the app with npm run dev.

## Required production work

1. Create the dedicated Supabase project in the owner-selected organization.
2. Apply supabase/migrations/202610150001_accommodation_core.sql.
3. Implement staff sign-in and owner/staff roles before enabling shared operational data.
4. Connect the dashboard to Supabase rather than local storage.
5. Add booking confirmation and reminder messaging only after the guest contact channel and consent process are configured.
6. Verify timezone/date handling, access controls, backups, and booking concurrency before production use.
