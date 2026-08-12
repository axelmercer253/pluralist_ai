# Pluralist AI Function Reference (Test Documentation)

This file describes the helper functions used in the code and explains them in a simple way.

## Backend helper functions

### `createAuthToken(user)`
- What it does: Makes a secret login ticket for a user.
- ELI5: It’s like giving someone a special key badge that proves who they are and lets them use the app for a little while.

### `createCsrfToken()`
- What it does: Makes a one-time safety token for forms.
- ELI5: It’s like giving your form a secret handshake so the server knows the form really came from your website.

### `validateCsrf(req, res, next)`
- What it does: Checks the secret token on every form request that changes data.
- ELI5: It’s like checking the handshake before letting anyone change important stuff, so only real users can do it.

### `requireAuth(req, res, next)`
- What it does: Makes sure the request has a valid login token.
- ELI5: It’s like a guard asking for your ticket before letting you into the private part of the app.

### `requireRole(role)`
- What it does: Makes sure the logged-in user has the right role, like admin or publisher.
- ELI5: It’s like checking if someone is a teacher, student, or principal before letting them into the correct room.

### `ensureSchema()`
- What it does: Reads the database schema file and creates missing database tables.
- ELI5: It’s like laying out the game board before the game starts so all the pieces have a place.

### `query(sql, params)`
- What it does: Sends SQL commands to the database and returns results.
- ELI5: It’s like asking the library a question, giving it the right words, and getting the answer back.

## Frontend utility functions

### `apiFetch(url, options)`
- What it does: Makes API requests with auth and CSRF headers.
- ELI5: It’s like sending mail with your name on it and a secret code so the website knows it really came from you.

### `setupAIChat()`
- What it does: Sets up the sticky footer chat box and handles sending messages.
- ELI5: It’s like turning on the magic chat button at the bottom of the screen so you can talk to the AI.

### `getCsrfToken()`
- What it does: Asks the server for a fresh CSRF token.
- ELI5: It’s like asking for a new secret handshake before you send something important.

### `setAuthToken(token)`
- What it does: Saves the login token in local storage.
- ELI5: It’s like putting your key card in your pocket so you can use it later.

### `clearAuthToken()`
- What it does: Removes the saved login token.
- ELI5: It’s like taking your key card out of your pocket when you leave.

### `getCurrentPath()`
- What it does: Returns the page path from the browser address bar.
- ELI5: It’s like looking at the sign on the door to see where you are.

### `getRoleHome(role)`
- What it does: Chooses the correct homepage URL for a user role.
- ELI5: It’s like saying, "If you are a reader, go to the reader room; if you are an admin, go to the admin room."

### `getCurrentUser()`
- What it does: Gets the current user data from the backend.
- ELI5: It’s like asking the app, "Who am I right now?" and getting the answer.

### `ensurePageRole(requiredRole)`
- What it does: Makes sure the current user belongs on the page.
- ELI5: It’s like checking that you are in the right class before the teacher starts the lesson.

### `loadArticles()`
- What it does: Loads and displays the public article list.
- ELI5: It’s like putting all the story cards on the table so readers can pick one.

### `signOut()`
- What it does: Logs the user out and sends them to the homepage.
- ELI5: It’s like closing your locker and leaving the school.

### `initSignOut()`
- What it does: Attaches the log-out button to the sign-out function.
- ELI5: It’s like wiring the button so it works when you press it.

### `loadArticleDetail()`
- What it does: Shows one article and its issues, with voting buttons.
- ELI5: It’s like opening a book and showing the reader the questions they can vote on.

### `initPublisherForms()`
- What it does: Sets up the publisher page so they can upload media and submit articles.
- ELI5: It’s like preparing the publisher’s desk with the right tools so they can share their stories.

### `initAdminDashboard()`
- What it does: Sets up admin page actions, RSS loading, issue analysis, and moderation.
- ELI5: It’s like giving the admin the control panel where they can choose news, ask the AI for issues, and approve or reject content.

### `initAuthForms()`
- What it does: Sets up login and signup forms and handles submissions.
- ELI5: It’s like putting pencils and paper on the sign-in desk and listening for people to sign up or log in.

### `initPage()`
- What it does: Runs page setup functions when the page loads.
- ELI5: It’s like turning on the lights and starting the day for the website.
