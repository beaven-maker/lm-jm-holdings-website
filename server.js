const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "public");
const COMPANY_CONTEXT = `LM AND JM HOLDINGS (PTY) LTD is a South African company focused on cleaning, hygiene, safety, workplace health and wellness services, and the supply of bakery and confectionery essentials. Its stated service areas include cleaning, hygiene, safety, workplace health/wellness support, and bakery and confectionery essentials supply. The company serves private, public, corporate, health, institutional, construction/civil, and rehabilitation-facility sectors. The company profile describes it as 100% black-owned and emphasizes customer satisfaction, job creation, employee development, integrity, compliance, and service excellence.
Address: No 3713 Martin Mabit sela, Far East Bank, Alexandra, 2090, Johannesburg, Gauteng, South Africa.
Phone: 081337 0020 / 0816545504.
Email: lmjmholdings78@gmail.com.
Directors: Nthabiseng L Manana (50%) and Jerrison M Mpandawana (50%).
Do not invent certifications, client names, testimonials, years of operation, registrations, prices, or guarantees. If asked for information not listed here, say the team can confirm it directly.`;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, { ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY), enquiryConfigured: Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL) });
  }

  if (req.method === "POST" && url.pathname === "/api/chat") {
    if (!process.env.OPENAI_API_KEY) {
      return send(res, 503, { error: "The AI assistant is not configured yet. Please contact the team by phone or email." });
    }
    try {
      const body = await readBody(req);
      const question = String(body.message || "").trim().slice(0, 2000);
      if (!question) return send(res, 400, { error: "Please enter a question." });

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          instructions: `You are the website information assistant for LM AND JM HOLDINGS (PTY) LTD. Answer clearly, politely and briefly using only these verified company facts: ${COMPANY_CONTEXT} Do not invent missing details. If a visitor asks for a quote, request their name, organisation, contact details, location and service needed, and direct them to the contact form or company phone/email. You are not a substitute for professional safety, health, legal or compliance advice.`,
          input: question,
          max_output_tokens: 350
        })
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("OpenAI API error:", data.error?.message || response.status);
        return send(res, 502, { error: "The assistant is temporarily unavailable. Please contact the team directly." });
      }
      const answer = (data.output || [])
        .flatMap(item => item.content || [])
        .filter(item => item.type === "output_text")
        .map(item => item.text)
        .join("\n")
        .trim();
      return send(res, 200, { answer: answer || "Please contact our team directly so we can assist you." });
    } catch (error) {
      console.error(error);
      return send(res, 500, { error: "Something went wrong. Please try again." });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/enquiry") {
    if (!process.env.RESEND_API_KEY || !process.env.CONTACT_EMAIL) {
      return send(res, 503, { error: "The online enquiry service is not configured yet. Please email lmjmholdings78@gmail.com or call 081337 0020." });
    }
    try {
      const body = await readBody(req);
      const name = String(body.name || "").trim().slice(0, 120);
      const email = String(body.email || "").trim().slice(0, 160);
      const phone = String(body.phone || "").trim().slice(0, 60);
      const organisation = String(body.organisation || "").trim().slice(0, 160);
      const service = String(body.service || "").trim().slice(0, 120);
      const location = String(body.location || "").trim().slice(0, 160);
      const message = String(body.message || "").trim().slice(0, 3000);
      if (!name || !phone || !message) return send(res, 400, { error: "Please provide your name, phone number and enquiry." });

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "Website Enquiries <onboarding@resend.dev>",
          to: [process.env.CONTACT_EMAIL],
          subject: `Website enquiry: ${service || "General"} — ${name}`,
          text: `Name: ${name}\nOrganisation: ${organisation}\nEmail: ${email}\nPhone: ${phone}\nService: ${service}\nLocation: ${location}\n\nMessage:\n${message}`
        })
      });
      if (!emailResponse.ok) {
        console.error("Resend error:", await emailResponse.text());
        return send(res, 502, { error: "We could not send your enquiry just now. Please email or call us directly." });
      }
      return send(res, 200, { ok: true, message: "Thank you. Your enquiry has been sent to our team." });
    } catch (error) {
      console.error(error);
      return send(res, 500, { error: "Something went wrong. Please try again or contact us directly." });
    }
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 404, { error: "Not found" });
  }

  const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(ROOT, requested));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end("Forbidden");
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Page not found");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
});

server.listen(PORT, () => console.log(`LM & JM Holdings website running on port ${PORT}`));
