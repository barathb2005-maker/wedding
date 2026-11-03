# Bhavya & Krishnathejes wedding site (Vercel)

- `public/index.html`   the wedding website (photos are in `public/img`)
- `public/admin.html`   private page at `/admin` (password) to read, remove, and download blessings as Excel or Word
- `api/`                server functions that save and read blessings

## Deploy
1. Put this folder on GitHub (or run `npx vercel` inside it).
2. Import the repo in Vercel. Framework preset: Other. Leave build settings empty.
3. In the Vercel project: Storage -> Marketplace -> Upstash Redis -> create a free database -> connect it to this project.
   This adds the KV_REST_API_URL and KV_REST_API_TOKEN settings by itself.
4. Settings -> Environment Variables -> add ADMIN_PASSWORD (pick a strong one). Optional: HIDE_WALL=true keeps messages private from guests.
5. Deployments -> Redeploy.

Open `/admin` on your site and enter the password.
