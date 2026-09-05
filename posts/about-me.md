---
title: About Me
---


Automating the Grind: My Path in Offensive Security
Hi — I'm Christopher Norris, an offensive security engineer based in Cheyenne, Wyoming. I break web applications for a living, I build tools to break them faster, and lately I've been obsessed with what happens when you point local AI models at the whole problem.
This is a bit about how I got here and what I'm working on.
From help desk to the red team
Like a lot of people in this field, I didn't start out doing security — I started out keeping the lights on. My first real role was as a help desk technician, but I was the kind of help desk technician who kept wandering into the security stack: running a SIEM to chase down threats, managing virtualization infrastructure, tuning firewalls. The security side was always the part I actually wanted to be doing.
For the last several years I've been the Information Security Lead for offensive security and threat intelligence at a bank — which, if you've never worked in financial security, means the stakes are refreshingly concrete. I lead full-scope web application and network penetration testing across the institution's environment: finding the exploitable things before someone with worse intentions does, then working with teams to actually close them. Six-plus years in, the part that still hooks me is the offensive side — the puzzle of getting in, the moment a chain of small weaknesses turns into a real finding.
Along the way I picked up the certifications that map to that work — GWAPT, GPEN, GCPN, CCSP, PenTest+ — and I stay plugged into the community through the OWASP Denver chapter, Wyoming ISSA, and the GIAC Advisory Board. But certs are the floor, not the story. The story is what I build.
The tool that started with a problem I couldn't solve
Here's the honest origin of my biggest project.
I've wanted to seriously run bug bounty programs for a long time. I have a HackerOne account. What I don't have — between leading offensive security at a bank and being a new dad — is the endless uninterrupted hours that manual bug hunting quietly demands. Recon, enumeration, testing, validation, writing it all up: it's a grind, and the grind is exactly what gets crowded out when your evenings belong to a toddler.
So I did the engineer thing. Instead of accepting that I didn't have time, I built something to give me leverage on the time I did have.
That project is auto-bughunter — an open-source, AI-driven web application security platform. It runs the full pentest lifecycle autonomously: reconnaissance, scanning, exploitation checks, finding validation, attack-path correlation, and reporting, coordinated by a dozen-plus specialized agents with an AI orchestration planner deciding what runs next. Under the hood it's a Dockerized Go, React, and Python stack that integrates around twenty industry tools as isolated sidecars, runs local LLMs (or external providers), grounds its reasoning in a retrieval-augmented knowledge service so the AI cites real methodology instead of hallucinating it, and persists everything in PostgreSQL and Neo4j.
The piece I'm proudest of isn't the feature list — it's the accuracy benchmark harness. It grades the scanner's precision, recall, and F1 against known-vulnerable targets and clean negative controls, running in CI, so no new detection can quietly break three others. A scanner you can't measure is a scanner you can't trust, and I wanted to be able to trust mine.
I wrote up the full architecture — the design decisions, the safety controls, the two-database split, all of it — in a separate technical write-up if you want to go deep.
On building with AI (and being honest about it)
I'll say this plainly, because I think it matters: auto-bughunter was built with heavy use of AI-assisted development. I lean on tools like GitHub Copilot, and I'm not shy about it.
What I've learned is that "AI wrote a lot of it" and "I understand it" aren't in tension. The parts AI is genuinely bad at are the parts that make or break a system like this: deciding where the trust boundaries go, choosing the right database for the shape of the data, keeping an autonomous loop bounded so it can't run away, making the whole thing degrade safely when there's no AI provider at all, and building the harness that tells you whether any of it actually works. Directing an AI agent well — reviewing its output, catching where it's confidently wrong, imposing an architecture it never would have chosen — is a real skill, and it's one I've spent a lot of hours sharpening. I can read and modify every part of what I ship.
A habit of building small, sharp tools
auto-bughunter is the big one, but I build constantly. A sampling from my GitHub:
GoOTX — a threat-intelligence client I wrote from scratch in Go to pull indicators from the AlienVault OTX API and export clean feeds for other tools. This one's special to me because it was pure, from-the-ground-up learning — the project where I decided it was time to really learn to write code as a security professional, not just use other people's.
darksast — a static analysis (SAST) tool that scans JavaScript for security vulnerabilities.
Power-graph-mapper — a network-communication mapper that collects data across local, remote, SSH, and packet-capture sources and renders it as an interactive, directional graph.
GoScan, Gosploit, and domain-risk-triage — a fast network scanner, a modular vulnerability framework, and a domain risk-scoring CLI, respectively.
There's a theme here: I like turning a repetitive, manual security task into something reproducible and fast. That instinct is most of what I do.
Where I'm headed
I'm continuing to sharpen the craft — more offensive research, retaking the OSCP, and finally putting auto-bughunter to work against authorized targets so the tool earns its keep with real results. I'm most excited about the direction the whole field is moving: AI orchestrating proven security tools and grounding its reasoning in real methodology — not replacing the tester, but extending how much ground one person can cover, measurably and safely. That's the thing I want to keep building.
If any of this resonates — whether you're working on similar problems, hiring for them, or just want to talk shop about AI and offensive security — I'd genuinely enjoy the conversation.
GitHub: github.com/darksilenxe
LinkedIn: linkedin.com/in/christopher-n-89088617b
Everything I build is for authorized security testing only — systems you own or have explicit permission to assess.
