# MeetSync AI

MeetSync AI is a full-stack video-meeting application built with React, Express, Socket.IO, WebRTC, MongoDB, and browser-based AI features.

The application combines:

- Peer-to-peer audio and video meetings
- Meeting chat, polls, decisions, reactions, and hand raises
- Waiting-room admission and meeting ownership
- Face-enrollment and face-verification attendance
- Browser-local live transcription shared with all meeting participants
- AI meeting summaries, action items, and thread memory
- Meeting history, attendance reports, transcript retrieval, and analytics

This README describes the implementation that exists in this repository. It intentionally calls out browser and provider limitations instead of promising functionality that the current architecture cannot guarantee.

---

## Contents

1. [Architecture at a glance](#architecture-at-a-glance)
2. [Feature overview](#feature-overview)
3. [Technology stack](#technology-stack)
4. [Repository structure](#repository-structure)
5. [How a meeting works](#how-a-meeting-works)
6. [Transcription design](#transcription-design)
7. [Attendance design](#attendance-design)
8. [Frontend routes](#frontend-routes)
9. [Backend REST API](#backend-rest-api)
10. [Socket.IO events](#socketio-events)
11. [Data models](#data-models)
12. [Requirements](#requirements)
13. [Environment configuration](#environment-configuration)
14. [Local development](#local-development)
15. [Testing and builds](#testing-and-builds)
16. [Production deployment](#production-deployment)
17. [Troubleshooting](#troubleshooting)
18. [Known limitations and security notes](#known-limitations-and-security-notes)

---

## Architecture at a glance

```text
                         Browser
             React SPA + WebRTC + Socket.IO client
                    /         |         \
                   /          |          \
        REST API requests   signaling   room events
                 |             |             |
                 +-------------+-------------+
                               |
                 Express + Socket.IO backend
                    |             |          \
                    |             |           \
                REST routes    room state    AI services
                    |             |             |
                    +-------------+-------------+
                                  |
                          MongoDB via Mongoose
```

### Frontend

The React application in `frontend/` handles:

- Routing and authentication state
- Camera and microphone permission requests
- WebRTC peer connections and media controls
- Socket.IO room communication
- Face detection and face enrollment in the browser
- Browser-local transcription and its local fallback
- Meeting, attendance, history, analytics, summary, and collaboration UI

The main meeting implementation is [`frontend/src/pages/VideoMeet.jsx`](frontend/src/pages/VideoMeet.jsx).

### Backend

The Express application in `backend/` handles:

- User and meeting-history REST endpoints
- Attendance and transcript retrieval
- Action-item and thread-memory retrieval
- Socket.IO room admission and waiting-room approval
- WebRTC signaling relay
- Room-scoped chat and collaboration events
- Transcript validation, deduplication, broadcast, replay, and persistence
- Meeting-end attendance reports and summary generation

The server entrypoint is [`backend/src/app.js`](backend/src/app.js). Socket behavior is concentrated in [`backend/src/controllers/socketManager.js`](backend/src/controllers/socketManager.js).

### MongoDB

MongoDB stores users, meeting history, attendance reports, face descriptors, transcripts, action items, and thread memory. In-memory Socket.IO state is used while a meeting is active; completed records are persisted when the relevant meeting actions occur.

---

## Feature overview

### Video meetings

- WebRTC peer-to-peer audio/video
- Multi-participant room layout
- Camera and microphone controls
- Screen sharing
- Socket.IO signaling for SDP and ICE candidates
- Automatic peer cleanup when participants leave

The backend relays signaling messages; media is intended to flow directly between browsers.

### Meeting admission

- The first participant becomes the meeting owner.
- The owner can approve or reject waiting participants.
- Valid meeting-link participants are admitted by the current server flow.
- Participant lists are broadcast to the room.
- Late joiners receive relevant chat and transcript history.

### Collaboration

Meetings support:

- Chat messages with in-memory room history
- Poll creation and voting
- Decision recording
- Emoji reactions
- Hand raising
- Participant list updates
- Screen-share state notifications

### Attendance

The owner can enroll a face from the browser camera. During the meeting, the browser periodically compares the current face descriptor with the enrolled descriptor and reports verified time to the server.

Attendance status is calculated from verified percentage:

- `Present`: at least 75%
- `Partial`: 50% through 74%
- `Absent`: below 50%

Attendance data is stored in MongoDB and is available through REST routes and analytics pages.

### Transcription and summaries

- Transcription starts automatically for an admitted participant when the meeting client has microphone access.
- Chrome/Edge Web Speech recognition is the primary browser engine.
- A local Transformers.js/Whisper fallback is attempted when the primary engine fails.
- Manual transcript entry remains available when browser recognition or the local model cannot be used.
- Each client sends text entries to the server through Socket.IO.
- The server validates, deduplicates, stores, broadcasts, and replays entries to the whole room, including the sender.
- Meeting summaries use the merged room transcript.
- Summaries can produce discussion points, decisions, action items, risks, and next steps.

Important: the current implementation does **not** send raw microphone audio to the backend for centralized transcription. Speech recognition is performed in each participant's browser.

---

## Technology stack

### Frontend

- React 18
- React Router 6
- Socket.IO client
- WebRTC browser APIs
- Material UI and Emotion
- `@vladmandic/face-api` for face detection and descriptors
- TensorFlow.js runtime packages
- `@xenova/transformers` for local speech fallback
- Recharts for analytics
- Axios for REST requests

### Backend

- Node.js with ES modules
- Express 4
- Socket.IO 4
- Mongoose 8
- MongoDB
- bcrypt for password hashing
- OpenAI SDK for optional AI summaries
- Jest and Supertest for tests

### Browser APIs

- `getUserMedia` for camera and microphone
- `getDisplayMedia` for screen sharing
- `RTCPeerConnection` for media transport
- Web Speech API when available
- `MediaRecorder` and `AudioContext` for the local transcription fallback

Exact dependency versions are maintained in [`frontend/package.json`](frontend/package.json) and [`backend/package.json`](backend/package.json).

---

## Repository structure

```text
MeetSync-AI/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── controllers/
│   │   │   ├── socketManager.js
│   │   │   └── user.controller.js
│   │   ├── models/
│   │   ├── routes/
│   │   └── __tests__/
│   ├── package.json
│   └── jest.config.mjs
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── contexts/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── utils/
│   └── package.json
├── start-all.js
├── package.json
└── README.md
```

Generated directories such as `frontend/build`, dependency directories, and runtime uploads are not source code and should not be committed as application logic.

---

## How a meeting works

### 1. Application entry and routing

[`frontend/src/App.js`](frontend/src/App.js) wraps the application in `BrowserRouter` and `AuthProvider`. It exposes public pages, authenticated pages, the guest join flow, and the dynamic meeting route.

### 2. Media preparation

`VideoMeet.jsx` requests camera and microphone access before connecting to Socket.IO. The local stream is attached to the local video element and added to new peer connections.

If full camera/microphone access fails, the client attempts a video-only stream. Meeting access is not intended to depend on face recognition or transcription succeeding.

### 3. Socket connection and room admission

The client connects to the backend Socket.IO server and registers room listeners before emitting `join-call`. This ordering matters because the server can immediately replay room history.

The backend:

1. Creates or finds the meeting room.
2. Assigns the first owner.
3. Places waiting participants in the waiting room when approval is required.
4. Adds admitted participants to the Socket.IO room.
5. Broadcasts participant state.
6. Replays available chat and transcript history to the joining socket.

### 4. WebRTC negotiation

When a participant joins, clients create peer connections for other sockets. The client sends SDP offers/answers and ICE candidates through the backend `signal` event. The backend forwards those messages to the addressed socket.

The backend does not mix or store the media stream.

### 5. Meeting activity

Chat, polls, decisions, reactions, hand raises, screen-share state, attendance updates, and transcript entries use room-scoped Socket.IO events.

### 6. Meeting end

The owner can end the meeting. The backend calculates and persists attendance, generates or extracts a summary from transcript content, persists meeting history, and emits reports/summary events to the relevant clients.

---

## Transcription design

### Client lifecycle

For each admitted participant:

1. The client starts transcription automatically when the participant is in the room.
2. Web Speech recognition is attempted when the browser exposes `SpeechRecognition` or `webkitSpeechRecognition`.
3. Final recognized text is attributed to the participant's display name.
4. The local UI displays the entry and emits `transcript-entry`.
5. If Web Speech ends unexpectedly, the failed instance is detached and is not placed into a restart loop.
6. The Transformers.js/Whisper fallback may record local audio chunks and emit recognized text.
7. If local engines fail, the user can add an entry manually.

### Server lifecycle

The server accepts a transcript entry only when:

- The meeting ID is present.
- The socket belongs to the requested meeting room.
- Text is a non-empty string.

The server normalizes speaker, language, and timestamp values, deduplicates matching entries, stores the entry in active room state, and broadcasts it with:

```text
io.to(meetingId).emit("transcript-entry", entry)
```

This includes the sender, which allows every participant to use the same room event path. The frontend deduplicates the sender echo.

### Limitations

Browser-local recognition depends on:

- Browser support
- Secure context requirements outside localhost
- Microphone permission
- Device audio configuration
- Browser speech-service availability
- Local model download and decoding capability

For a browser-independent transcription guarantee, the architecture would need server-side audio ingestion and a centralized transcription provider or server-hosted model. That is not part of this repository's current implementation.

---

## Attendance design

Attendance has two browser/server stages:

1. **Enrollment:** the participant captures a face descriptor and sends it to the server with `register-face`.
2. **Verification:** the browser periodically compares a live frame with the enrolled descriptor and sends `verified-update`.

The owner receives live attendance updates. At meeting end, the server creates an attendance report with:

- Meeting ID and owner
- Participant IDs and names
- Total time
- Verified time
- Verified percentage
- Present/Partial/Absent status
- Start and end timestamps

Face descriptors and attendance records are MongoDB data and should be treated as sensitive information.

---

## Frontend routes

Routes are defined in [`frontend/src/App.js`](frontend/src/App.js):

| Route | Page | Purpose |
|---|---|---|
| `/` | Landing page | Public product entry page |
| `/auth` | Authentication | Login and registration |
| `/home` | Home dashboard | Create or join meetings for authenticated users |
| `/history` | History | Past meeting history |
| `/attendance-history` | Attendance history | Attendance records |
| `/attendance-analytics` | Attendance analytics | Charts and attendance analysis |
| `/join` | Guest join | Join with a meeting code or URL |
| `/:url` | Video meeting | Dynamic meeting room identified by URL segment |

The dynamic meeting route should be kept after the more specific routes because it matches arbitrary path segments.

---

## Backend REST API

The backend listens on port `8000` by default. Routes are mounted in [`backend/src/app.js`](backend/src/app.js).

### Health

```text
GET /api/health
```

Returns a simple server health response and the configured port.

### Users and meeting history

Base path: `/api/v1/users`

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/login` | Authenticate a user |
| `POST` | `/register` | Create a user account |
| `POST` | `/add_to_activity` | Add meeting activity/history |
| `GET` | `/get_all_activity` | Retrieve user meeting history |
| `GET` | `/meeting/:meetingCode` | Retrieve meeting details |

### Attendance and transcripts

Base path: `/api/v1/attendance`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/owner/:userId` | Attendance reports associated with an owner |
| `GET` | `/meeting/:meetingId` | Attendance report for one meeting |
| `GET` | `/user/:userId` | Attendance records for one participant |
| `GET` | `/transcript/:meetingId` | Persisted transcript for one meeting |

### Action items

Base path: `/api/v1/action-items`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/meeting/:meetingId` | List action items for a meeting |
| `PATCH` | `/:id/toggle` | Toggle an action item between pending and completed |

### Thread memory

Base path: `/api/v1/memory`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/thread/:meetingCode` | Retrieve matching previous-meeting context |

Responses generally use a shape containing `success`, optional `count`, and `data` or `message`.

---

## Socket.IO events

Socket events are implemented in [`backend/src/controllers/socketManager.js`](backend/src/controllers/socketManager.js) and consumed by `VideoMeet.jsx`.

### Admission and signaling

| Event | Direction | Purpose |
|---|---|---|
| `join-call` | client -> server | Request room admission |
| `you-are-owner` | server -> client | Identify the meeting owner |
| `waiting-for-approval` | server -> client | Place a participant in the waiting room |
| `join-request` | server -> owner | Notify the owner of a pending participant |
| `approve-join` | client -> server | Approve a waiting participant |
| `reject-join` | client -> server | Reject a waiting participant |
| `join-rejected` | server -> client | Notify a rejected participant |
| `user-joined` | server -> room | Broadcast room socket membership |
| `user-left` | server -> room | Notify the room of a departure |
| `participant-list` | server -> room | Broadcast participant metadata |
| `signal` | both directions | Relay SDP and ICE signaling |

### Chat and collaboration

| Event | Purpose |
|---|---|
| `chat-message` | Send and replay room chat |
| `create-poll` | Create a room poll |
| `poll-created` | Broadcast a new poll |
| `vote-poll` | Submit a vote |
| `poll-updated` | Broadcast updated poll results |
| `add-decision` | Record a meeting decision |
| `decision-added` | Broadcast a decision |
| `send-reaction` | Send an emoji reaction |
| `reaction-received` | Broadcast a reaction |
| `raise-hand` | Change hand-raise state |
| `hand-raise-update` | Broadcast raised hands |
| `screen-share-started` | Notify peers of screen sharing |
| `screen-share-stopped` | Notify peers that screen sharing ended |

### Attendance

| Event | Purpose |
|---|---|
| `register-face` | Store a participant face descriptor for a meeting |
| `face-registered` | Confirm face registration |
| `verified-update` | Report verified attendance time |
| `live-attendance` | Broadcast live attendance data |
| `end-meeting` | End a meeting as owner |
| `attendance-report` | Broadcast the final report |
| `owner-attendance-report` | Send the owner-specific report |

### Transcripts and AI

| Event | Purpose |
|---|---|
| `transcript-entry` | Validate, deduplicate, store, replay, and broadcast transcript text |
| `generate-summary` | Generate a summary from merged transcript entries |
| `summary-generated` | Broadcast the summary |
| `get-action-items` | Request meeting action items |
| `action-items-list` | Return action items |
| `toggle-action-item` | Toggle an action item |
| `action-item-updated` | Broadcast an updated action item |
| `save-thread-memory` | Persist cross-meeting context |
| `get-thread-memory` | Request prior thread memory |
| `thread-memory-result` | Return prior thread memory |
| `get-meeting-context` | Request previous meeting context |
| `meeting-context-result` | Return previous meeting context |

---

## Data models

Mongoose models are in [`backend/src/models`](backend/src/models).

| Model | Main purpose |
|---|---|
| `User` | Name, username, bcrypt password hash, session token |
| `Meeting` | Meeting history, participants, summary, dates |
| `Attendance` | Meeting attendance report and participant percentages |
| `Face` | Per-user, per-meeting face descriptor |
| `Transcript` | Unique meeting transcript entries and summary |
| `ActionItem` | Meeting task, assignee, due date, and status |
| `ThreadMemory` | Cross-meeting summaries, pending tasks, decisions, and participant sets |

The active Socket.IO room state is separate from MongoDB persistence. A process restart can therefore remove in-memory active-room state that has not yet been persisted.

---

## Requirements

- Node.js 18 or newer
- npm
- MongoDB connection string
- A modern browser for WebRTC
- HTTPS for deployed camera/microphone access
- Optional OpenAI API key for provider-backed summaries

`localhost` is treated as a valid development origin for browser media APIs. Deployed environments should use HTTPS.

---

## Environment configuration

Create `backend/.env`:

```env
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/meetsync
# Optional:
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=http://localhost:3000
```

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

### Configuration notes

- `PORT` controls the backend HTTP/Socket.IO port and defaults to `8000`.
- `MONGO_URI` is required for normal backend startup.
- `OPENAI_API_KEY` is optional. Without a usable key, the server uses its non-provider summary path where implemented.
- `FRONTEND_URL` adds an allowed frontend origin to backend CORS configuration.
- Do not commit `.env` files, API keys, MongoDB credentials, or user data.

---

## Local development

### Install dependencies

From the repository root:

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

### Start the backend

```powershell
cd backend
npm run dev
```

The backend is available at `http://localhost:8000`.

### Start the frontend

In a second terminal:

```powershell
cd frontend
npm start
```

The frontend is available at `http://localhost:3000`.

### Start both applications

From the repository root:

```powershell
node start-all.js
```

The root launcher starts the backend and frontend from their actual repository directories. It attempts to clean ports `8000` and `3000` before starting.

---

## Testing and builds

### Frontend

Run all frontend tests:

```powershell
cd frontend
npx react-scripts test --watchAll=false --runInBand
```

Build the production frontend:

```powershell
cd frontend
npm run build
```

### Backend

The repository's Windows-compatible Jest command is:

```powershell
cd backend
node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand
```

The backend `npm test` script is intended for the same Jest setup, but invoking the Node entrypoint directly is more reliable on Windows.

### Current test coverage areas

- Authentication and user routes
- Attendance and transcript routes
- Action-item routes
- Health endpoint
- Summary extraction
- Socket admission and signaling
- Chat, polls, voting, decisions, and transcript room behavior
- Frontend routing and page interactions
- Transcription lifecycle, fallback, deduplication, and UI

---

## Production deployment

The backend can serve the compiled frontend when `NODE_ENV=production`:

```powershell
cd frontend
npm run build

cd ..\backend
$env:NODE_ENV = "production"
npm start
```

The backend expects the frontend build at `frontend/build`.

For provider-neutral deployment:

1. Provision a Node.js runtime compatible with the project.
2. Provision MongoDB and set `MONGO_URI`.
3. Build the frontend.
4. Set `NODE_ENV=production`.
5. Set `FRONTEND_URL` to the deployed frontend origin.
6. Expose the backend over HTTPS.
7. Ensure WebSocket upgrade support is enabled by the reverse proxy.
8. Keep API keys and database credentials in the hosting provider's secret configuration.

For separate frontend/backend hosting, set `REACT_APP_BACKEND_URL` to the public backend URL before building the frontend and configure backend CORS accordingly.

---

## Troubleshooting

### The frontend cannot access the microphone or camera

- Use `http://localhost` for local development or HTTPS in deployed environments.
- Check browser permission settings.
- Verify that another application is not holding the camera or microphone.
- Reload after changing permissions.
- The application may fall back to video-only access when full media access fails.

### Transcription is unavailable

- Use a browser with Web Speech support for the primary path.
- Confirm microphone permission.
- Confirm the meeting page is running in a secure context outside localhost.
- Wait for the local Transformers model to load when the fallback is used.
- Use the manual transcript input if browser or model speech recognition is unavailable.

Transcription is generated locally by each participant's browser. The backend relays text entries; it does not currently transcribe a mixed meeting audio stream.

### Participants cannot connect to each other

- Confirm both browsers can reach the backend Socket.IO URL.
- Check that the backend is listening on the configured port.
- Check WebSocket upgrade support in any reverse proxy.
- Confirm that camera/microphone permissions were not permanently denied.
- Inspect browser console logs for SDP, ICE, or signaling errors.

The current WebRTC configuration uses a Google STUN server. Some restrictive networks require a TURN server for reliable peer connectivity; a TURN service is not configured in this repository.

### The backend does not start

- Verify `MONGO_URI` is set and reachable.
- Check whether port `8000` is already in use.
- Start the backend from the `backend` directory.
- Check Node.js and npm versions.
- Review the startup error before changing application code.

### A route returns 404

- Confirm the correct `/api/v1/...` prefix.
- Confirm the frontend is calling the backend URL from `REACT_APP_BACKEND_URL`.
- For client-side routes in production, ensure the server returns `frontend/build/index.html` for non-API paths.

---

## Known limitations and security notes

### Runtime limitations

- Browser-local speech recognition is not guaranteed on every browser, device, language, or network.
- The local Whisper fallback downloads and runs a relatively large model in the browser.
- WebRTC peer-to-peer connectivity may fail on networks that require TURN.
- Active meeting room state is held in server memory; horizontal scaling requires shared Socket.IO state and a coordinated persistence strategy.
- Face enrollment and verification require camera access and suitable lighting.
- AI summaries depend on transcript quality and, when configured, provider availability.

### Security and privacy

- Passwords are hashed with bcrypt before storage.
- Do not expose `.env` files or API keys.
- Face descriptors and transcripts are sensitive meeting data.
- Review and harden authentication/authorization before exposing the service publicly.
- The current CORS configuration is permissive for debugging and should be restricted to known frontend origins in production.
- Validate meeting ownership and participant authorization when adding new API or socket features.
- Use HTTPS for deployed media, authentication, and Socket.IO traffic.

---

## Useful source locations

| Area | File |
|---|---|
| React routes | `frontend/src/App.js` |
| Main meeting UI | `frontend/src/pages/VideoMeet.jsx` |
| Auth state | `frontend/src/contexts/AuthContext.jsx` |
| Backend entrypoint | `backend/src/app.js` |
| Socket and meeting state | `backend/src/controllers/socketManager.js` |
| REST routes | `backend/src/routes/` |
| MongoDB schemas | `backend/src/models/` |
| Frontend tests | `frontend/src/pages/__tests__/` |
| Backend tests | `backend/src/__tests__/` |
| Root launcher | `start-all.js` |

---

## License

The backend package declares the ISC license. Review the repository and package metadata before redistributing or deploying the project.
