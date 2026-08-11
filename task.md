# Pluralist AI Task List

## Goal
Review the app against the README and fix the missing or incorrect logic so the app matches the intended product behavior.

## Findings from code review

### ✅ Implemented
- JWT-based stateless auth for users
- Three roles: reader, publisher, admin
- Reader article list and article detail pages
- Issue voting for readers
- Admin RSS fetching from Google News
- OpenRouter-based AI issue extraction
- Admin article publishing with exactly 3 selected issues
- Publisher article submission and media upload flows
- Admin moderation queue for submissions and media
- AI chat endpoint and client-side chat UI

### ⚠️ Issues to fix
1. Role-based redirect after login/signup is incorrect
   - Current client logic sends all users to /reader.html after auth
   - Admin and publisher users should be redirected to their own pages based on role

2. Admin signup depends on env secret validation
   - The backend checks `ADMIN_SECRET` for role `admin`
   - Ensure `.env` contains a real value before admin signup is used

3. README mentions role-specific UI flows more explicitly than the code delivers
   - Reader, publisher, and admin screens need proper checks and routing

4. Need to verify proper page access by role
   - Admin endpoints require `requireRole("admin")`
   - Publisher endpoints require `requireRole("publisher")`
   - Reader endpoints require `requireRole("reader")`
   - The UI should reflect and enforce this correctly

5. Validate the app startup environment
   - Ensure `DATABASE_URL`, `JWT_SECRET`, and required API keys are configured in `.env`
   - `server.js` exits if `DATABASE_URL` is missing

## Tasks

### 1. Fix role-aware login/signup redirect
- Update auth success flow so it redirects based on the returned user role
- If role is `admin`, redirect to /admin.html
- If role is `publisher`, redirect to /publisher.html
- If role is `reader`, redirect to /reader.html

### 2. Validate role-specific page access
- Check that pages and API calls are gated correctly per user role
- Prevent unauthorized access to admin and publisher screens

### 3. Confirm environment configuration
- Ensure `.env` includes all required values for local development
- Check `DATABASE_URL`, `JWT_SECRET`, `ADMIN_SECRET`, and OpenRouter keys

### 4. Test the core user flows
- Sign up as reader
- Sign up as publisher
- Sign up as admin using `ADMIN_SECRET`
- Log in with each role
- Confirm each page loads with the correct role
- Confirm reader can vote on article issues
- Confirm admin can fetch RSS, analyze, and publish an article
- Confirm publisher can submit content and upload media
- Confirm admin can approve/reject submissions and media

### 5. Check README alignment
- Update README if any behavior differs from final working implementation
- Clarify which env vars are required for local setup

## Acceptance criteria
- Users are routed correctly after login/signup based on role
- Admin signup requires the configured `ADMIN_SECRET`
- All role-based endpoints enforce permissions correctly
- App starts successfully with a valid `.env`
- Main described flows work end-to-end
