/* ============================================================
   Field Notes — client-side blog engine.

   How it works:
   1. Fetch posts/posts.json (the manifest = site info + list of posts).
   2. Route on the URL hash:  #/  -> index,  #/post/<slug>  -> article.
   3. Fetch the post's Markdown file, strip optional front matter,
      convert to HTML with marked, sanitize with DOMPurify, and show it.

   To add a post: drop a .md file in /posts and add an entry to posts.json.
   ============================================================ */

const view = document.getElementById("view");
let manifest = null;

/* ---------- Theme ---------- */
const themeToggle = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");
const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const prefersDark = colorSchemeQuery.matches;
setTheme(savedTheme || (prefersDark ? "dark" : "light"));

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  setTheme(next);
  localStorage.setItem("theme", next);
});

if (!savedTheme) {
  colorSchemeQuery.addEventListener("change", (event) => {
    setTheme(event.matches ? "dark" : "light");
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const light = document.getElementById("hljs-light");
  const dark = document.getElementById("hljs-dark");
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  themeToggle.setAttribute("title", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  if (light && dark) {
    light.disabled = theme === "dark";
    dark.disabled = theme !== "dark";
  }
}

/* ---------- Markdown setup ---------- */
marked.setOptions({
  gfm: true,
  breaks: false,
  highlight(code, lang) {
    if (window.hljs && lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(code, { language: lang }).value; } catch (_) {}
    }
    return code;
  },
});

/* Pull optional YAML-ish front matter (title/date/excerpt) off the top of a file. */
function parseFrontMatter(text) {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?/.exec(text);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  for (const line of match[1].split("\n")) {
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line.trim());
    if (kv) meta[kv[1].toLowerCase()] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return { meta, body: text.slice(match[0].length) };
}

function renderMarkdown(md) {
  const rawHtml = marked.parse(md);
  return DOMPurify.sanitize(rawHtml);
}

function readingTime(md) {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

/* ---------- Data ---------- */
async function loadManifest() {
  if (manifest) return manifest;
  const res = await fetch("posts/posts.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("manifest");
  manifest = await res.json();
  if (manifest.site) {
    if (manifest.site.title) {
      document.querySelector("[data-site-title]").textContent = manifest.site.title;
      document.title = manifest.site.title;
    }
    if (manifest.site.tagline) {
      document.querySelector("[data-site-tagline]").textContent = manifest.site.tagline;
    }
  }
  // Newest first.
  manifest.posts = (manifest.posts || []).slice().sort((a, b) =>
    (b.date || "").localeCompare(a.date || "")
  );
  return manifest;
}

/* ---------- Views ---------- */
function showState(html) {
  view.innerHTML = `<p class="state">${html}</p>`;
}

async function renderIndex() {
  showState("Loading…");
  let data;
  try {
    data = await loadManifest();
  } catch (_) {
    showState("Couldn't load the post list. Check that <strong>posts/posts.json</strong> exists.");
    return;
  }
  if (!data.posts.length) {
    showState("No posts yet. Add one to <strong>posts/posts.json</strong> to begin.");
    return;
  }

  const items = data.posts.map((p) => `
    <li class="post-item">
      <a class="post-link" href="#/post/${encodeURIComponent(p.slug)}">
        <h2 class="post-title">${escapeHtml(p.title || p.slug)}</h2>
        <p class="post-meta">${formatDate(p.date)}</p>
        ${p.excerpt ? `<p class="post-excerpt">${escapeHtml(p.excerpt)}</p>` : ""}
      </a>
    </li>`).join("");

  view.innerHTML = `<ul class="post-list">${items}</ul>`;
  document.title = data.site?.title || "Field Notes";
  window.scrollTo(0, 0);
}

async function renderPost(slug) {
  showState("Loading…");
  let data;
  try {
    data = await loadManifest();
  } catch (_) {
    showState("Couldn't load the blog. Check <strong>posts/posts.json</strong>.");
    return;
  }

  const entry = data.posts.find((p) => p.slug === slug);
  if (!entry) {
    showState(`No post named <strong>${escapeHtml(slug)}</strong>. <a href="#/">Back to all posts</a>.`);
    return;
  }

  const file = entry.file || `${slug}.md`;
  let text;
  try {
    const res = await fetch(`posts/${file}`, { cache: "no-cache" });
    if (!res.ok) throw new Error("post");
    text = await res.text();
  } catch (_) {
    showState(`Couldn't load <strong>posts/${escapeHtml(file)}</strong>. <a href="#/">Back to all posts</a>.`);
    return;
  }

  const { meta, body } = parseFrontMatter(text);
  const title = meta.title || entry.title || slug;
  const date = meta.date || entry.date;
  const mins = readingTime(body);

  view.innerHTML = `
    <a class="back-link" href="#/">← All posts</a>
    <article>
      <div class="article-head">
        <h1 class="article-title">${escapeHtml(title)}</h1>
        <p class="article-meta">${formatDate(date)}${date ? " · " : ""}${mins} min read</p>
      </div>
      <div class="prose">${renderMarkdown(body)}</div>
    </article>`;

  document.title = `${title} — ${data.site?.title || "Field Notes"}`;
  window.scrollTo(0, 0);
}

/* ---------- Router ---------- */
function route() {
  const hash = location.hash.replace(/^#/, "");
  const postMatch = /^\/post\/(.+)$/.exec(hash);
  if (postMatch) {
    renderPost(decodeURIComponent(postMatch[1]));
  } else {
    renderIndex();
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

window.addEventListener("hashchange", route);
route();
