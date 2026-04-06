# Rajeev Patil — Personal Portfolio

Personal portfolio website built with Angular 18. Features a split landing page leading to two distinct worlds: an **Engineering** portfolio and a **Photography** portfolio.

**Live site:** [rajeevpatil.com](https://rajeevpatil.com) <!-- update if different -->

---

## Overview

| Section | Description |
|---|---|
| Landing | Split-panel entry — choose Engineer or Photography |
| Engineer | Full-page portfolio: skills, experience, projects, contact form |
| Photography | Photo gallery and visual work |

### Engineer Portfolio Highlights
- Skills across Frontend, Backend, Tools, and AI
- Full work history (LeanTaaS, Micron Technology, etc.)
- Education: M.S. SJSU, B.E. Pune University
- Contact form powered by [EmailJS](https://www.emailjs.com/)
- Light/dark theme toggle
- Scroll-reveal animations, parallax hero, section nav dots

---

## Tech Stack

- **Framework:** Angular 18 (standalone components, Signals)
- **State:** Angular Signals + NgRx patterns
- **Styling:** SCSS, CSS Grid, Flexbox
- **Email:** @emailjs/browser
- **Hosting:** Firebase Hosting
- **Language:** TypeScript 5.4

---

## Getting Started

### Prerequisites
- Node.js 20+
- Angular CLI 18

```bash
npm install -g @angular/cli
```

### Install & Run

```bash
npm install
ng serve
```

Navigate to `http://localhost:4200/`.

### Build

```bash
ng build
```

Output goes to `dist/rajeev-patil/`.

### Deploy (Firebase)

```bash
ng build
firebase deploy
```

---

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   └── services/         # ThemeService, EmailService
│   ├── pages/
│   │   ├── landing/          # Split-panel entry page
│   │   ├── engineer/         # Engineering portfolio
│   │   └── photography/      # Photography portfolio
│   └── app.component.*
└── styles.scss               # Global styles
```

---

## Scripts

| Command | Description |
|---|---|
| `ng serve` | Start dev server at localhost:4200 |
| `ng build` | Production build |
| `ng build --watch` | Watch mode build |
| `ng test` | Run unit tests via Karma |
