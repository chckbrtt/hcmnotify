# 🔔 HCMNotify — Admin Portal

**UKG Ready Monitoring & ETL Platform**

A real-time admin portal for managing UKG Ready tenant connections, monitoring webhook events (DD changes, account modifications), and exploring UKG APIs.

## Features

| Feature | Status |
|---------|--------|
| 📊 Dashboard with real-time stats | ✅ Active |
| 🏢 Multi-tenant management | ✅ Active |
| 🔑 OAuth2 auth testing + JWT decode | ✅ Active |
| 🔌 API Explorer with presets | ✅ Active |
| 🔔 Webhook event monitoring | ✅ Active |
| 🤖 AI Pattern Analysis | ✅ Active |
| 🔒 AES-256-GCM credential encryption | ✅ Active |
| 🔄 ETL Pipeline | 🔜 Planned |
| 📧 Alert notifications (email/SMS) | 🔜 Planned |

## Stack

- **Backend:** Node.js, Express, TypeScript, SQLite (better-sqlite3)
- **Frontend:** React, Tailwind CSS, Vite
- **Auth:** Session-based, bcrypt password hashing
- **Encryption:** AES-256-GCM for stored credentials
- **Deploy:** Render (free tier)

## Quick Start

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Build
cd .. && npm run build

# Run
npm run start
# → http://localhost:5000
```

**Default login:** admin / admin123

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| SESSION_SECRET | Express session secret | dev fallback |
| ENCRYPTION_KEY | AES-256 key for credential storage | dev fallback |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│   Express    │────▶│  UKG Ready   │
│  (React UI) │     │   Backend    │     │    API        │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────┴───────┐
                    │   SQLite DB  │
                    │  (encrypted  │
                    │  credentials)│
                    └──────────────┘
```

Credentials are **never** sent to the browser. All UKG API calls are proxied through the backend.

## CPB3 Tech LLC — Confidential
