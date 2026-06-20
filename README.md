# Nook — a real-time 1:1 chat app (starter project)

A working foundation for a WhatsApp-style chat app: secure login, real-time
1:1 text messaging, and message history. Built so you can read every file
and understand exactly what it does — then extend it.

## Stack

| Layer       | Choice                              | Why |
|-------------|--------------------------------------|-----|
| Frontend    | React + Vite                         | Fast dev server, simple config, easy to later port to React Native |
| Backend     | Node.js + Express                    | One language across your whole app |
| Real-time   | Socket.io                            | Handles reconnects/fallbacks for you |
| Database    | SQLite via Prisma                    | Zero setup locally; swap one line for Postgres in production |
| Auth        | JWT + bcrypt                         | Industry-standard for this kind of app |

## Project structure

```
chat-app/
  backend/
    prisma/schema.prisma   # User and Message tables
    src/
      server.js            # Express + Socket.io entry point
      routes/               # REST endpoints (auth, users, messages)
      socket/               # Real-time message handling
      middleware/            # JWT auth check, rate limiting
      utils/validators.js
  frontend/
    src/
      pages/                # Login, Register, Chat
      components/           # UserList, MessageBubble, SecurityBadge
      context/AuthContext.jsx
      api/                  # axios + socket.io client setup
```

## Setup

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and replace `JWT_SECRET` with a real random value:

```bash
openssl rand -base64 48
```

Then create the database and start the server:

```bash
npx prisma migrate dev --name init
npm run dev
```

The API runs at `http://localhost:4000`.

**2. Frontend**

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`, register two accounts (e.g. in two browser
windows, or one normal + one incognito), and message between them in real
time.

## How the security actually works

- **Passwords are never stored.** `bcrypt.hash()` turns each password into
  a one-way hash (`backend/src/routes/auth.routes.js`). Even with full
  database access, no one can recover the original password.
- **Login responses don't leak which emails exist.** A wrong email and a
  wrong password return the identical error message, which stops an
  attacker from using your login form to discover registered users.
- **Rate limiting** (`middleware/rateLimiter.js`) caps login/register
  attempts at 10 per 15 minutes per IP, slowing brute-force guessing.
- **JWTs gate every protected route and every socket connection.**
  `middleware/auth.js` checks REST requests; `socket/index.js` checks
  WebSocket connections the same way before letting a client join.
- **Security headers** are set automatically by `helmet()`, and `cors()`
  restricts which origin can even talk to your API.
- **Prisma's parameterized queries** prevent SQL injection by construction
  — there's no string concatenation of user input into queries anywhere
  in this codebase.

### What this build does *not* include yet

- **HTTPS/TLS isn't configured in the code.** Locally that's fine — both
  apps run on `localhost`. When you deploy, get TLS for free by deploying
  behind a host that terminates it for you (Render, Railway, Fly.io,
  Vercel) or via a reverse proxy like Nginx with Let's Encrypt. Don't try
  to hand-roll certificate handling in the Node app itself.
- **End-to-end message encryption.** Right now, messages are encrypted
  *in transit* (once you add HTTPS/WSS) but readable by the server and
  stored as plain text in the database. True E2E encryption (what
  WhatsApp actually does) means the server only ever sees ciphertext —
  that's a separate, meaningfully harder project built on something like
  the Signal Protocol. Worth tackling once this version feels solid.
- **Refresh tokens.** The JWT is long-lived (7 days) for simplicity. A
  production app would use a short-lived access token plus a refresh
  token so a stolen token expires fast.
- **`localStorage` for the JWT** is simple but vulnerable to XSS (any
  injected script can read it). An `httpOnly` cookie is more resistant to
  this — a good next hardening step once you're comfortable with the
  current flow.

## Suggested next steps

1. Get this running locally and send messages between two accounts.
2. Read `socket/index.js` and `Chat.jsx` together — that's the heart of
   the real-time flow, and the part most worth understanding deeply.
3. Add group chats (a `Conversation` model with many participants instead
   of just `senderId`/`receiverId`).
4. Add image/file sending.
5. Move the JWT to an `httpOnly` cookie.
6. Tackle E2E encryption as its own focused project.
