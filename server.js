// server.js - main backend server for Pluralist AI
// This server is stateless: it authenticates users with JWT auth tokens and validates CSRF tokens with signed headers.
const path = require("path");
const fs = require("fs");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Parser = require("rss-parser");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const db = require("./db");

dotenv.config();

// Load environment values from .env
const PORT = process.env.PORT || 3003;
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const OPEN_ROUTER_BASE_URL = process.env.OPEN_ROUTER_BASE_URL || "https://api.openrouter.ai/v1/chat/completions";
const OPEN_ROUTER_CHAT_KEY = process.env.OPEN_ROUTER_CHAT_KEY || "";
const OPEN_ROUTER_ISSUE_KEY1 = process.env.OPEN_ROUTER_ISSUE_KEY1 || "";
const OPEN_ROUTER_ISSUE_KEY2 = process.env.OPEN_ROUTER_ISSUE_KEY2 || "";
const OPEN_ROUTER_ISSUE_KEY3 = process.env.OPEN_ROUTER_ISSUE_KEY3 || "";
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!DATABASE_URL || !JWT_SECRET || !ADMIN_SECRET) {
  console.error("DATABASE_URL, JWT_SECRET, and ADMIN_SECRET are required in .env");
  process.exit(1);
}

if (!OPEN_ROUTER_CHAT_KEY) {
  console.warn("Warning: OPEN_ROUTER_CHAT_KEY is not configured. AI chat requests will fail until it is set.");
}

if (![OPEN_ROUTER_ISSUE_KEY1, OPEN_ROUTER_ISSUE_KEY2, OPEN_ROUTER_ISSUE_KEY3].some(Boolean)) {
  console.warn("Warning: One or more OPEN_ROUTER_ISSUE_KEYs are not configured. Admin issue extraction will fail until they are set.");
}

const app = express();
const parser = new Parser();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Use defensive HTTP headers for basic protection.
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// Rate limiter for AI chat UI - 30 requests per minute per IP.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many chat queries, please wait a minute." }
});

// Helper: execute SQL and return result rows.
async function query(sql, params = []) {
  return db.query(sql, params);
}

async function ensureSchema() {
  const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const statements = schemaSql
    .split(/;\s*\n/)
    .map((stmt) => stmt.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await query(statement);
  }
}

// Helper: create a signed auth token for stateless login.
function createAuthToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      csrf: crypto.randomBytes(16).toString("hex")
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

// Helper: create a one-time CSRF token for unauthenticated forms.
function createCsrfToken() {
  return jwt.sign({ csrf: crypto.randomBytes(16).toString("hex") }, JWT_SECRET, {
    expiresIn: "15m"
  });
}

// Authentication middleware extracts the JWT auth token from Authorization header.
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }
  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Role-based middleware for admin/publisher actions.
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden: insufficient privileges" });
    }
    next();
  };
}

// CSRF validation middleware checks the X-CSRF-Token header for non-GET requests.
function validateCsrf(req, res, next) {
  if (req.method === "GET" || req.method === "OPTIONS") {
    return next();
  }

  const token = req.headers["x-csrf-token"];
  if (!token) {
    return res.status(403).json({ error: "CSRF token is required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (req.user && req.user.csrf && req.user.csrf !== payload.csrf) {
      return res.status(403).json({ error: "CSRF token mismatch" });
    }
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
}

app.use(validateCsrf);

// Public helper route: return a one-time CSRF token for form security.
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: createCsrfToken() });
});

// Public route: sign up as reader or publisher. Admin signup requires ADMIN_SECRET.
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, role, adminSecret, username, fullName } = req.body;
  if (!email || !password || !role || !username || !fullName || !["reader", "publisher", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid signup data" });
  }

  if (role === "admin" && adminSecret !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Admin signup secret is required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await query(
    "INSERT INTO users(email, username, full_name, password_hash, role) VALUES($1, $2, $3, $4, $5) RETURNING id, email, username, full_name, role",
    [email.trim().toLowerCase(), username.trim(), fullName.trim(), hashedPassword, role]
  );

  const user = result.rows[0];
  const authToken = createAuthToken(user);
  return res.json({ token: authToken, csrfToken: createCsrfToken(), user });
});

// Public route: sign in and receive auth token.
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const result = await query("SELECT id, email, username, full_name, password_hash, role FROM users WHERE email = $1", [email.trim().toLowerCase()]);
  const user = result.rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const authToken = createAuthToken(user);
  return res.json({ token: authToken, csrfToken: createCsrfToken(), user: { id: user.id, email: user.email, username: user.username, fullName: user.full_name, role: user.role } });
});

// Authenticated route: return current user profile.
app.get("/api/me", requireAuth, async (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, username: req.user.username, fullName: req.user.full_name, role: req.user.role } });
});

// Public route: list published articles.
app.get("/api/articles", async (req, res) => {
  const result = await query(
    "SELECT id, title, summary, source, published, created_at FROM articles WHERE published = true ORDER BY created_at DESC LIMIT 50"
  );
  res.json({ articles: result.rows });
});

// Public route: fetch article details and issue vote counts.
app.get("/api/article/:id", async (req, res) => {
  const articleId = parseInt(req.params.id, 10);
  const articleResult = await query("SELECT id, title, content, source, created_at FROM articles WHERE id = $1 AND published = true", [articleId]);
  const article = articleResult.rows[0];
  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }

  const issuesResult = await query(
    "SELECT id, text, target_group, votes_yes, votes_no FROM issues WHERE article_id = $1 ORDER BY issue_order ASC LIMIT 3",
    [articleId]
  );

  res.json({ article, issues: issuesResult.rows });
});

// Reader route: vote yes/no on an issue.
app.post("/api/vote", requireAuth, async (req, res) => {
  if (req.user.role !== "reader") {
    return res.status(403).json({ error: "Only readers can vote" });
  }

  const { issueId, vote } = req.body;
  if (!issueId || !["yes", "no"].includes(vote)) {
    return res.status(400).json({ error: "Invalid vote request" });
  }

  const issueResult = await query("SELECT id FROM issues WHERE id = $1", [issueId]);
  if (!issueResult.rows.length) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const existingVote = await query("SELECT vote FROM votes WHERE user_id = $1 AND issue_id = $2", [req.user.id, issueId]);
  const previousVote = existingVote.rows[0]?.vote || null;

  await query(
    "INSERT INTO votes(user_id, issue_id, vote) VALUES($1, $2, $3) ON CONFLICT (user_id, issue_id) DO UPDATE SET vote = EXCLUDED.vote, updated_at = NOW()",
    [req.user.id, issueId, vote]
  );

  if (previousVote && previousVote !== vote) {
    const decrementColumn = previousVote === "yes" ? "votes_yes" : "votes_no";
    await query(`UPDATE issues SET ${decrementColumn} = GREATEST(${decrementColumn} - 1, 0) WHERE id = $1`, [issueId]);
  }

  const incrementColumn = vote === "yes" ? "votes_yes" : "votes_no";
  await query(`UPDATE issues SET ${incrementColumn} = ${incrementColumn} + 1 WHERE id = $1`, [issueId]);

  return res.json({ success: true });
});

// Admin route: fetch Google RSS news items.
app.get("/api/admin/rss", requireAuth, requireRole("admin"), async (req, res) => {
  const rssUrl = "https://news.google.com/rss/search?q=balita&hl=fil-PH&gl=PH&ceid=PH:fil";
  const feed = await parser.parseURL(rssUrl);
  const items = feed.items.slice(0, 12).map((item, index) => ({
    id: index + 1,
    title: item.title,
    link: item.link,
    published: item.pubDate,
    content: item.content || item.contentSnippet || item.title || "",
    description: item.contentSnippet || item.content || "",
    source: item.creator || "Google News"
  }));
  res.json({ items });
});

// Admin route: send news article text to OpenRouter for issue extraction.
app.post("/api/admin/analyze", requireAuth, requireRole("admin"), async (req, res) => {
  const { articleText } = req.body;
  if (!articleText || typeof articleText !== "string") {
    return res.status(400).json({ error: "Article text is required" });
  }

  const apiKey = [OPEN_ROUTER_ISSUE_KEY1, OPEN_ROUTER_ISSUE_KEY2, OPEN_ROUTER_ISSUE_KEY3].find(Boolean);
  if (!apiKey) {
    return res.status(500).json({ error: "Issue API key is not configured" });
  }

  const prompt = `what are six main issues of the article news below that concerns various society groups like, education, health sector, business, transport group, feminists, cultural party, ethnic groups, media, democrats. (Article_text) ${articleText}`;

  const response = await fetch(OPEN_ROUTER_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an AI assistant focused on political and social issue analysis." },
        { role: "user", content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.3
    })
  });

  const aiResult = await response.json();
  const rawText = aiResult?.choices?.[0]?.message?.content || aiResult?.output_text || "";
  return res.json({ issuesText: rawText });
});

// Admin route: publish article with three selected issues.
app.post("/api/admin/publish", requireAuth, requireRole("admin"), async (req, res) => {
  const { title, content, source, issues } = req.body;
  if (!title || !content || !issues || !Array.isArray(issues) || issues.length !== 3) {
    return res.status(400).json({ error: "Title, content, source, and exactly 3 issues are required" });
  }

  const articleResult = await query(
    "INSERT INTO articles(title, summary, content, source, published, approved, created_by) VALUES($1, $2, $3, $4, true, true, $5) RETURNING id",
    [title.trim(), content.trim().slice(0, 280), content.trim(), source || "Google News", req.user.id]
  );
  const articleId = articleResult.rows[0].id;

  for (let i = 0; i < issues.length; i += 1) {
    await query(
      "INSERT INTO issues(article_id, text, target_group, issue_order) VALUES($1, $2, $3, $4)",
      [articleId, issues[i].trim(), "general", i + 1]
    );
  }

  return res.json({ success: true, articleId });
});

// Admin route: list pending publisher submissions and media uploads.
app.get("/api/admin/moderation", requireAuth, requireRole("admin"), async (req, res) => {
  const submissions = await query("SELECT id, title, content, publisher_id, created_at FROM submissions WHERE approved = false ORDER BY created_at DESC");
  const media = await query("SELECT id, title, url, media_type, publisher_id, created_at FROM media WHERE approved = false ORDER BY created_at DESC");
  res.json({ submissions: submissions.rows, media: media.rows });
});

// Admin route: approve or reject publisher submission.
app.post("/api/admin/approve-submission", requireAuth, requireRole("admin"), async (req, res) => {
  const { submissionId, approve } = req.body;
  if (!submissionId || typeof approve !== "boolean") {
    return res.status(400).json({ error: "Submission id and approve flag are required" });
  }

  await query("UPDATE submissions SET approved = $1, moderated_at = NOW() WHERE id = $2", [approve, submissionId]);
  return res.json({ success: true });
});

// Admin route: approve or reject media upload.
app.post("/api/admin/approve-media", requireAuth, requireRole("admin"), async (req, res) => {
  const { mediaId, approve } = req.body;
  if (!mediaId || typeof approve !== "boolean") {
    return res.status(400).json({ error: "Media id and approve flag are required" });
  }

  await query("UPDATE media SET approved = $1, moderated_at = NOW() WHERE id = $2", [approve, mediaId]);
  return res.json({ success: true });
});

// Publisher route: submit an article for admin approval.
app.post("/api/publisher/submit-article", requireAuth, requireRole("publisher"), async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  await query("INSERT INTO submissions(title, content, publisher_id) VALUES($1, $2, $3)", [title.trim(), content.trim(), req.user.id]);
  return res.json({ success: true });
});

// Publisher route: upload media URL for admin approval.
app.post("/api/publisher/upload", requireAuth, requireRole("publisher"), async (req, res) => {
  const { title, url, mediaType, description } = req.body;
  if (!title || !url || !mediaType || !["audio", "video"].includes(mediaType)) {
    return res.status(400).json({ error: "Title, URL, and media type are required" });
  }

  await query(
    "INSERT INTO media(title, description, url, media_type, publisher_id) VALUES($1, $2, $3, $4, $5)",
    [title.trim(), description?.trim() || "", url.trim(), mediaType, req.user.id]
  );
  return res.json({ success: true });
});

// Chat route: readers and publishers may query the AI chat interface.
app.post("/api/chat", chatLimiter, requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Chat message is required" });
  }

  const apiKey = OPEN_ROUTER_CHAT_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Chat API key is not configured" });
  }

  const prompt = `Answer only political and social issue questions. Do not answer general knowledge questions. User asked: ${message}`;
  const response = await fetch(OPEN_ROUTER_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a specialized assistant for political and social issues only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 500
    })
  });

  const aiResult = await response.json();
  const output = aiResult?.choices?.[0]?.message?.content || aiResult?.output_text || "Sorry, the AI did not return a response.";
  res.json({ response: output });
});

// Default routes: serve the homepage and static HTML pages correctly.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve static HTML pages. For role-specific login pages, if an Authorization header
// is present we enforce that the token's role matches the page; otherwise allow.
app.get([
  "/index.html",
  "/login.html",
  "/login_reader.html",
  "/login_publisher.html",
  "/login_admin.html",
  "/signup.html",
  "/signup_reader.html",
  "/signup_publisher.html",
  "/signup_admin.html",
  "/reader.html",
  "/publisher.html",
  "/admin.html",
  "/article.html"
], (req, res) => {
  const page = req.path === "/" ? "index.html" : req.path.replace(/^\/+/, "");

  // Role enforcement for role-specific login pages when an auth token is provided.
  const rolePageMap = {
    "/login_reader.html": "reader",
    "/login_publisher.html": "publisher",
    "/login_admin.html": "admin"
  };

  const requiredRole = rolePageMap[req.path];
  const authHeader = req.headers.authorization;
  if (requiredRole && authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.role && payload.role !== requiredRole) {
        // If authenticated user has a different role, deny access to this page with a friendly HTML page.
        return res.status(403).sendFile(path.join(__dirname, "public", "403.html"));
      }
    } catch (err) {
      // If token invalid/expired, allow viewing the login page (user can re-login).
    }
  }

  res.sendFile(path.join(__dirname, "public", page));
});

app.get("/*", (req, res) => {
  const requestedPath = req.path === "/" ? "index.html" : req.path.replace(/^\/+/, "");
  const filePath = path.join(__dirname, "public", requestedPath);

  if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
    return res.sendFile(filePath);
  }

  return res.sendFile(path.join(__dirname, "public", "index.html"));
});

(async () => {
  try {
    await ensureSchema();
    app.listen(PORT, () => {
      console.log(`Pluralist AI server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize database schema:", error);
    process.exit(1);
  }
})();
