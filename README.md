# Ops Live HelpDesk

A modern real-time support operations dashboard built for freight and logistics teams to prevent ticket editing conflicts through collaborative WebSocket-based locking. The platform ensures that only one support agent can edit a ticket at a time while all updates, lock states, and agent activities synchronize instantly across connected clients. Designed with an enterprise-style interface, the system delivers fast, reliable, and concurrency-safe ticket management for live operational environments.

---
# Link to deployments:
- Vercel- https://live-ops-helpdesk-three.vercel.app/
- Render- https://live-ops-helpdesk-zogi.onrender.com
# Features

## Real-Time Collaborative Locking
- Instantly locks tickets when an agent starts editing
- Prevents multiple agents from editing the same ticket simultaneously
- Synchronizes lock states across all connected clients in real time

## Persistent Lock Recovery
- Stores active locks using browser localStorage
- Automatically restores locks after page refresh or reconnect
- Maintains editing ownership during temporary disconnects

## Live Agent Presence System
- Displays all currently connected support agents
- Updates instantly when agents join or disconnect
- Provides live operational visibility inside the dashboard

## Active & Resolved Ticket Separation
- Dedicated sections for active and resolved tickets
- Keeps operational workflows organized and clean
- Improves ticket tracking efficiency

## Visual Collision Indicators
- Locked tickets display lock icons and ownership labels
- Edit controls automatically disable for other agents
- Live UI feedback prevents accidental conflicts

## Automatic Lock Cleanup
- Releases locks automatically during logout or disconnect
- Prevents stale lock states after browser closure
- Maintains synchronization consistency across clients

## Connection Monitoring
- Detects socket disconnections in real time
- Displays reconnection warning banners instantly
- Improves reliability during network interruptions

## Modern Enterprise UI
- Responsive dashboard design
- Violet-indigo operations theme
- Glassmorphism-inspired interface
- Animated status badges and workflow sections

---

# Tech Stack

## Frontend
- React
- Vite
- Socket.io Client
- Vanilla CSS

## Backend
- Node.js
- Express.js
- Socket.io Server

---

# WebSocket Events

| Event | Description |
|---|---|
| `agent_joined` | Registers connected agents |
| `presence_updated` | Updates online agent list |
| `lock_ticket` | Requests exclusive ticket lock |
| `ticket_locked` | Broadcasts ticket lock state |
| `unlock_ticket` | Releases ticket lock |
| `ticket_unlocked` | Broadcasts unlock updates |
| `update_ticket` | Updates ticket information |
| `ticket_updated` | Synchronizes updated ticket data |
| `create_ticket` | Creates new support ticket |
| `ticket_created` | Broadcasts newly created ticket |

---

# Installation & Local Setup

## Clone Repository

```bash
git clone <your-repository-url>
cd live-ops-helpdesk
```

## Start Backend Server

```bash
cd server
npm install
node index.js
```

Backend runs on:

```bash
http://localhost:5000
```

## Start Frontend

```bash
cd ..
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# Testing Real-Time Collaboration

1. Open the application in two separate browser windows or incognito tabs.
2. Edit a ticket in the first window.
3. Observe instant lock synchronization in the second window.
4. Refresh the page to test persistent lock recovery.
5. Close tabs or logout to verify automatic lock cleanup.

---

