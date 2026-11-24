/* PBYB Agentic Brand Activation lab — static app, hash routing, no build step. */
(function () {
"use strict";

const FIELDS = ["name","domain","industry","sponsor","xsc","date","daUrl","gitUrl","abvUrl","coderUrl","media",
  "pages","excluded","topics","prompts","competitors","vpath","cdnProv","ewMode","brand"];
const CHECKS = ["cdn","trkMkt","trkDev","trkLoc"];
const DEFAULTS = { coderUrl:"https://aemcoder.adobe.io/", media:"library", vpath:"semrush", ewMode:"flag",
  trkMkt:true, trkDev:true, trkLoc:false, cdn:false };

const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const lines = s => (s || "").split("\n").map(x => x.trim()).filter(Boolean);

function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

let P = Object.assign({}, DEFAULTS, store("pbyb.profile") || {});
let promptN = 0;

/* ---------- derived values ---------- */
function derive() {
  const d = {};
  let m = (P.daUrl || "").match(/da\.live\/(?:#|canvas#|edit#)\/([^\/\s]+)\/([^\/\s?#]+)/);
  d.daOrg = m ? m[1] : ""; d.daSite = m ? m[2] : "";
  d.browse = d.daOrg ? `https://da.live/#/${d.daOrg}/${d.daSite}` : "";
  d.canvas = d.daOrg ? `https://da.live/canvas#/${d.daOrg}/${d.daSite}` : "";
  d.config = d.daOrg ? `https://da.live/config#/${d.daOrg}/${d.daSite}` : "";
  m = (P.gitUrl || "").match(/github\.com\/([^\/\s]+)\/([^\/\s#?]+?)(?:\.git)?\/?$/);
  d.gitOrg = m ? m[1] : ""; d.repo = m ? m[2] : "";
  d.preview = d.repo ? `https://main--${d.repo}--${d.gitOrg}.aem.page` : "";
  d.live = d.repo ? `https://main--${d.repo}--${d.gitOrg}.aem.live` : "";
  m = (P.abvUrl || "").match(/abv\.adobe\.com\/org\/([0-9a-f-]{36})/i);
  d.abvOrg = m ? m[1] : "";
  d.abv = d.abvOrg ? `https://abv.adobe.com/org/${d.abvOrg}/overview` : "";
  d.pages = lines(P.pages); d.excluded = lines(P.excluded); d.topics = lines(P.topics);
  d.prompts = lines(P.prompts); d.comps = lines(P.competitors);
  d.C = P.name || "‹customer›";
  d.compStr = d.comps.length ? d.comps.join(", ") : "‹competitors›";
  d.topicStr = d.topics.length ? d.topics.join("; ") : "‹topics›";
  d.first = d.pages[0] || "/";
  d.site = P.domain ? `https://${P.domain}` : "https://‹domain›";
  d.allPages = d.pages.map(x => d.site + x).join("\n") || "‹pages›";
  d.allPreview = d.pages.map(x => (d.preview || "‹preview›") + x).join("\n") || "‹pages›";
  return d;
}

/* ---------- html helpers ---------- */
const miss = t => `<span class="missing">${esc(t)}</span>`;
const v = (val, label) => val ? esc(val) : miss(label);
const link = (u, label) => u ? `<a class="url" href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>` : miss(label || "link");
const prompt = text => { const id = "pr" + (promptN++); return `<div class="prompt" id="${id}"><span>${esc(text)}</span><button data-copy="${id}">Copy</button></div>`; };
const assumed = (t) => `<span class="tag">ASSUMED${t ? ": " + esc(t) : ""}</span>`;
const verified = `<span class="tag ver">VERIFIED</span>`;
const goal = t => `<div class="goal"><b>Goal:</b> ${t}</div>`;
const callout = (h, t, cls) => `<div class="callout ${cls || ""}">${h ? `<b class="h">${h}</b>` : ""}${t}</div>`;
const est = t => `<p class="est">est. time: ${esc(t)}</p>`;

function verifyBox(route, items) {
  const s = store("pbyb.checks") || {};
  const tot = store("pbyb.totals") || {}; tot[route] = items.length; store("pbyb.totals", tot);
  return `<div class="verify"><h4>Verify before moving on</h4>${items.map((t, i) =>
    `<label><input type="checkbox" data-chk="${route}:${i}" ${s[route + ":" + i] ? "checked" : ""}> <span>${t}</span></label>`).join("")}</div>`;
}

/* ---------- pages ---------- */
function pgConfigure(d) {
  const f = (id, label, ph, type) => `<div><label>${label}</label><input type="${type || "text"}" data-f="${id}" placeholder="${esc(ph || "")}"></div>`;
  const ta = (id, label, ph, full) => `<div class="${full ? "full" : ""}"><label>${label}</label><textarea data-f="${id}" placeholder="${esc(ph || "")}"></textarea></div>`;
  return `<h1>Configure your lab</h1>
  <p class="est">est. time: 10 min · done by the XSC before the session</p>
  ${goal("Enter the customer and environment once. Every lab page fills itself in, with copy-ready prompts.")}
  <div class="btnrow">
    <button class="btn sec" id="saveProf">Save profile (.json)</button>
    <button class="btn sec" id="loadProf">Load profile…</button>
    <button class="btn sec" id="resetAll">Reset everything</button>
    <input type="file" id="fileIn" accept=".json" hidden>
  </div>
  <div class="form">
    <fieldset><legend>Customer</legend><div class="form" style="margin:0">
      ${f("name", "Customer name", "Acme")}${f("domain", "Public domain <small>(no https://)</small>", "acme.com")}
      ${f("industry", "Industry", "CPG")}${f("sponsor", "Sponsor", "Name, title")}
      ${f("xsc", "XSC of record", "Your name")}${f("date", "Session date", "", "date")}
    </div></fieldset>
    <fieldset><legend>Environment</legend><div class="form" style="margin:0">
      ${f("daUrl", "DA URL <small>(da.live/#/org/site)</small>", "https://da.live/#/org/site", "url")}
      ${f("gitUrl", "GitHub repo URL <small>(new repo under AEMXSC)</small>", "https://github.com/AEMXSC/customer-pbyb", "url")}
      ${f("abvUrl", "ABV org URL", "https://abv.adobe.com/org/…/overview", "url")}
      ${f("coderUrl", "Modernization Agent URL", "", "url")}
      <div><label>Media</label><select data-f="media"><option value="library">EW/EDS media library</option><option value="dam">Connected DAM</option></select></div>
      <div><label>Experience Workspace enablement</label><select data-f="ewMode"><option value="flag">Site flag (ew.enabled)</option><option value="toggle">Per-user toggle</option></select></div>
      <div class="full" id="derivedBox"></div>
    </div></fieldset>
    <fieldset><legend>Scope &amp; visibility</legend><div class="form" style="margin:0">
      ${ta("pages", "Pages in scope <small>(one path per line, ≤10; freeze after Lab 1)</small>", "/\n/how-to-wash-clothes")}
      ${ta("excluded", "Excluded <small>(apps / integrations)</small>", "Checkout\nStore locator")}
      ${ta("topics", "Topics <small>(one per line)</small>")}
      ${ta("competitors", "Competitors <small>(one domain per line)</small>")}
      ${ta("prompts", "Prompts to track <small>(customer-style questions, one per line)</small>", "", true)}
      <div><label>Visibility data path</label><select data-f="vpath"><option value="semrush">Path A — Semrush AIO</option><option value="fallback">Path B — Fallback</option></select></div>
      <div><label class="chk"><input type="checkbox" data-f="cdn"> Customer will configure CDN (optional)</label>${f("cdnProv", "CDN provider", "Fastly / Cloudflare / Akamai")}</div>
    </div></fieldset>
    <fieldset><legend>Authoring &amp; brand</legend><div class="form" style="margin:0">
      <div class="full">${f("brand", "Brand guideline location <small>(Experience Context / Preflight)</small>", "PDF or URL")}</div>
      <div><label class="chk"><input type="checkbox" data-f="trkMkt"> Marketer track</label>
      <label class="chk"><input type="checkbox" data-f="trkDev"> Developer track</label>
      <label class="chk"><input type="checkbox" data-f="trkLoc"> Localization (optional)</label></div>
    </div></fieldset>
  </div>
  <p class="est">Saved automatically in this browser only. Use “Save profile” to keep or share a customer's setup.</p>`;
}

function pgOverview(d) {
  return `<h1>${esc(d.C)} — Prove Before You Buy</h1>
  <p class="est">Agentic Brand Activation · ${v(P.xsc, "XSC of record")} · ${v(P.date, "session date")} · est. total: ~3.5 hours live</p>
  ${callout("The story", `We measure how ${esc(d.C)} shows up to AI today, move your own pages to Edge Delivery Services, let your team author and ship on them with AI — then measure again and show the difference.`)}
  <table class="t"><tr><th>Lab</th><th>What you do</th><th>Time</th><th>You walk away with</th></tr>
  <tr><td><a href="#/lab1">1</a></td><td>Baseline AI visibility and site health</td><td>45 min</td><td>Baseline findings + top issues</td></tr>
  <tr><td><a href="#/lab2">2</a></td><td>Import your pages with the Modernization Agent</td><td>45 min</td><td>Your pages live on EDS</td></tr>
  <tr><td><a href="#/lab3">3</a></td><td>Author, brand-check, publish and change code with AI</td><td>75 min</td><td>Working authoring demo on your content</td></tr>
  <tr><td><a href="#/lab4">4</a></td><td>Re-measure and show the lift</td><td>30 min</td><td>Before/after comparison</td></tr></table>
  <h3>Your environment</h3>
  <table class="t">
  <tr><td>DA (browse)</td><td>${link(d.browse, "DA URL")}</td></tr>
  <tr><td>Experience Workspace</td><td>${link(d.canvas, "canvas URL")}</td></tr>
  <tr><td>GitHub repo</td><td>${link(P.gitUrl, "GitHub repo URL")}</td></tr>
  <tr><td>Preview / Live</td><td>${link(d.preview, "preview URL")} · ${link(d.live, "live URL")}</td></tr>
  <tr><td>ABV</td><td>${link(d.abv, "ABV org URL")}</td></tr>
  <tr><td>Modernization Agent</td><td>${link(P.coderUrl)}</td></tr></table>
  <h3>Pages in scope</h3>
  <ul class="pl">${d.pages.length ? d.pages.map(x => `<li><span class="url">${esc(P.domain || "‹domain›")}${esc(x)}</span></li>`).join("") : `<li>${miss("add pages on the Configure page")}</li>`}</ul>
  <p>Not part of this pilot: ${d.excluded.length ? esc(d.excluded.join(", ")) : miss("exclusions")}. Applications and integrations are not imported by the agent.</p>
  <h3>Before you start</h3>
  <ul class="pl"><li>Chrome or Edge; sign in to da.live and confirm the org in the profile menu.</li>
  <li>Open this workbook in a split view beside your working tab (right-click the tab → <i>Add Tab to New Split View</i>).</li>
  <li>Install the Chrome Visibility Checker extension ${assumed("confirm link")}</li>
  ${P.trkDev ? `<li>Developers: Git, Node 20+, an AI coding tool (Cursor, Claude Code, or VS Code + Copilot), then <code>npm install -g @adobe/aem-cli</code></li>` : ""}</ul>
  ${verifyBox("overview", ["You can open your DA site, ABV org and the GitHub repo from the table above", "This workbook and your working tab are side by side"])}`;
}

function pgLab1(d) {
  return `<h1>Lab 1: Visibility Baseline &amp; Site Health</h1>${est("45 min")}
  ${goal(`Capture how ${esc(d.C)} appears in AI answers today versus ${esc(d.compStr)}, and the top issues on the site. Lab 4 is measured against this.`)}
  <h2>1.1 Add your inputs in ABV</h2>
  <p>1. Open ${link(d.abv, "ABV overview")}.</p>
  <p>2. Site: <span class="url">${esc(d.site)}</span></p>
  <p>3. Topics: ${esc(d.topicStr)}</p>
  <p>4. Competitors: ${esc(d.compStr)}</p>
  <p>5. Prompts to track (copy each):</p>
  ${d.prompts.length ? d.prompts.map(prompt).join("") : prompt("‹add customer-style prompts on the Configure page›")}
  ${P.vpath === "semrush" ? `<h2>1.2 Path A: Semrush-powered AI visibility</h2>
  <p>Let the Semrush AIO data load. Record the <b>AI visibility score</b>, <b>share of voice</b> versus each competitor, <b>top cited sources</b>, and topics where ${esc(d.C)} is absent.</p>
  <p>Optional: ask CX Coworker (ABV &amp; Semrush MCP) ${assumed("prompt")}</p>
  ${prompt(`Summarize ${d.C}'s AI visibility versus ${d.compStr} for these topics: ${d.topicStr}. List the 3 biggest gaps and the sources AI cites instead of ${P.domain || d.C}.`)}`
  : `<h2>1.2 Path B: Fallback (directional baseline)</h2>
  ${callout("When to use", "Semrush data is not provisioned. Label results as directional.", "warn")}
  <p>Run each prompt above in two AI answer engines. Record whether ${esc(d.C)} is mentioned, cited, and in what position.</p>`}
  <h2>1.3 Site health on the pages in scope</h2>
  <p>Run the Chrome Visibility Checker and PageSpeed Insights (mobile) on each page:</p>
  ${prompt(d.allPages)}
  <p>Record LCP, CLS, INP, performance score and structure findings. List the <b>top 3 issues</b>.</p>
  ${prompt(`For ${d.site + d.first}, what makes this page hard for an AI answer engine to quote or cite? Give the 5 highest-impact fixes, ordered by effort.`)}
  ${P.cdn ? `<h2>1.4 Optional: CDN configuration (${esc(P.cdnProv || "provider")})</h2>${callout("", "Advanced, customer environment only. Skip without penalty if blocked; the baseline is captured without it.", "warn")}` : ""}
  ${verifyBox("lab1", ["Baseline AI visibility score and share of voice recorded (or fallback results labeled directional)", "Per-page LCP, CLS, INP and performance score recorded", "Top 3 issues listed", "<b>Page list frozen.</b> Lab 4 re-measures these exact pages"])}`;
}

function pgLab2(d) {
  return `<h1>Lab 2: Import your site with the Modernization Agent</h1>${est("45 min")}
  ${goal("Turn the pages you just baselined into a live Edge Delivery Services prototype.")}
  <h2>2.1 Confirm the target</h2>
  <p>Repo: ${link(P.gitUrl, "GitHub repo URL")} (Adobe-owned for this pilot)</p>
  <p>DA site: ${link(d.browse, "DA URL")}</p>
  <h2>2.2 Run the import ${assumed("generic, confirm")}</h2>
  <p>1. Open the Modernization Agent: ${link(P.coderUrl)}. It must be configured for the repo above first.</p>
  <p>2. Give it the repo, then paste:</p>
  ${prompt(`Import these ${d.C} pages into the connected Edge Delivery Services project, preserving content structure and brand styling. Create reusable blocks where patterns repeat. Do not import applications or integrations (${d.excluded.join(", ") || "checkout, login, store locator"}).\n\n${d.allPages}`)}
  <p>3. Review the plan, approve, and watch what it reuses versus creates.</p>
  <h2>2.3 Review the result</h2>
  <ul class="pl">${d.pages.map(x => `<li>${link((d.preview || "https://‹preview›") + x)} vs. <span class="url">${esc(d.site + x)}</span></li>`).join("") || `<li>${miss("add pages")}</li>`}</ul>
  <p>Images: ${P.media === "dam" ? "served from the connected DAM." : "stored in the EW/EDS media library for this pilot."}</p>
  ${callout("Be candid", `Note what the agent did not recreate (${esc(d.excluded.join(", ") || "apps and integrations")}).`, "warn")}
  ${verifyBox("lab2", ["Every in-scope page renders on aem.page", "Time-to-import recorded: ____ min", "Gaps and exclusions noted for the customer"])}`;
}

function pgLab3(d) {
  return `<h1>Lab 3: Author with Experience Workspace and AI</h1>${est("75 min")}
  ${goal("Show what working on this CMS feels like, using the pages you imported. Flows adapted from the DevLive26 Experience Workspace workshop.")}
  <h2>3.1 Turn on Experience Workspace</h2>
  ${P.ewMode === "flag" ? `<p>Set <code>ew.enabled = true</code> in the <b>flags</b> sheet (not the data sheet) at ${link(d.config, "da.live/config URL")}. Open ${link(d.canvas, "canvas URL")}; the URL should contain <code>/canvas#/</code>.</p>`
  : `<p>Open any page in the classic editor and click <b>New Authoring</b> (top right, next to Feedback). It affects only you.</p>`}
  <h2>3.2 Find your way around (15 min)</h2>
  <p>1. Browse ${link(d.browse, "DA URL")}, select a few pages, <b>Preview</b> then <b>Publish</b>. Select files, not folders.</p>
  <p>2. Open a page; switch Layout → Content → Split; use <i>Edit block</i>.</p>
  <p>3. Right rail: Outline, Page, Comments, Content, Versions. Create a version named “Before AI edits”.</p>
  ${P.trkMkt ? `<h2>3.3 Marketer track: author with the AI assistant (30 min)</h2>
  <p>1. Summarize and improve metadata:</p>
  ${prompt("Summarize this page, then suggest 3 SEO meta descriptions under 160 characters.")}
  <p>2. Apply one and review the Approve/Reject diff before approving.</p>
  <p>3. Close a Lab 1 gap (paste your top gaps first):</p>
  ${prompt(`Rewrite the intro of this page so an AI answer engine can quote it accurately. Target topics: ${d.topicStr}. Gaps to address: [paste top 3 gaps from Lab 1]. Keep ${d.C}'s brand voice.`)}
  ${prompt("Add an FAQ section with 5 questions customers ask about this page's topic, with concise factual answers.")}
  <p>4. Brand check (${P.brand ? "rules from " + esc(P.brand) : miss("brand guideline location")}):</p>
  ${prompt("/aem-governance-evaluate-page")}
  ${prompt("/aem-governance-get-brand-checks")}
  <p>5. Fix a flagged issue by chat, re-run the check, open <b>Prepare → Preflight</b>, then <b>Preview → Publish</b>.</p>` : ""}
  ${P.trkDev ? `<h2>3.4 Developer track: AI-assisted code change (30 min)</h2>
  <p>1. Clone and run locally:</p>
  ${prompt(`git clone ${P.gitUrl || "‹GitHub repo URL›"}\ncd ${d.repo || "‹repo›"}\nnpm install\naem up`)}
  <p>2. In your AI coding tool ${assumed("prompt")}</p>
  ${prompt(`Add a new variation to the hero block that matches ${d.C}'s brand colors and typography from ${P.domain || "the live site"}. Keep it accessible and performant; update the block's CSS and JS only.`)}
  <p>3. Review the diff, lint, push a feature branch and open the branch preview. Time to ship: ____ min.</p>` : ""}
  ${P.trkLoc ? `<h2>3.5 Localization (optional)</h2><p>Run the localization skill on <code>${esc(d.first)}</code> and review the result. ${assumed()}</p>` : ""}
  ${verifyBox("lab3", ["Experience Workspace is on (URL contains /canvas#/)", "One page edited through chat, with the diff reviewed, and published", "A brand governance scorecard with checks run / passed / failed", ...(P.trkDev ? ["One AI-assisted code change previewed on a branch"] : [])])}`;
}

function pgLab4(d) {
  return `<h1>Lab 4: Visibility Lift Validation</h1>${est("30 min")}
  ${goal("Re-measure the same pages and compare with the Lab 1 baseline.")}
  <p>1. Re-run the Chrome Visibility Checker and PageSpeed Insights (mobile) on the imported pages:</p>
  ${prompt(d.allPreview)}
  <p>2. Re-run the brand check:</p>
  ${prompt("/aem-governance-evaluate-page")}
  <p>3. Ask Coworker for the story:</p>
  ${prompt(`Compare the Lab 1 baseline and the Lab 4 results for ${d.C}: AI visibility readiness, page speed (LCP, CLS, INP), content structure and brand compliance. Write a short executive summary and a recommended next step.`)}
  ${callout("Set the expectation", "The prototype is synthetic and built from public pages. AI-visibility prompt scores reflect the production domain, so show structure, speed and brand deltas and explain what changes when pages go live.", "warn")}
  <h2>Wrap-up</h2>
  <ul class="pl"><li>What improved most? What surprised you?</li><li>What would full migration look like beyond these pages?</li><li>Next steps: ongoing ABV subscription; Experience Workspace / Sites expansion; full CMS/EDS migration.</li></ul>
  ${verifyBox("lab4", ["Same pages re-measured: speed, structure, brand compliance", "Before/after story captured for the sponsor", "Next steps agreed"])}`;
}

/* ---------- routing ---------- */
const ROUTES = [
  { id: "configure", group: "Start", title: "Configure", sub: "Customer & environment", fn: pgConfigure },
  { id: "overview", group: "Start", title: "Overview", sub: "Your pilot at a glance", fn: pgOverview, checks: 2 },
  { id: "lab1", group: "Labs", title: "Lab 1: Visibility Baseline", sub: "45 min", fn: pgLab1 },
  { id: "lab2", group: "Labs", title: "Lab 2: Import with Modernization Agent", sub: "45 min", fn: pgLab2 },
  { id: "lab3", group: "Labs", title: "Lab 3: Author with AI", sub: "75 min", fn: pgLab3 },
  { id: "lab4", group: "Labs", title: "Lab 4: Visibility Lift", sub: "30 min", fn: pgLab4 }
];
const routeOf = id => ROUTES.find(r => r.id === id) || ROUTES[0];

function renderNav(active) {
  let html = "", last = "";
  ROUTES.forEach(r => {
    if (r.group !== last) { html += `<h4>${esc(r.group)}</h4>`; last = r.group; }
    html += `<a href="#/${r.id}" class="${r.id === active ? "active" : ""}" data-r="${r.id}"><span class="dot"></span><span class="t">${esc(r.title)}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span></a>`;
  });
  $("#nav").innerHTML = html;
  refreshDots();
}
function refreshDots() {
  const s = store("pbyb.checks") || {};
  ROUTES.forEach(r => {
    const a = $(`#nav a[data-r="${r.id}"]`); if (!a) return;
    const tot = (store("pbyb.totals") || {})[r.id];
    const el = document.querySelectorAll(`[data-chk^="${r.id}:"]`);
    let done = false;
    if (el.length) done = Array.from(el).every(e => e.checked);
    else if (tot) { let n = 0; for (let i = 0; i < tot; i++) if (s[r.id + ":" + i]) n++; done = n === tot; }
    a.classList.toggle("done", done);
    $(".dot", a).textContent = done ? "✓" : "";
  });
}

function pager(i) {
  const prev = ROUTES[i - 1], next = ROUTES[i + 1];
  return `<div class="pager">${prev ? `<a href="#/${prev.id}"><small>Previous</small>${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a class="next" href="#/${next.id}"><small>Next</small>${esc(next.title)}</a>` : ""}</div>`;
}

function show() {
  const id = (location.hash.match(/^#\/([\w-]+)/) || [])[1] || (P.name ? "overview" : "configure");
  const r = routeOf(id), i = ROUTES.indexOf(r);
  promptN = 0;
  $("#content").innerHTML = r.fn(derive()) + pager(i);
  document.title = `${r.title} | PBYB Agentic Brand Activation`;
  renderNav(r.id);
  document.body.classList.remove("menu");
  if (r.id === "configure") bindForm();
  updateState();
  window.scrollTo(0, 0);
}

function updateState() {
  const pill = $("#cfgState"), ok = !!(P.name && P.daUrl && P.gitUrl && P.abvUrl);
  pill.textContent = ok ? `${P.name} · configured` : "Not fully configured";
  pill.classList.toggle("ok", ok);
  $("#topTitle").textContent = P.name ? `${P.name} — Agentic Brand Activation` : "Agentic Brand Activation Lab";
}

/* ---------- configure form ---------- */
function updateDerived() {
  const d = derive(), el = $("#derivedBox"); if (!el) return;
  el.innerHTML = `<div class="derived"><b>Derived:</b> DA org <b>${esc(d.daOrg || "–")}</b>, site <b>${esc(d.daSite || "–")}</b> · GitHub <b>${esc(d.gitOrg || "–")}/${esc(d.repo || "–")}</b> · ABV org <b>${esc(d.abvOrg || "–")}</b><br>Preview: ${esc(d.preview || "–")}${d.gitOrg && d.gitOrg.toLowerCase() !== "aemxsc" ? `<br><span style="color:var(--warn)">Repo is not under AEMXSC.</span>` : ""}</div>`;
}
function bindForm() {
  document.querySelectorAll("[data-f]").forEach(el => {
    const k = el.dataset.f;
    if (el.type === "checkbox") el.checked = !!P[k]; else el.value = P[k] || "";
    el.addEventListener("input", () => { P[k] = el.type === "checkbox" ? el.checked : el.value; store("pbyb.profile", P); updateDerived(); updateState(); });
  });
  updateDerived();
  $("#saveProf").onclick = () => {
    const blob = new Blob([JSON.stringify(P, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `pbyb-profile-${(P.name || "customer").toLowerCase().replace(/\W+/g, "-")}.json`; a.click();
  };
  $("#loadProf").onclick = () => $("#fileIn").click();
  $("#fileIn").onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { P = Object.assign({}, DEFAULTS, JSON.parse(t)); store("pbyb.profile", P); show(); } catch (x) { alert("That file is not a valid profile."); } }); };
  $("#resetAll").onclick = () => { if (confirm("Clear this browser's saved profile and checklist progress?")) { P = Object.assign({}, DEFAULTS); store("pbyb.profile", P); store("pbyb.checks", {}); show(); } };
}

/* ---------- global events ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("[data-copy]");
  if (b) {
    const t = $("#" + b.dataset.copy + " span").textContent;
    const done = () => { b.textContent = "Copied"; b.classList.add("done"); setTimeout(() => { b.textContent = "Copy"; b.classList.remove("done"); }, 1400); };
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(done, () => {
      const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); done();
    });
  }
});
document.addEventListener("change", e => {
  const c = e.target.closest("[data-chk]");
  if (!c) return;
  const s = store("pbyb.checks") || {}; s[c.dataset.chk] = c.checked; store("pbyb.checks", s); refreshDots();
});
$("#menuBtn").onclick = () => document.body.classList.toggle("menu");
$("#themeBtn").onclick = () => {
  const cur = document.documentElement.dataset.theme;
  const dark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = dark ? "light" : "dark";
  store("pbyb.theme", document.documentElement.dataset.theme);
};
const th = store("pbyb.theme"); if (th) document.documentElement.dataset.theme = th;
window.addEventListener("hashchange", show);
show();
})();
