# HCMNotify Prototype — Demo Script for Slice
## Thursday 2/27/2026

**Login:** admin / admin123 (or chuck / admin123)
**URL:** https://hcmnotify-portal.onrender.com (or localhost:5000)

---

### Act 1: The Problem (30 seconds)
> "Every UKG Ready client is flying blind on direct deposit changes. Someone changes their routing number — payroll doesn't know until payday. That's a fraud vector and a compliance nightmare."

### Act 2: The Dashboard (1 minute)
1. **Login** → Dashboard loads
2. Point out the **pulsing red alert banner** — "3 Critical Alerts"
3. Show stats: tenants connected, events today, API calls
4. "This is what a client admin sees when they log in. Immediate visibility."

### Act 3: Event Monitor (2 minutes)
1. Click **🔔 Events** (notice the red badge with count)
2. Show the event list — critical DD changes with pulsing red borders
3. **Expand** David Chen's event — show the payload:
   - Account changed to ****2200
   - Routing changed to ****7788
   - 100% redirect — "That's someone's entire paycheck going to a new bank"
4. **Acknowledge** the event → status changes
5. Show the filters: Critical Only, Unread
6. "This is real-time. UKG fires a webhook, we catch it, classify severity, alert the admin."

### Act 4: Tenant Manager (2 minutes)
1. Click **🏢 Tenants** → Show Merbree/MoMer
2. Click **🔑 Test Auth** → Watch it authenticate in real-time
3. Point out the **JWT decode** — company ID, token expiry, subject
4. "We support multi-tenant. Each client gets their own connection. Credentials are AES-256 encrypted at rest."
5. Show the **Add Tenant** form — "Onboarding a new client is this simple."

### Act 5: API Explorer (2 minutes)
1. Click **🔌 API Explorer**
2. Select Merbree tenant
3. Click preset: **Employee Roster** → Send
4. Watch 1,635 employees load as a formatted CSV table
5. "One API call. v1 saved reports. This is the power move nobody teaches."
6. Click preset: **Time Entry Detail** → Send
7. Show the response — real punch data
8. "Every request is proxied through our backend. Credentials never touch the browser."
9. Show the **History** panel — all calls logged

### Act 6: Settings & Roadmap (1 minute)
1. Click **⚙️ Settings**
2. Walk through Capabilities matrix: active vs planned
3. Point out: "AI Supervisor, ETL Pipeline, Alert Notifications — that's the roadmap"
4. Show Webhook Configuration section
5. Security checklist: encrypted at rest, server-side proxy, bcrypt, activity logging

### Act 7: The Business (5 minutes)
- Pull up hcmnotify.com → pitch deck
- Slide through the 13-slide deck
- Key numbers: 5,000+ UKG Ready clients, $500-3000/mo per tenant
- "This was built in less than a week. By an AI and a guy who scripts PowerShell."

### Closing
> "The question isn't whether this works — you just saw it pull live data from UKG. The question is: do you want to sell it?"

---

### If Asked:
- **"How long to MVP?"** → 8-12 weeks with real client deployments
- **"What's the tech stack?"** → Node.js, React, SQLite (upgrading to Azure SQL for production), TypeScript throughout
- **"What about competition?"** → Nobody does this for UKG Ready specifically. The big players focus on UKG Pro (different API entirely).
- **"What's the AI part?"** → Auto-remediation of known failure patterns. Chuck has 15+ years of UKG integration patterns codified. The AI learns from every resolution.
