# NOVA Academy: publish the adult demonstration on Render

This is a **working, password-protected adult demo**, not a production service for children. It provides the full local curriculum/dashboards and a voice-ready classroom. Real conversation requires an OpenAI API key and adequate credit/access. There are no real students, consent records, or production-grade authentication.

## Do this once

1. **Rotate your exposed API key** at https://platform.openai.com/api-keys. Never put the new key in a ZIP, GitHub, HTML, ChatGPT message, or public code.
2. Create an account on **GitHub** (https://github.com) and make a **private repository** named `nova-academy-demo`. Use GitHub's **Add file → Upload files** to upload everything from inside the unzipped `NOVA_Online_Deploy` folder, including `render.yaml`. `render.yaml` must be in the repository root. Do not upload `.env` files containing real credentials. You can also upload the unzipped folder using GitHub Desktop, but do not commit actual secrets.
3. Create a **Render** account (https://dashboard.render.com). Choose **New → Blueprint** and connect the GitHub repo. Render reads the included `render.yaml`. Choose the Free plan, if available. If Blueprint does not show Free, choose **New → Web Service** instead, connect the repo, use build command `npm install --omit=dev` and start command `npm start`, and set `HOST=0.0.0.0` in Environment.
4. When prompted for secret environment values, set `OPENAI_API_KEY` to your **new rotated** key and `DEMO_ACCESS_PASSWORD` to a long random password. The **login username is `demo`**. Do not share the password publicly. Do not use the previous exposed key.
5. Click deploy. Once Render reports Live, open `https://YOUR-APP.onrender.com/live-classroom.html` in Chrome/Edge. Enter the username and password, choose **Live AI voice**, confirm the adult-only prompt, click **Connect voice**, and enable the microphone only if you want to talk. The front-end must be on HTTPS for browser microphone permission.

Your homepage is `https://YOUR-APP.onrender.com/`. It links to **Talk to NOVA**; the classroom has **Dashboard** to return. There is no fixed public URL until you deploy to your own account.

## What works

- Standalone dashboards, 128-entry curriculum catalog, seven local creative studios and sample lesson sequences.
- Live-classroom page with voice-ready OpenAI Realtime WebRTC client, ephemeral sessions provided by the server, slide-changing tools, and teacher controls.
- Password gate around every page and the session-token API; main API key stays server-side.
- Health endpoint `/healthz` (contains no secrets).
- On browsers, the microphone starts off and must be enabled explicitly. AI voice does not run in silent Guided mode.

## What does not work or remains unverified

- No API calls were made using your previously exposed key. Live voice requires configuration and an end-to-end test **after** you deploy. The code path is implemented, but live OpenAI connectivity was not verified with a key.
- Class 1–8 curriculum entries are lesson outlines except for the sample lessons; this is not 128 fully authored lessons.
- No real child users, voice, permissions, or personal data. The platform cannot be launched for children without a child safety/privacy and provider-eligibility review.
- Public visitors should not be given the demo password without your approval. Basic auth is for private sales demos, not a substitute for a full user login system.

## Pricing caution

Render's free instance spins down after 15 minutes without traffic and can take around a minute to wake. OpenAI API voice calls have separate usage charges. Use your project's budget settings in the OpenAI dashboard. Do not publish a password-free voice endpoint.

## Fixes if something does not work

- Render error **No open ports detected**: Ensure `HOST=0.0.0.0`, `startCommand: npm start`, and Node 20+.
- Login prompt: username `demo`, password `DEMO_ACCESS_PASSWORD` from Render Environment.
- **503 OPENAI_API_KEY not configured**: add the new key under Render Environment → Add Environment Variable, save and deploy.
- **Realtime denied**: check API project access, API billing, model availability, and Render service logs. Select the exact model enabled in your account with `OPENAI_REALTIME_MODEL`.
- **Mic access denied**: open Render HTTPS URL in Chrome/Edge, then allow microphone permissions. Desktop Chrome/Edge recommended.
- Don't use the standalone HTML file when testing live voice. It has no backend.

Official docs: https://render.com/docs/blueprint-spec and https://developers.openai.com/api/docs/guides/voice-webrtc
