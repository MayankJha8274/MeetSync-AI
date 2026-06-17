# MeetSync AI — Smart Video Conferencing with AI Attendance

A full-stack video conferencing platform with **AI-powered face recognition attendance**, **real-time transcription**, **AI meeting summaries**, and **interactive collaboration tools**. Built with React, Node.js, WebRTC, and TensorFlow.js.

<p align="center">
  <img src="https://img.shields.io/badge/react-18.2.0-61DAFB" alt="React">
  <img src="https://img.shields.io/badge/node-18%2B-green" alt="Node">
  <img src="https://img.shields.io/badge/express-4.18.2-lightgrey" alt="Express">
  <img src="https://img.shields.io/badge/mongodb-mongoose-47A248" alt="MongoDB">
  <img src="https://img.shields.io/badge/license-ISC-blue" alt="License">
</p>

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [API Endpoints](#api-endpoints)
- [Socket Events](#socket-events)
- [Database Models](#database-models)
- [Scripts Reference](#scripts-reference)
- [Troubleshooting](#troubleshooting)

---

## Features

### Core Video Conferencing
- **Real-time Video Calls** — WebRTC peer-to-peer with Google STUN
- **Audio/Video Controls** — Mute/unmute, camera on/off
- **Screen Sharing** — Full-screen sharing with remote visibility
- **In-Meeting Chat** — Real-time messaging during calls
- **Multi-Participant** — Group video calls with dynamic grid layout

### AI-Powered Attendance
- **Face Recognition** — TensorFlow.js face-api for detection and verification
- **Automated Tracking** — Every 10 seconds, face compared against enrolled descriptor
- **Live Dashboard** — Meeting owner sees real-time attendance status
- **Detailed Reports** — Present (≥75%), Partial (50–74%), Absent (<50%)
- **Attendance Analytics** — Charts, trends, and per-meeting breakdowns

### Transcription & AI Summaries
- **Live Speech-to-Text** — Web Speech API (Chrome/Edge) with Transformers.js fallback
- **Multi-Language Support** — English (India/US), Hindi, Spanish, French, German, and more
- **Server-Side Merge** — All participants' transcript entries merged on server
- **AI Summary** — GPT-powered or keyword-extracted executive summaries
- **Auto-Summary on End** — Meeting owner gets instant AI summary when leaving
- **Action Items** — Automatically extracted tasks from meeting discussion

### Collaboration Tools
- **Polls & Voting** — Create polls, vote, see live results
- **Decisions Log** — Record key decisions during the meeting
- **Emoji Reactions** — Float-up emojis during calls
- **Hand Raise** — Visual indicator for all participants
- **Waiting Room** — Host approval for late joiners
- **Participant List** — See who's in the meeting

### User Management
- **Authentication** — Secure login/register with bcrypt hashing
- **Meeting History** — View past meetings with dates
- **Guest Join** — No sign-in required for participants
- **Meeting Owner** — First user becomes owner with special controls

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI Framework |
| Material-UI | 5.18.0 | Component Library |
| Socket.io-client | 4.7.3 | Real-time Communication |
| @vladmandic/face-api | 1.7.15 | Face Detection & Recognition |
| @xenova/transformers | 2.17.2 | AI Transcription Fallback |
| TensorFlow.js | 4.22.0 | ML Runtime |
| React Router | 6.21.1 | Client-side Routing |
| Recharts | 3.8.1 | Analytics Charts |
| Axios | 1.6.5 | HTTP Client |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.18.2 | HTTP Server Framework |
| Socket.io | 4.7.3 | WebSocket Server |
| MongoDB | — | Database |
| Mongoose | 8.0.3 | ODM |
| Bcrypt | 5.1.1 | Password Hashing |
| OpenAI | — | AI Summary Generation |

### WebRTC

| Component | Purpose |
|-----------|---------|
| RTCPeerConnection | Peer-to-peer media streaming |
| getUserMedia / getDisplayMedia | Camera, mic & screen capture |
| Google STUN | NAT traversal |

---

## System Architecture

```
                    ┌──────────────────────────────────────────┐
                    │            CLIENT (React SPA)            │
                    │                                          │
                    │  ┌──────────┐ ┌────────┐ ┌──────────┐   │
                    │  │ Video    │ │ Chat   │ │ Face     │   │
                    │  │ Streams  │ │ Panel  │ │ Recog.   │   │
                    │  └────┬─────┘ └───┬────┘ └─────┬────┘   │
                    │       │           │            │        │
                    │  ┌────┴───────────┴────────────┴────┐   │
                    │  │         Socket.io Client          │   │
                    │  └────────────────┬──────────────────┘   │
                    └───────────────────┼──────────────────────┘
                                        │ WebSocket
                    ┌───────────────────┼──────────────────────┐
                    │    SERVER (Node.js + Express)             │
                    │                   │                       │
                    │  ┌──────────────┐ │ ┌──────────────────┐  │
                    │  │  REST API    │ │ │  Socket.io       │  │
                    │  │  (Express)   │ │ │  Events          │  │
                    │  └──────┬───────┘ │ └────────┬─────────┘  │
                    │         │         │          │            │
                    │         └─────────┼──────────┘            │
                    │                   │                       │
                    │           ┌───────┴───────┐               │
                    │           │    Mongoose   │               │
                    │           └───────┬───────┘               │
                    └───────────────────┼───────────────────────┘
                                        │
                              ┌─────────┴─────────┐
                              │     MongoDB        │
                              │     (Atlas)        │
                              └───────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone
```bash
git clone <repository-url>
cd MeetSync-AI
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=8000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/meetsync
OPENAI_API_KEY=sk-...        # Optional — for AI summaries
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

### 4. Start

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```

Or use the auto-starter from root:
```bash
node start-all.js
```

### 5. Access
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Health Check:** http://localhost:8000/api/health

---

## Project Structure

```
MeetSync-AI/
├── backend/
│   ├── src/
│   │   ├── app.js                    # Express + Socket.io server entry
│   │   ├── controllers/
│   │   │   ├── socketManager.js      # All real-time event handling
│   │   │   └── user.controller.js    # Auth logic (login/register)
│   │   ├── models/
│   │   │   ├── user.model.js         # User accounts
│   │   │   ├── face.model.js         # Face descriptors (128D)
│   │   │   ├── meeting.model.js      # Meeting history
│   │   │   ├── attendance.model.js   # Attendance reports
│   │   │   ├── actionItem.model.js   # AI-extracted action items
│   │   │   └── transcript.model.js   # Meeting transcripts + summaries
│   │   └── routes/
│   │       ├── users.routes.js       # Auth endpoints
│   │       ├── attendance.routes.js  # Attendance + transcript endpoints
│   │       └── actionItem.routes.js  # Action item CRUD
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── _redirects               # SPA redirect (Netlify/Render)
│   │   └── favicon.ico / manifest.json / robots.txt
│   ├── src/
│   │   ├── App.js                    # Router with all routes
│   │   ├── environment.js            # Backend URL config
│   │   ├── App.css                   # Global styles
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx       # Auth provider (login/register/history)
│   │   ├── pages/
│   │   │   ├── landing.jsx           # Public landing page
│   │   │   ├── authentication.jsx    # Login / Register
│   │   │   ├── home.jsx              # Dashboard — create/join meetings
│   │   │   ├── VideoMeet.jsx         # The full meeting room (~2200 lines)
│   │   │   ├── history.jsx           # Past meetings list
│   │   │   ├── AttendanceHistory.jsx # Attendance report viewer
│   │   │   ├── AttendanceAnalytics.jsx # Analytics dashboard with charts
│   │   │   └── GuestJoin.jsx         # Public join page (no auth)
│   │   ├── styles/
│   │   │   └── videoComponent.module.css # Full meeting UI styles
│   │   └── utils/
│   │       └── withAuth.jsx          # Auth guard HOC
│   ├── package.json
│   └── .env
│
├── start-all.js                      # Cross-platform auto-starter
├── package.json
├── README.md
└── .gitignore
```

---

## How It Works

### 1. Meeting Flow
```
Landing → Join as Guest or Register/Login → Dashboard → Create/Join Meeting
```

### 2. Video Call Flow
```
1. User navigates to meeting URL (e.g., /abc123)
2. Camera/mic permissions obtained via getUserMedia
3. Socket.io connection established to server
4. WebRTC peer connections created with all participants
5. Video/audio streams exchanged via STUN
```

### 3. Face Recognition Attendance
```
1. User joins meeting → face enrollment modal appears
2. Face detected via TinyFaceDetector → 128D descriptor extracted
3. Descriptor saved to MongoDB
4. Every 10 seconds:
   - Face detection runs on local video
   - Detected face compared with enrolled (euclidean distance)
   - Match >60% confidence → verifiedTime += 10s
5. Meeting ends → attendance report generated with % per participant
```

### 4. Live Transcription & AI Summary
```
1. User clicks "Start" in Transcript tab → Web Speech API activates
2. Each speech result → emitted via socket to server
3. Server stores all entries, relays to other participants
4. Meeting ends (or manual trigger):
   - Server merges entries from all participants
   - GPT generates structured summary (or keyword fallback)
   - Summary emitted to all participants + saved to MongoDB
   - Action items auto-extracted and saved
```

### 5. Attendance Calculation
```javascript
verifiedPercent = (verifiedTime / totalTime) × 100

Status:
• Present    → verifiedPercent >= 75%
• Partial    → verifiedPercent >= 50% && < 75%
• Absent     → verifiedPercent < 50%
```

---

## API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/users/register` | Create new user |
| POST | `/api/v1/users/login` | Authenticate user |
| POST | `/api/v1/users/add_to_activity` | Log meeting to history |
| GET | `/api/v1/users/get_all_activity` | Get user's meeting history |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/attendance/owner/:userId` | Reports where user is meeting owner |
| GET | `/api/v1/attendance/meeting/:meetingId` | Single meeting report |
| GET | `/api/v1/attendance/user/:userId` | Reports where user is participant |
| GET | `/api/v1/attendance/transcript/:meetingId` | Saved transcript for a meeting |

### Action Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/action-items/meeting/:meetingId` | Get action items for meeting |
| PATCH | `/api/v1/action-items/:id/toggle` | Toggle item status (pending/completed) |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

---

## Socket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join-call` | `(path, userId, userName, isOwner)` | Join a meeting room |
| `signal` | `(toId, message)` | WebRTC SDP/ICE signaling |
| `chat-message` | `(data, sender)` | Send chat message |
| `register-face` | `{meetingId, userId, descriptor}` | Enroll face descriptor |
| `verified-update` | `{meetingId, userId, userName, verifiedDelta}` | Attendance heartbeat |
| `end-meeting` | `{meetingId}` | End meeting → attendance + auto-summary |
| `transcript-entry` | `{meetingId, text, speaker, lang, timestamp}` | Live speech result |
| `generate-summary` | `{meetingId, transcriptEntries}` | Manually trigger AI summary |
| `create-poll` | `{meetingId, question, options}` | Create a poll |
| `vote-poll` | `{meetingId, pollId, optionIndex}` | Vote on a poll |
| `add-decision` | `{meetingId, text, proposedBy}` | Log a decision |
| `send-reaction` | `{meetingId, emoji, from}` | Send emoji reaction |
| `raise-hand` | `{meetingId, userId, userName, raised}` | Raise/lower hand |
| `screen-share-started` | `{meetingId}` | Notify screen sharing started |
| `screen-share-stopped` | `{meetingId}` | Notify screen sharing stopped |
| `get-action-items` | `{meetingId}` | Fetch action items |
| `toggle-action-item` | `{id, meetingId}` | Toggle action item status |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `user-joined` | `(socketId, allSocketIds)` | New participant arrived |
| `user-left` | `(socketId)` | Participant left |
| `signal` | `(fromId, message)` | WebRTC signal relayed |
| `you-are-owner` | — | You are the meeting owner |
| `waiting-for-approval` | — | Waiting for host to approve |
| `join-request` | `{socketId, userId, userName}` | Host receives join request |
| `join-rejected` | `{message}` | Host rejected your request |
| `chat-message` | `(data, sender, socketId)` | New chat message |
| `live-attendance` | `{participants}` | Real-time attendance update |
| `attendance-report` | `{report}` | Final attendance report |
| `owner-attendance-report` | `{report}` | Owner's detailed report |
| `transcript-entry` | `{text, speaker, lang, timestamp}` | Live transcript entry |
| `summary-generated` | `{executiveSummary, keyDiscussionPoints, ...}` | AI summary ready |
| `poll-created` | `{poll}` | New poll available |
| `poll-updated` | `{poll}` | Poll results updated |
| `decision-added` | `{decision}` | New decision recorded |
| `reaction-received` | `{emoji, from, id}` | Emoji reaction from user |
| `hand-raise-update` | `{users}` | Hand raise state changed |
| `participant-list` | `{participants}` | Updated participant list |
| `screen-share-started` | `{socketId}` | Remote user started sharing |
| `screen-share-stopped` | `{socketId}` | Remote user stopped sharing |
| `action-items-list` | `{items}` | Action items for meeting |
| `action-item-updated` | `{item}` | Action item status changed |

---

## Database Models

### User
```javascript
{
  name: String,        // Display name
  username: String,    // Unique login ID
  password: String,    // Bcrypt hashed
  token: String        // Session auth token
}
```

### Face
```javascript
{
  userId: String,      // Username
  meetingId: String,   // Meeting room code
  descriptor: [Number] // 128-dimensional face vector
}
```

### Meeting
```javascript
{
  user_id: String,
  meetingCode: String,
  meetingOwner: String,
  date: Date
}
```

### Attendance
```javascript
{
  meetingId: String,
  meetingOwner: String,
  participants: [{
    userId: String,
    name: String,
    totalTime: Number,       // Seconds in meeting
    verifiedTime: Number,    // Seconds face-verified
    verifiedPercent: Number, // Verified % (0–100)
    status: String           // "Present" | "Partial" | "Absent"
  }],
  startTime: Date,
  endTime: Date,
  date: Date
}
```

### Action Item
```javascript
{
  meetingId: String,
  meetingOwner: String,
  task: String,               // Description
  assignedTo: String,
  dueDate: Date,
  status: String,             // "pending" | "completed"
  createdAt: Date
}
```

### Transcript
```javascript
{
  meetingId: String,        // Unique, indexed
  entries: [{
    text: String,           // Speech text
    speaker: String,        // Who said it
    lang: String,           // Language code (e.g. "en-IN")
    timestamp: Number       // Unix ms
  }],
  summary: {
    executiveSummary: String,
    keyDiscussionPoints: [String],
    decisionsTaken: [String],
    actionItems: [String],
    risks: [String],
    nextSteps: [String]
  },
  createdAt: Date
}
```

---

## Scripts Reference

### Backend (`backend/`)
| Script | Command | Description |
|--------|---------|-------------|
| dev | `npm run dev` | Start with nodemon hot-reload |
| start | `npm start` | Production start |
| build | `npm run build` | Build frontend from backend |
| kill-port | `npm run kill-port` | Kill process on port 8000 |
| restart | `npm run restart` | Kill port + start dev |

### Frontend (`frontend/`)
| Script | Command | Description |
|--------|---------|-------------|
| start | `npm start` | Development server on :3000 |
| build | `npm run build` | Production build |
| test | `npm test` | Run test suite |

### Root
| Command | Description |
|---------|-------------|
| `node start-all.js` | Auto-start both backend + frontend |

---

## Troubleshooting

### Port Already in Use
```bash
cd backend && npm run kill-port
```

### Camera/Microphone Not Working
- Check browser permissions for camera/mic access
- Production requires HTTPS (WebRTC security)
- Try a different browser (Chrome/Edge recommended)

### Face Recognition Not Loading
- Check console for model loading errors
- CDN: `https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/`
- Wait for "All models loaded!" message in console

### WebRTC Connection Fails
- Check STUN server connectivity (Google STUN)
- Ensure both users have camera enabled
- Check firewall / corporate network restrictions

### MongoDB Connection Fails
- Verify `MONGO_URI` in `backend/.env`
- Check network connectivity to MongoDB Atlas
- Ensure IP is whitelisted in Atlas

### Socket Connection Refused
- Ensure backend is running on port 8000
- Check `frontend/src/environment.js` has correct backend URL
- Verify CORS configuration (check `backend/src/app.js`)

### Speech Recognition Not Working
- Web Speech API requires **HTTPS** (local `localhost` works)
- Firefox is not supported — use Chrome or Edge
- Falls back to Transformers.js or manual entry

---

## Acknowledgments

- [face-api.js](https://github.com/vladmandic/face-api) — Face recognition library
- [Socket.io](https://socket.io/) — Real-time bidirectional communication
- [Material-UI](https://mui.com/) — React UI component library
- [WebRTC](https://webrtc.org/) — Real-time peer-to-peer media
- [@xenova/transformers](https://github.com/xenova/transformers.js) — In-browser ML transcription
- [Recharts](https://recharts.org/) — Composable charting library

---

<p align="center">
  Made with ❤️ for smarter meetings
</p>
