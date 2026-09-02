# Production Foundation Implementation Plan

> **For Hermes:** Implement task-by-task with TDD and independent pre-commit review.

**Goal:** Harden cloud ownership/economy, complete practical account recovery, add repeatable browser tests, and split the 196 KB single-file frontend without changing gameplay.

**Architecture:** Keep GitHub Pages as the static client. Move lock and economy mutations into `SECURITY DEFINER` Supabase RPC functions guarded by `auth.uid()`, active-device ownership, and version checks. Split HTML/CSS/data/runtime into static files loaded in dependency order; Playwright mocks Supabase for deterministic UI tests and runs against a local static server.

**Tech Stack:** HTML/CSS/JavaScript, Supabase Auth/PostgreSQL RPC/RLS/Realtime, Playwright, Node.js.

---

### Task 1: Establish browser test harness

**Files:** Create `package.json`, `playwright.config.js`, `tests/app.spec.js`.

1. Write tests for home → level selection, profile account controls, shop purchase, active-device conflict/takeover, and account recovery UI.
2. Run `npm test` and confirm RED for the new account/server-RPC behavior.
3. Add only the harness/config needed for existing smoke journeys to pass.
4. Keep the new behavior tests failing until their production slice is implemented.

### Task 2: Add atomic cloud ownership SQL

**Files:** Create `supabase/migrations/202609020001_production_foundation.sql`; update `supabase/sgz_profiles.sql`.

1. Add `save_version`, `active_device_id/name/seen_at` and transaction/audit tables.
2. Add atomic `sgz_claim_device`, `sgz_heartbeat`, `sgz_save_profile`, and `sgz_release_device` RPCs.
3. RPCs must resolve `auth.uid()` internally, lock the row `FOR UPDATE`, reject another fresh owner, and increment versions atomically.
4. Add executable SQL verification queries/documentation.

### Task 3: Add authoritative economy SQL and client path

**Files:** Same migration plus `js/cloud.js`, `js/shop.js`.

1. Define server catalog and RPCs for `sgz_buy_item`, `sgz_equip_item`, and `sgz_upgrade_character`.
2. Test unauthenticated/local fallback and authenticated RPC behavior with mocked Supabase.
3. Client uses RPC results as source of truth when logged in; local mode retains current behavior.
4. Show clear errors for insufficient funds, ownership, inactive device, and conflict.

### Task 4: Complete practical account management

**Files:** `index.html`, `js/account.js`, `css/app.css`, tests.

1. Add forgot-password and resend-confirmation from login.
2. Add change password/email and sign out all sessions from logged-in profile.
3. Add device status and explicit takeover.
4. Replace browser `confirm()` calls with an accessible in-game confirmation modal.
5. RED → GREEN each UI flow with mocked Supabase Auth.

### Task 5: Split the single-file frontend

**Files:** Create `css/app.css`, `js/data.js`, `js/app.js`, `js/cloud.js`, `js/account.js`, `js/shop.js`; modify `index.html`.

1. Add characterization tests for critical globals and journeys.
2. Mechanically extract inline CSS.
3. Extract immutable level/unit/shop data first, then cloud/account/shop modules, then remaining runtime.
4. Preserve classic global script compatibility for existing inline handlers.
5. Verify no inline `<style>` or main inline `<script>` remains.

### Task 6: Verify, review, deploy

1. Run `npm test`, `npm run test:mobile`, syntax checks, SQL static assertions, and secret scan.
2. Browser-smoke local desktop/mobile journeys.
3. Independent reviewer checks security, races, logic, and backward compatibility; fix blocking findings.
4. Apply migration to Supabase if authenticated management access is available; otherwise document the exact concrete deployment blocker and do not claim server hardening live.
5. Commit/push and poll cache-busted GitHub Pages until new assets/UI are served.
