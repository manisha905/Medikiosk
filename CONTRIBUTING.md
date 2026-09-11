# Contributing to Mediokiosk

## Getting started

Use Node.js 20 or newer. Install dependencies with `npm install`, then start the app with `npm run dev`.

## Team workflow

1. Pull the latest `main` branch before starting work.
2. Create a short-lived branch such as `feature/record-upload` or `fix/mobile-nav`.
3. Keep one focused change per pull request.
4. Run `npm run build` before opening a pull request.
5. Request a teammate review before merging into `main`.

## Project conventions

- Keep page components in `src/pages/` and reusable UI in `src/components/`.
- Use the shared teal design tokens from `src/styles/`.
- Do not commit `.env` files, `node_modules`, or generated `dist` output.
- Keep real patient data out of demos, screenshots, and commits.
