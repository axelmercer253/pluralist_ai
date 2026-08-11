// app.js - client-side app logic for Pluralist AI
// This file uses plain JavaScript, fetch, and form security only.

const authToken = localStorage.getItem("pluralistAuthToken");

async function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  headers["Content-Type"] = "application/json";
  if (localStorage.getItem("pluralistAuthToken")) {
    headers["Authorization"] = `Bearer ${localStorage.getItem("pluralistAuthToken")}`;
  }
  if (options.csrfToken) {
    headers["X-CSRF-Token"] = options.csrfToken;
  }
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers
  });
  return response.json();
}

async function setupAIChat() {
  const aiInput = document.getElementById("aiInput");
  const aiResponse = document.getElementById("aiResponse");
  const aiSend = document.getElementById("aiSend");
  if (!aiInput || !aiResponse || !aiSend) return;

  async function askAI() {
    const question = aiInput.value.trim();
    if (!question) return;
    aiResponse.textContent = "Thinking...";

    const response = await apiFetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: question }),
      csrfToken: await getCsrfToken()
    });

    aiResponse.textContent = response.response || response.error || "Unable to get AI response.";
    aiInput.value = "";
  }

  aiSend.addEventListener("click", askAI);
  aiInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") askAI();
  });
}

async function getCsrfToken() {
  const data = await apiFetch("/api/csrf-token", { method: "GET" });
  return data.csrfToken;
}

function setAuthToken(token) {
  localStorage.setItem("pluralistAuthToken", token);
}

function clearAuthToken() {
  localStorage.removeItem("pluralistAuthToken");
}

function getCurrentPath() {
  return window.location.pathname;
}

function getRoleHome(role) {
  if (role === "admin") return "/admin.html";
  if (role === "publisher") return "/publisher.html";
  return "/reader.html";
}

async function getCurrentUser() {
  if (!localStorage.getItem("pluralistAuthToken")) return null;
  const result = await apiFetch("/api/me", { method: "GET" });
  return result.user || null;
}

async function ensurePageRole(requiredRole) {
  if (!requiredRole) return true;
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "/auth.html";
    return false;
  }
  if (user.role !== requiredRole) {
    window.location.href = getRoleHome(user.role);
    return false;
  }
  return true;
}

async function loadArticles() {
  if (getCurrentPath() === "/reader.html") {
    const allowed = await ensurePageRole("reader");
    if (!allowed) return;
  }

  const articleList = document.getElementById("articleList");
  if (!articleList) return;
  const result = await apiFetch("/api/articles", { method: "GET" });

  if (!result.articles) {
    articleList.innerHTML = "<p>Unable to load articles.</p>";
    return;
  }

  articleList.innerHTML = result.articles
    .map(
      (article) => `
        <article class="article-card">
          <h3>${article.title}</h3>
          <p>${article.summary || "No summary available."}</p>
          <p><strong>Source:</strong> ${article.source || "Pluralist News"}</p>
          <button class="viewArticleBtn" data-id="${article.id}">Read Article</button>
        </article>`
    )
    .join("");

  document.querySelectorAll(".viewArticleBtn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const articleId = event.target.dataset.id;
      window.location.href = `/article.html?id=${articleId}`;
    });
  });
}

async function signOut() {
  clearAuthToken();
  window.location.href = "/";
}

function initSignOut() {
  const signOutLink = document.getElementById("signOutLink");
  if (signOutLink) {
    signOutLink.addEventListener("click", (event) => {
      event.preventDefault();
      signOut();
    });
  }
}

// legacy chat form removed; slim AI chat handled by setupAIChat()

async function loadArticleDetail() {
  if (getCurrentPath() !== "/article.html") return;

  const query = new URLSearchParams(window.location.search);
  const articleId = query.get("id");
  const articleContainer = document.getElementById("articleList");
  if (!articleContainer || !articleId) return;

  const response = await apiFetch(`/api/article/${articleId}`, { method: "GET" });
  if (response.error) {
    articleContainer.innerHTML = `<p>${response.error}</p>`;
    return;
  }

  const article = response.article;
  const issues = response.issues || [];
  articleContainer.innerHTML = `
    <article class="article-card">
      <h3>${article.title}</h3>
      <p>${article.content}</p>
      <p><strong>Source:</strong> ${article.source || "Pluralist News"}</p>
    </article>
    <section class="issue-list">
      ${issues
        .map(
          (issue) => `
          <div class="issue-row">
            <p>${issue.text}</p>
            <div class="issue-actions">
              <button data-issue-id="${issue.id}" data-vote="yes">Vote Yes (${issue.votes_yes})</button>
              <button data-issue-id="${issue.id}" data-vote="no">Vote No (${issue.votes_no})</button>
            </div>
          </div>`
        )
        .join("")}
    </section>`;

  articleContainer.querySelectorAll(".issue-actions button").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const issueId = event.target.dataset.issueId;
      const vote = event.target.dataset.vote;
      const result = await apiFetch("/api/vote", {
        method: "POST",
        body: JSON.stringify({ issueId: parseInt(issueId, 10), vote }),
        csrfToken: await getCsrfToken()
      });
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error || "Unable to save vote.");
      }
    });
  });
}

async function initPublisherForms() {
  if (getCurrentPath() !== "/publisher.html") return;
  const allowed = await ensurePageRole("publisher");
  if (!allowed) return;

  const mediaUploadForm = document.getElementById("mediaUploadForm");
  const publisherArticleForm = document.getElementById("publisherArticleForm");

  if (mediaUploadForm) {
    mediaUploadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(mediaUploadForm);
      const payload = {
        title: data.get("title"),
        url: data.get("url"),
        mediaType: data.get("mediaType"),
        description: data.get("description")
      };
      const response = await apiFetch("/api/publisher/upload", {
        method: "POST",
        body: JSON.stringify(payload),
        csrfToken: await getCsrfToken()
      });
      if (response.success) {
        alert("Media uploaded for admin review.");
        mediaUploadForm.reset();
      } else {
        alert(response.error || "Upload failed.");
      }
    });
  }

  if (publisherArticleForm) {
    publisherArticleForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(publisherArticleForm);
      const payload = {
        title: data.get("title"),
        content: data.get("content")
      };
      const response = await apiFetch("/api/publisher/submit-article", {
        method: "POST",
        body: JSON.stringify(payload),
        csrfToken: await getCsrfToken()
      });
      if (response.success) {
        alert("Article submitted for admin moderation.");
        publisherArticleForm.reset();
      } else {
        alert(response.error || "Submission failed.");
      }
    });
  }
}

async function initAdminDashboard() {
  if (getCurrentPath() !== "/admin.html") return;
  const allowed = await ensurePageRole("admin");
  if (!allowed) return;

  const rssNewsList = document.getElementById("rssNewsList");
  const issueReviewForm = document.getElementById("issueReviewForm");
  const aiIssues = document.getElementById("aiIssues");
  const publishButton = document.getElementById("publishButton");
  const analyzeButton = document.getElementById("analyzeButton");
  const pendingModeration = document.getElementById("pendingModeration");
  let selectedIssues = [];

  async function loadRss() {
    const data = await apiFetch("/api/admin/rss", { method: "GET" });
    if (!data.items) {
      rssNewsList.innerHTML = "<p>Unable to load RSS news.</p>";
      return;
    }

    rssNewsList.innerHTML = data.items
      .map(
        (item, index) => `
          <div class="article-card">
            <h3>${item.title}</h3>
            <p>${item.description || "No description"}</p>
            <button type="button" data-index="${index}" class="selectRss">Select for review</button>
          </div>`
      )
      .join("");

    document.querySelectorAll(".selectRss").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const idx = parseInt(event.target.dataset.index, 10);
        const item = data.items[idx];
        document.getElementById("issueTitle").value = item.title;
        document.getElementById("issueSource").value = item.source || "Google News";
        document.getElementById("issueContent").value = item.description || item.title;
        selectedIssues = [];
        aiIssues.innerHTML = "";
        publishButton.disabled = true;
      });
    });
  }

  async function loadModeration() {
    const data = await apiFetch("/api/admin/moderation", { method: "GET" });
    if (!data) {
      pendingModeration.innerHTML = "<p>Unable to load moderation queue.</p>";
      return;
    }

    pendingModeration.innerHTML = `
      <div class="card-row">
        <div>
          <h3>Article submissions</h3>
          ${data.submissions
            .map(
              (item) => `
                <div class="article-card">
                  <h4>${item.title}</h4>
                  <p>${item.content.slice(0, 160)}...</p>
                  <button type="button" data-action="approve-submission" data-id="${item.id}">Approve</button>
                  <button type="button" data-action="reject-submission" data-id="${item.id}">Reject</button>
                </div>`
            )
            .join("")}
        </div>
        <div>
          <h3>Media uploads</h3>
          ${data.media
            .map(
              (item) => `
                <div class="article-card">
                  <h4>${item.title}</h4>
                  <p>${item.media_type.toUpperCase()} - ${item.url}</p>
                  <button type="button" data-action="approve-media" data-id="${item.id}">Approve</button>
                  <button type="button" data-action="reject-media" data-id="${item.id}">Reject</button>
                </div>`
            )
            .join("")}
        </div>
      </div>`;

    pendingModeration.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const action = event.target.dataset.action;
        const id = event.target.dataset.id;
        let path = "";
        if (action === "approve-submission") path = "/api/admin/approve-submission";
        if (action === "reject-submission") path = "/api/admin/approve-submission";
        if (action === "approve-media") path = "/api/admin/approve-media";
        if (action === "reject-media") path = "/api/admin/approve-media";
        if (!path) return;

        const approve = action.startsWith("approve");
        const payload = action.includes("submission") ? { submissionId: parseInt(id, 10), approve } : { mediaId: parseInt(id, 10), approve };
        const response = await apiFetch(path, {
          method: "POST",
          body: JSON.stringify(payload),
          csrfToken: await getCsrfToken()
        });
        if (response.success) {
          await loadModeration();
        } else {
          alert(response.error || "Unable to moderate.");
        }
      });
    });
  }

  if (analyzeButton) {
    analyzeButton.addEventListener("click", async () => {
      const articleText = document.getElementById("issueContent").value;
      if (!articleText) return alert("Select an RSS item first.");
      const response = await apiFetch("/api/admin/analyze", {
        method: "POST",
        body: JSON.stringify({ articleText }),
        csrfToken: await getCsrfToken()
      });
      if (response.issuesText) {
        const lines = response.issuesText.split(/\r?\n/).filter(Boolean).slice(0, 6);
        aiIssues.innerHTML = lines
          .map(
            (line, index) => `
              <label class="issue-row">
                <input type="checkbox" name="issueCheckbox" value="${line.replace(/\"/g, "").trim()}" data-index="${index}" />
                <span>${line.trim()}</span>
              </label>`
          )
          .join("");
      } else {
        aiIssues.innerHTML = `<p>${response.error || "Unable to extract issues."}</p>`;
      }
    });
  }

  if (issueReviewForm) {
    issueReviewForm.addEventListener("change", () => {
      const checked = issueReviewForm.querySelectorAll("input[name='issueCheckbox']:checked");
      publishButton.disabled = checked.length !== 3;
    });

    issueReviewForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const title = document.getElementById("issueTitle").value;
      const source = document.getElementById("issueSource").value;
      const content = document.getElementById("issueContent").value;
      const checked = issueReviewForm.querySelectorAll("input[name='issueCheckbox']:checked");
      if (checked.length !== 3) {
        return alert("Please select exactly three issues.");
      }
      const issues = Array.from(checked).map((input) => input.value);
      const response = await apiFetch("/api/admin/publish", {
        method: "POST",
        body: JSON.stringify({ title, source, content, issues }),
        csrfToken: await getCsrfToken()
      });
      if (response.success) {
        alert("Article published to readers.");
        issueReviewForm.reset();
        aiIssues.innerHTML = "";
        publishButton.disabled = true;
      } else {
        alert(response.error || "Publish failed.");
      }
    });
  }

  await loadRss();
  await loadModeration();
}

async function initAuthForms() {
  const signUpForm = document.getElementById("signUpForm");
  const loginForm = document.getElementById("loginForm");

  if (signUpForm) {
    signUpForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(signUpForm);
      const result = await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
          role: data.get("role"),
          adminSecret: data.get("adminSecret")
        }),
        csrfToken: await getCsrfToken()
      });
      if (result.token) {
        setAuthToken(result.token);
        const role = result.user?.role;
        window.location.href = getRoleHome(role);
      } else {
        alert(result.error || "Signup failed.");
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(loginForm);
      const result = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password")
        }),
        csrfToken: await getCsrfToken()
      });
      if (result.token) {
        setAuthToken(result.token);
        const role = result.user?.role;
        window.location.href = getRoleHome(role);
      } else {
        alert(result.error || "Login failed.");
      }
    });
  }
}

function initPage() {
  initSignOut();
  setupAIChat();
  loadArticles();
  loadArticleDetail();
  initPublisherForms();
  initAdminDashboard();
  initAuthForms();
}

window.addEventListener("DOMContentLoaded", initPage);
