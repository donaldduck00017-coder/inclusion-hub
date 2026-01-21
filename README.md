## Why This Exists

Most security learning platforms focus on *exploitation*.
**Inclusion Lab V3 focuses on engineering, detection, and operations.**

The goal is to train learners to think like:

* Security Engineers
* SOC Analysts
* Platform Defenders

Not just attackers.

This platform is designed to simulate how real security teams **observe, detect, respond to, and improve systems** — not just how vulnerabilities are triggered.

---

## Personal Engineering Goals

So far, I have built:

* **Inclusion Lab V1** — Basic LFI/RFI practice lab focused on understanding vulnerable vs. secured web flows
* **Inclusion Lab V2** — SQL Injection & Python scripting lab with AI-assisted conceptual analysis

**Inclusion Lab V3 represents my transition from building individual applications to designing full security platforms.**

Through this system, I am actively practicing:

* Designing frontend architectures as part of the **security boundary**, not just the presentation layer
* Implementing **role-based access control and feature flag systems** used in enterprise platforms
* Building **telemetry pipelines** to analyze user behavior and learning patterns
* Creating **SOC-style dashboards and audit tools** for session replay and incident review
* Applying **privacy-by-design and secure UI practices**
* Integrating **AI as a reasoning and explanation layer**, not a content generator

My long-term goal is to develop the mindset and technical depth required for **security engineering, platform security, and cybersecurity infrastructure roles**, where building *observable, auditable, and defensible systems* is as important as understanding vulnerabilities themselves.

---

## Real-World Intent & Future Scope:

Inclusion Lab V3 is designed to evolve into a **cyber range-style training and analysis platform** that mirrors how organizations train:

* Internal security teams
* SOC analysts
* Security engineers
* DevSecOps practitioners

Future real-world use cases include:

* **Enterprise Security Training** — Simulating internal web systems and detection workflows for onboarding and upskilling
* **SOC Workflow Practice** — Training analysts to triage alerts, analyze timelines, and review session replays
* **Security Engineering Labs** — Teaching how detection rules, telemetry, and platform design reduce attack impact
* **Academic Cyber Ranges** — Providing controlled, ethical environments for defensive security education
* **Product Security Simulations** — Demonstrating how frontend, backend, and infrastructure design influence attack surfaces

The platform is intentionally designed to support **containerized, isolated challenge environments** and **modular service architecture**, enabling safe, scalable deployment in both local lab and cloud-based training setups.

---

## Core Features

* **Cyber-Themed Design System** — Professional, SOC-inspired UI with dark mode and status-driven visuals
* **Role-Based Access Control** — Student, Instructor, and Admin views with feature gating
* **Challenge Workspace** — Guided learning environment with hints, submissions, and AI-based explanations
* **Telemetry & Analytics** — Tracks time-on-task, hint usage, retries, and navigation patterns
* **SOC Dashboard** — Live alerts, severity indicators, and detection timelines
* **Audit Mode** — Session replay system for reviewing learner behavior and system responses
* **Security-First Frontend** — CSP, input sanitization, token handling, and clickjacking protection

---

## Architecture Overview

```
Frontend (Cyber Operations Console)
   |
API Gateway (Mock / Real Switchable)
   |
Challenge Engine
   |
Telemetry & Detection Pipeline
   |
AI Reasoning & Tutor Service
   |
SOC Dashboard & Reporting
```

---

## Ethical Scope

This platform is designed strictly for **educational and defensive security training**.

All challenges and simulations operate in **isolated, controlled environments** and do not target real-world systems.

The AI tutor is designed to:

* Explain **security concepts**
* Provide **defensive reasoning**
* Guide **learning pathways**

It does **not** generate exploit payloads or real-world attack instructions.

---

## Tech Stack

* React + TypeScript
* Tailwind CSS + shadcn/ui
* Zustand (State Management)
* TanStack Query (Data Fetching)
* Vite (Build Tooling)
* DOMPurify (Input Sanitization)

---

## Roadmap

* [x] Frontend architecture and design system
* [x] Mock API and service factory
* [X] Challenge workspace and telemetry integration
* [X] SOC dashboard and alert system
* [ ] Audit mode session replay
* [ ] AI reasoning and tutor integration
* [ ] Containerized challenge environments (Docker-based cyber range)
* [ ] Detection rule engine and alert correlation pipeline

---

## Running Locally

```bash
npm install
npm run dev
```

---

## License

MIT License

---

## Closing Note

This project is not a single application — it is a **platform design exercise** focused on building systems that can be **observed, audited, and defended**.

It reflects my goal of becoming an engineer who doesn’t just write features, but designs **security-aware platforms** that mirror how real-world security teams operate, learn, and improve their defenses.




