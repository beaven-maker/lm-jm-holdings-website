# LM AND JM HOLDINGS (PTY) LTD Website

A responsive company website with a server-side AI assistant endpoint and an enquiry form endpoint.

## Run locally

Requires Node.js 18 or newer.

```bash
npm start
```

Open http://localhost:3000.

## Deploy on Render

1. In Render, choose **New + → Web Service**.
2. Connect the GitHub repository `beaven-maker/lm-jm-holdings-website`.
3. Runtime: **Node**.
4. Build command: `npm install` (there are no external dependencies).
5. Start command: `npm start`.
6. Deploy.

## Environment variables (Render → Environment)

- `OPENAI_API_KEY`: secret API key for the AI assistant. Keep it in Render, never in browser code or GitHub.
- `OPENAI_MODEL`: optional model name; defaults to `gpt-4.1-mini`.
- `RESEND_API_KEY`: optional Resend API key for enquiry delivery.
- `CONTACT_EMAIL`: destination inbox for enquiries.
- `RESEND_FROM_EMAIL`: optional verified sender address for Resend.

The AI assistant responds only when `OPENAI_API_KEY` is configured. The enquiry form sends email only when both `RESEND_API_KEY` and `CONTACT_EMAIL` are configured. Until configured, the website displays a clear message directing visitors to the company's published phone and email contacts.

## Company facts

Company content is based on the supplied company profile details. No unverified certifications, client endorsements, years of experience, registrations, prices or guarantees are claimed.
