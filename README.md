# 🎀 Playful Girl

A tiny web-games arcade — 2D browser games with leaderboards and player accounts.
Designed by Sonia Rashnavaz 💖

## Run locally

```bash
npm install        # only needed for the smoke test (jsdom)
node server.mjs    # → http://localhost:4801
npm test           # headless smoke test of all games
```

## Deploy (Render)

No build step. Web Service settings:

| Setting      | Value                          |
|--------------|--------------------------------|
| Runtime      | Node                           |
| Build command| `npm install`                  |
| Start command| `node server.mjs`              |

The server uses the platform-provided `PORT` automatically.

**Note:** on free hosting the filesystem is temporary — global stats and
account records reset whenever the service redeploys or reboots. The game
itself always works.
