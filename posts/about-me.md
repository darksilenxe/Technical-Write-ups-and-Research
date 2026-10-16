---
category: About me
---


# Automating the Grind: My Path in Offensive Security

Hi — I'm Christopher Norris, an offensive security engineer based in Cheyenne, Wyoming. I test web applications, I build tools to test them faster, and lately I've been obsessed with what happens when you point local AI models at the whole problem.

This is a bit about how I got here and what I'm working on.

## From help desk to the red team

Like a lot of people in this field, I didn't start out doing security — I started out keeping the lights on. My first real role was as a help desk technician, but I was the kind of help desk technician who kept wandering into the security stack: running a SIEM to chase down threats, managing virtualization infrastructure, tuning firewalls. The security side was always the part I actually wanted to be doing.

From there I spent six years in information security at a bank, starting as an analyst in 2020, moving up to engineer in 2024, and becoming the Information Security Lead for offensive security and threat intelligence in April 2026. If you've never worked in financial security, the stakes are refreshingly concrete. My work there covered network and web application vulnerability assessments, Windows and Linux server hardening, and running the detection stack: firewalls, SIEM, EDR, and NDR.

In 2026 I finally got to do the work I'd been chasing: four week-long manual penetration tests of one of the bank's applications, reporting the findings and working with the team to get them fixed. That's a small number of engagements, and I won't dress it up as more. But it confirmed what I already suspected after years of practice on TryHackMe and Hack The Box (where I've trained since 2019 and reached the top 3%): the offensive side is what hooks me — the puzzle of getting in, the moment a chain of small weaknesses turns into a real finding.

Along the way I picked up the certifications that map to that work — GRTP, GWAPT, GPEN, GCPN, GDAT, and CCSP — and I stay plugged into the community through the OWASP Denver chapter, Wyoming ISSA, and the GIAC Advisory Board. But certs are the floor, not the story. The story is what I build.

## The tool that started with a problem I couldn't solve

Here's the honest origin of my biggest project.

I've wanted to seriously run bug bounty programs for a long time. I have a HackerOne account. What I didn't have — between a full-time security job at a bank and being a new dad — is the endless uninterrupted hours that manual bug hunting quietly demands. Recon, enumeration, testing, validation, writing it all up: it's a grind, and the grind is exactly what gets crowded out when your evenings belong to a toddler.

So I did the engineer thing. Instead of accepting that I didn't have time, I built something to give me leverage on the time I *did* have.

That project is [**auto-bughunter**](https://github.com/darksilenxe/auto-bughunter) — an open-source, MIT-licensed, AI-driven web application security platform. It runs the full pentest lifecycle autonomously: reconnaissance, scanning, exploitation checks, finding validation, attack-path correlation, and reporting, coordinated by a dozen-plus specialized agents with an AI orchestration planner deciding what runs next. Under the hood it's a Dockerized Go, React, and Python stack that integrates around twenty industry tools as isolated sidecars, includes its own Burp-style intercepting proxy, runs local LLMs (or external providers), grounds its reasoning in a retrieval-augmented knowledge service so the AI cites real methodology instead of hallucinating it, and persists everything in PostgreSQL and Neo4j.

The piece I'm proudest of isn't the feature list — it's the accuracy benchmark harness. It grades the scanner's precision, recall, and F1 against known-vulnerable targets (DVWA, WebGoat, and OWASP Juice Shop) *and* clean negative controls, running in CI, so no new detection can quietly break three others. A scanner you can't measure is a scanner you can't trust, and I wanted to be able to trust mine.

I wrote up the full architecture — the design decisions, the safety controls, the two-database split, all of it — in a separate [technical write-up](https://github.com/darksilenxe/Technical-Write-ups-and-Research) if you want to go deep.

## On building with AI (and being honest about it)

I'll say this plainly, because I think it matters: auto-bughunter was built with heavy use of AI-assisted development. I lean on tools like GitHub Copilot, and I'm not shy about it.

What I've learned is that "AI wrote a lot of it" and "I understand it" aren't in tension. The parts AI is genuinely bad at are the parts that make or break a system like this: deciding where the trust boundaries go, choosing the right database for the shape of the data, keeping an autonomous loop bounded so it can't run away, making the whole thing degrade safely when there's no AI provider at all, and building the harness that tells you whether any of it actually works. Directing an AI agent well — reviewing its output, catching where it's confidently wrong, imposing an architecture it never would have chosen — is a real skill, and it's one I've spent a lot of hours sharpening. I can read and modify every part of what I ship.

## A habit of building small, sharp tools

auto-bughunter is the big one, but I build constantly. A sampling from my [GitHub](https://github.com/darksilenxe):

- **GoOTX** — a threat-intelligence client I wrote from scratch in Go to pull indicators from the AlienVault OTX API and export clean feeds for other tools. This one's special to me because it was pure, from-the-ground-up learning — the project where I decided it was time to really learn to write code as a security professional, not just use other people's.
- **darksast** — a static analysis (SAST) tool that scans JavaScript for security vulnerabilities.
- **Power-graph-mapper** — a network-communication mapper that collects data across local, remote, SSH, and packet-capture sources and renders it as an interactive, directional graph.
- **GoScan**, **Gosploit**, and **domain-risk-triage** — a fast network scanner, a modular vulnerability framework, and a domain risk-scoring CLI, respectively.

All of it runs on a four-server home lab I've built out over several years — a dedicated firewall, a DNS and Docker host that doubles as a Tailscale exit node, a virtualization host, and a NAS. It's where I develop and test everything before it goes public.

There's a theme here: I like turning a repetitive, manual security task into something reproducible and fast. That instinct is most of what I do.

## Where I'm headed

I wrapped up my time at the bank in September 2026, and I'm putting my focus squarely on offense: more hands-on research, retaking the OSCP, and putting auto-bughunter to work against authorized targets so the tool earns its keep with real results. The goal is a dedicated penetration testing role where I can keep building depth on real engagements.

I'm most excited about the direction the whole field is moving: AI *orchestrating* proven security tools and grounding its reasoning in real methodology — not replacing the tester, but extending how much ground one person can cover, measurably and safely. That's the thing I want to keep building.

If any of this resonates — whether you're working on similar problems, hiring for them, or just want to talk shop about AI and offensive security — I'd genuinely enjoy the conversation.

- **GitHub:** [github.com/darksilenxe](https://github.com/darksilenxe)
- **LinkedIn:** [linkedin.com/in/christopher-n-89088617b](https://linkedin.com/in/christopher-n-89088617b)

*Everything I build is for authorized security testing only — systems you own or have explicit permission to assess.*
