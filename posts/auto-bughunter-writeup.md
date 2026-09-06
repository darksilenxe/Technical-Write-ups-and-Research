-----
category: technical write up
-----

# Building auto-bughunter: An AI-Orchestrated Web Application Security Platform

*A technical write-up of an open-source project I built to explore how far AI-assisted development could take a full web-application security testing pipeline. The platform is for **authorized testing only** — systems you own or have explicit written permission to assess.*

Repo: `github.com/darksilenxe/auto-bughunter` (MIT-licensed)

---

## Why I built it

I wanted to answer a specific question: how much of a real, end-to-end web-application penetration testing workflow could be assembled if you leaned hard on AI-assisted development and local LLMs, instead of treating automation as a bag of disconnected scripts?

The result, `auto-bughunter`, is a Dockerized, multi-service platform that runs the full assessment lifecycle — reconnaissance, scanning, exploitation checks, finding validation, attack-path correlation, and reporting — coordinated by a set of specialized agents. I built it with GitHub Copilot as a development accelerator, and a good deal of the code was AI-assisted. What I care about, and what I can defend, is the *architecture*: the decisions about how the pieces fit together, where isolation boundaries go, how the system stays safe when pointed at a live target, and how I measure whether it's actually accurate.

This post walks through that architecture.

---

## High-level architecture

The system is a set of containers wired together with Docker Compose. There are a few deliberate design choices baked into that shape:

- **A slim Go backend as the single orchestrator.** The backend container ships only the Go server binary. It is the *only* service that holds privileged access and the only service that talks to the tool sidecars. No sidecar talks to another sidecar. That gives me one place to reason about trust and one place to enforce scope and safety.
- **A React/Vite frontend** for driving scans, reviewing findings, and using the built-in proxy suite.
- **A Python ML service** for finding triage and scoring, kept out of the Go backend so the backend image stays minimal.
- **Per-tool sidecars.** Each heavy security dependency (OWASP ZAP, Nuclei, sqlmap, nikto, the ProjectDiscovery suite, ffuf, gobuster, and others) runs in its own container. That keeps Python, Perl, Ruby, and Go toolchains out of the backend image and isolates each tool's blast radius.

Two integration modes connect the backend to those tools. In **exec mode**, thin shim scripts in the backend `exec` into the matching sidecar — simple, but it requires a Docker socket bind-mount, which is effectively root-equivalent on the host and only appropriate for single-tenant self-hosted use. In **HTTP mode**, tool sidecars expose HTTP endpoints the backend calls directly, which removes the Docker socket requirement entirely and works cleanly under orchestrators like Kubernetes. Supporting both let me migrate gradually rather than rewrite everything at once.

---

## The agent pipeline

Rather than one monolithic scanner, the platform decomposes an assessment into specialized agents, each with a narrow responsibility:

- **Reconnaissance** — DNS resolution, service discovery, tech-stack fingerprinting.
- **JavaScript SAST** — captures the in-scope JS bundles a target ships and runs static analysis over them: client-side sink detection (DOM XSS, `eval`/`new Function`, insecure `postMessage`, secrets in client storage), genuine code-defect detection, and route extraction. Discovered routes then seed a focused wordlist pass, and discovered weakness classes tailor which active probes run next.
- **Scanning** — core checks (security headers, cookies, TLS, headless-browser interaction).
- **Wordlist** — directory, subdomain, and API-endpoint discovery.
- **Analysis** — deduplication and severity ranking.
- **ML Triage** — deterministic risk scoring and exploitability estimation across findings.
- **Attack Path** — cross-category correlation to infer likely multi-step chains.
- **False-Positive Review** — a confidence-based shortlist for human verification.
- **Remediation Planner** — a prioritized remediation sequence.
- **Reporting** — executive summaries and top-risk identification.

By default the agents run in a deterministic sequence. When an AI provider is configured, an **autonomous orchestration planner** takes over: after each step it picks the next agent to run and can dynamically spawn additional agents — including repeating earlier stages — based on the findings observed so far. The loop is bounded (a configurable maximum number of rounds) so it always terminates, and if no AI provider is available the system falls back to the static deterministic pipeline. That fallback is important: the platform degrades to a predictable mode rather than failing when AI isn't present.

---

## The scanning engine

Under the agents sits a library of 40+ vulnerability probe classes spanning the OWASP Top 10 and a good deal beyond it. A non-exhaustive sample:

- **Injection** — reflected, stored, and DOM-based XSS; SQL injection (error- and time-based); NoSQL injection; SSTI; XXE; path traversal / LFI; CRLF injection; OS command injection with out-of-band callback detection.
- **Logic, auth, and access control** — CORS misconfiguration, CSRF, open redirect, HTTP request smuggling (CL.TE / TE.CL desync), cache poisoning, HTTP parameter pollution, JWT weaknesses (`alg:none`, weak HMAC), OAuth/OIDC flow abuse, IDOR and horizontal privilege escalation via multi-role response diffing, race conditions, and deserialization probes.
- **Infrastructure** — SSRF via headers and body parameters (OAST-backed), subdomain takeover via dangling-CNAME fingerprinting, virtual-host discovery.
- **GraphQL** — introspection exposure and abuse (batching, depth, alias overloading).

The probes are detection-oriented by default — they confirm a vulnerability class without sending destructive or persistent payloads. Anything higher-impact is gated (more on that below).

A design detail I'm proud of: several probes confirm rather than guess. The sensitive-file-exposure probe matches content signatures instead of status codes so an HTML catch-all page isn't misreported. The forbidden-path-bypass probe re-requests 401/403 resources with path mutations and override headers and only flags a real 2xx. The IDOR role-diff probe replays identifier-bearing endpoints as each identity and only fires when two identities get equivalent successful responses. Reducing false positives was a first-class goal, not an afterthought.

---

## The intercepting proxy

The platform includes a Burp-style proxy suite — HTTP history, a Repeater, and an Intruder-style fuzzer — exposed in the frontend. The intercepting listener captures plain HTTP fully and HTTPS via optional TLS interception when a CA is configured; the backend can self-sign a CA on first boot, which you then install in your browser's trust store. Scanner traffic can optionally be routed through the same proxy, so automated probes show up alongside browsed traffic in the network view and inherit any session cookies captured while browsing. The headless Chromium sidecar always routes through the proxy so page loads and screenshots survive TLS re-signing.

---

## The AI and knowledge layer

The platform is provider-agnostic. It can run entirely locally through an Ollama sidecar, or against external OpenAI-compatible providers (OpenAI, Anthropic, Gemini, Bedrock). Locally, I split work across three role-specific models to keep latency and resource use sane:

- a ~9B model for **primary reasoning and triage**,
- CodeLlama-7B for **orchestration planning**,
- Llama 3.2 3B for **fast, high-frequency JSON decisions** (adaptive-probe steps, tool-call planning), running on its own concurrency lane so it can't be starved by long planner calls.

Crucially, the AI doesn't hallucinate methodology in a vacuum. A dedicated **retrieval-only security-knowledge service** supplies curated, cited AppSec context (OWASP, CWE, PortSwigger, with optional HackTricks and PayloadsAllTheThings imports) into AI summaries, next-action suggestions, and generated reports. That grounding is what makes the AI output referenceable instead of just plausible-sounding.

---

## The data layer

Two databases, each chosen for what it's good at:

- **PostgreSQL (with pgvector)** persists scans, per-scan asset inventory, run events, findings with structured evidence, and model-recommendation artifacts.
- **Neo4j** optionally stores attack-graph snapshots so multi-step attack paths can be visualized and replayed in the frontend. A graph database is the natural home for "which findings chain into which" — the exact question the Attack Path agent asks.

---

## The ML triage service

Finding triage is delegated to a separate Python service that scores findings, estimates exploitability, generates attack paths, and produces remediation plans. It supports ONNX-backed scoring with an automatic fallback to a deterministic heuristic scorer if a model fails to load. Rollout safety is built in through a scoring mode switch — `blend`, `shadow` (serve the deterministic output while logging what the model *would* have done), or `heuristic` (deterministic only). There's also a training pipeline that snapshots a sanitized, pseudonymized engagement dataset (tokens, cookies, and password-like data are masked before export), enforces quality and privacy gates, and trains and evaluates a candidate model.

---

## Measuring accuracy (the part I care about most)

A scanner you can't measure is a scanner you can't trust. So the platform ships an **accuracy benchmark harness** that grades scan output against a corpus of known-vulnerable training targets (DVWA, WebGoat, OWASP Juice Shop, and others) plus deliberate **negative controls** — clean apps with no known vulnerabilities that anchor the false-positive rate.

Each benchmark manifest declares the findings that *must* be reported (a miss is a false negative) and the endpoints that *must not* be flagged (a hit is a false positive). The harness emits per-category true-positive / false-positive / false-negative counts plus precision, recall, and F1. A nightly CI workflow builds the tool, grades the fixtures, and uploads the report. Probe changes are gated on a delta report showing no category regressed beyond tolerance versus the previous baseline.

This is the piece that turned the project from "a pile of probes" into something with an engineering feedback loop. Every new detection has to prove it didn't quietly break three others.

---

## Designing for responsible use

An offensive tool has to be safe by construction, especially one with any autonomy. The controls I built in:

- **Scope enforcement.** Scans honor include/exclude host and path rules; integration expansion and wordlist probes are all constrained to scope.
- **SSRF protections everywhere.** Outbound probe and proxy targets are validated against localhost, private, link-local, and cloud-metadata IP ranges. Even AI-proposed proof-of-concept requests are validated against scope and rejected if they target a different host than the scan target.
- **Destructive checks are off by default.** High-impact modules require an explicit `ALLOW_DESTRUCTIVE_CHECKS` flag and only run against authorized programs.
- **Authorization evidence for automation.** Recurring unattended campaigns require signed approval metadata and at least one authorization-evidence record before they can run.
- **An HTTPS guard** validates that internal service and third-party API calls use TLS for any public host.
- **Secrets are never persisted in scan data** — auth material is used only at execution time, and ML dataset exports mask sensitive values and pseudonymize identifiers.

---

## What AI-assisted development actually looked like

I'll be direct about this, because it's the whole point of the experiment: a large portion of the code was written with GitHub Copilot. That didn't make it write itself. My job was the parts AI is bad at — deciding the service boundaries, choosing the two-database split, designing the exec-vs-HTTP integration migration, working out how to keep the orchestration loop bounded and how to make it degrade safely without an AI provider, and building the accuracy harness so I could tell whether any of it worked. AI-assisted development let one person cover an unusually large surface area quickly; it did not replace understanding the system, and I can read and modify any part of it.

If anything, the experience made the case *for* AI-assisted development as a skill in its own right: knowing how to direct it, review its output, catch where it's confidently wrong, and impose an architecture it wouldn't have chosen on its own.

---

## Limitations and what's next

Honest boundaries matter as much as features:

- The platform **generates submission-ready reports**; it does not replace human judgment on what's worth reporting. A validation gate and false-positive review exist precisely because automated confidence isn't the same as a confirmed, reportable bug.
- Some components are integrated rather than authored by me — third-party expert-prompt references and an external LLM-assisted XSS tool are bundled, not vendored, and credited as such.
- The autonomous orchestration is bounded and conservative by design; expanding it safely (better ROI gating, richer attack-path synthesis) is on the roadmap.

---

## Closing

`auto-bughunter` started as a question about what AI-assisted development could do, and turned into a working demonstration of an idea I believe in: that the future of offensive security tooling is AI *orchestrating* proven tools and grounding its reasoning in real methodology — not replacing the tester, but extending how much ground one tester can cover, measurably and safely.

*Use it only against systems you own or are explicitly authorized to test.*
