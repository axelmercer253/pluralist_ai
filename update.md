# Update Log

1. Added admin signup secret validation using `ADMIN_SECRET` in the backend auth flow.
2. Implemented JWT-based auth token creation and verification for stateless user sessions.
3. Added role-based access checks for admin and publisher protected routes.
4. Built the admin RSS feed fetcher for Google News content.
5. Added OpenRouter AI issue analysis endpoint for generating article issues.
6. Implemented article publishing by admin with exactly three selected issues.
7. Added moderation endpoints for approving or rejecting publisher submissions and media uploads.
8. Implemented publisher article submission and media upload APIs.
9. Added reader voting on article issues with yes/no tracking and vote updates.
10. Added AI chat endpoint with rate limiting for authenticated users.
11. Created client-side auth flow for sign up and login.
12. Added client-side dashboard logic for admin moderation and publishing actions.
13. Added client-side article list/detail rendering and issue voting UI.
14. Added client-side publisher forms for article submission and media upload.
15. Added generic page initialization and static route handling for app pages.
16. Added database schema for users, articles, issues, votes, submissions, and media.
17. Added environment configuration support through `.env` values like `DATABASE_URL`, `JWT_SECRET`, and `ADMIN_SECRET`.
18. Added sample environment template file to document required configuration variables.
19. Unified the footer AI chat styling across all HTML pages using the same NC-theme visual language as the main app.
20. Standardized the chat footer markup structure across pages while preserving the shared JavaScript IDs and behavior.
21. Documented backend auth, CSRF token, and database schema initialization helpers used by the server. See `test.md` for ELI5 descriptions.
22. Documented client-side helper functions for auth, role-aware routing, article rendering, and role-specific page initialization, including `loadArticles()`, `loadArticleDetail()`, `initPublisherForms()`, `initAdminDashboard()`, and `initAuthForms()`. See `test.md` for ELI5 descriptions.
23. Found a client-side moderation routing bug: reject actions for submissions/media were incorrectly routed to the approve endpoints in `public/app.js`. This is a functional bug (not syntax) and should be changed so reject actions call the correct server endpoints with `approve: false`.
24. Noted `apiFetch()` currently sets `Content-Type: application/json` for all requests (including GET). Recommendation: only set this header when sending a JSON body to avoid confusing intermediaries and to better match request semantics.
25. Fixed moderation action routing in `public/app.js`: reject actions now call correct reject endpoints instead of approve endpoints.
26. Improved `apiFetch()` in `public/app.js` to only set `Content-Type: application/json` for JSON bodies, handle non-JSON responses safely, and return structured error objects when `response.ok` is false.
27. Added `setDefaultLightTheme()` and enforced a light theme on page init; removed duplicate AI handlers from `public/nctheme.js` to avoid double updates.
28. Split auth UI: created separate login and signup pages and role-specific signup/login pages (`login_reader.html`, `login_publisher.html`, `login_admin.html`, `signup_reader.html`, etc.) and updated navigation links in `public/index.html`.
29. Updated server routing in `server.js` to serve new auth pages and added server-side role enforcement for role-specific login pages when an Authorization token is present.
30. Added a friendly `public/403.html` and updated server to serve it on role-mismatch access attempts.

## 2026-08-12 — Code Update Summary

- **Scope:** Client and server fixes related to auth flows, UI theme, moderation routing, and error handling.
- **Highlights:**
	- Fixed moderation routing in `public/app.js` so reject actions call the correct reject endpoints.
	- Improved `apiFetch()` to set `Content-Type` only for JSON bodies, handle non-JSON responses, and return structured errors.
	- Added `setDefaultLightTheme()` and removed duplicate AI handlers from `public/nctheme.js` to avoid double UI behavior.
	- Split authentication UI into separate login and signup pages and added role-specific login/signup pages.
	- Updated `server.js` to serve the new auth pages and enforce role checks for role-specific login pages when an Authorization token is present.
	- Added a friendly `public/403.html` for forbidden access due to role mismatch.

### Reference (files changed)

- [public/app.js](public/app.js)
- [public/nctheme.js](public/nctheme.js)
- [public/index.html](public/index.html)
- [public/login.html](public/login.html)
- [public/signup.html](public/signup.html)
- [public/login_reader.html](public/login_reader.html)
- [public/login_publisher.html](public/login_publisher.html)
- [public/login_admin.html](public/login_admin.html)
- [public/signup_reader.html](public/signup_reader.html)
- [public/signup_publisher.html](public/signup_publisher.html)
- [public/signup_admin.html](public/signup_admin.html)
- [public/403.html](public/403.html)
- [server.js](server.js)

If you want a changelog-style entry per commit or author/date attribution, I can append that next.
