# Bloom after Rain — Setup Guide

## 1. GitHub

The project lives in this folder. Push to GitHub:

```bash
cd "Bloom after rain"
git init
git add .
git commit -m "initial bloom"
git remote add origin https://github.com/YOUR_USERNAME/bloom-after-rain.git
git push -u origin main
```

---

## 2. Netlify deployment

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. Connect your GitHub account and select `bloom-after-rain`
3. Build settings:
   - **Base directory:** (leave empty)
   - **Build command:** (leave empty — no build step)
   - **Publish directory:** `.`
   - **Functions directory:** `netlify/functions` (auto-detected from netlify.toml)
4. Click **Deploy site**

You'll get a URL like `quirky-bloom-abc123.netlify.app`.

---

## 3. Environment variables

In Netlify → **Site configuration → Environment variables**, add:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | Your key from [console.anthropic.com](https://console.anthropic.com) |
| `OPENAI_API_KEY` | Your key from [platform.openai.com](https://platform.openai.com/api-keys) |

After adding, trigger a redeploy: **Deploys → Trigger deploy → Deploy site**.

---

## 4. GoDaddy subdomain → bloom.irina.love

### Step 1 — Add custom domain in Netlify

1. Netlify → your site → **Domain management → Add a domain**
2. Type `bloom.irina.love` and click **Verify**
3. Choose **Add domain** (not "transfer")
4. Note the value shown under **CNAME** (something like `quirky-bloom-abc123.netlify.app`)

### Step 2 — Add CNAME record in GoDaddy

1. Log in to [GoDaddy](https://dcc.godaddy.com)
2. Go to **My Domains → irina.love → DNS**
3. Click **Add new record**
4. Set:
   - **Type:** CNAME
   - **Name:** `bloom`
   - **Value:** `quirky-bloom-abc123.netlify.app` *(your actual Netlify URL)*
   - **TTL:** 1 hour (600)
5. Save

DNS propagation takes 5–30 minutes. Once live, `https://bloom.irina.love` will work.

### Step 3 — Enable HTTPS in Netlify

Once the CNAME is verified, go to **Domain management → HTTPS → Verify DNS configuration**. Netlify provisions a free SSL certificate automatically.

---

## 5. Flowers vocabulary

Nine flowers are supported, each matched to a type of grief and renewal:

| ID | Name | Resonance |
|----|------|-----------|
| `snowdrop` | Snowdrop | Loss of safety or certainty |
| `hyacinth` | Hyacinth | Grief after a relationship |
| `wild_violet` | Wild Violet | Honouring someone gone |
| `peony` | Peony | Loss of self or identity |
| `forget_me_not` | Forget-Me-Not | Distance, disconnection |
| `cherry_blossom` | Cherry Blossom | Any ending, beginning again |
| `night_jasmine` | Night Jasmine | Quiet private grief |
| `hellebore` | Hellebore | Long-carried grief |
| `lotus` | Lotus | Healing from illness or cancer |

To add a new flower, update `FLOWERS` in `netlify/functions/generate-bloom.js` and add it to the Claude prompt list.

---

## 6. Local development

```bash
npm install -g netlify-cli
netlify dev
```

Create a `.env` file (copy from `.env.example`) with your API keys. The site runs at `http://localhost:8888`.
