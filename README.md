# Mediokiosk frontend

A React/Vite citizen health kiosk styled as a Government of India health services portal.

## Citizen flow

1. Choose ID type — Aadhaar or Driving Licence
2. Verify identity — document number check (demo)
3. Confirm mobile number and OTP (demo code `1234`)
4. Open the Health Services dashboard

## Dashboard

- Overview
- Upload records
- View details
- Access history
- Health assistant

## Run locally

```bash
npm install
npm run dev
```

The application entry point is `index.html`. Implementation lives in `src/` following the health-app folder structure. Static HTML prototypes remain as reference.
