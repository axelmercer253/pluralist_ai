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
