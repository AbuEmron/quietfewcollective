const EMAIL_TO = "itsleftybro@thequietfewcollective.com";
const SMS_TO = "+16072013131";

function clean(value, max = 3000) {
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
}
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const body = req.body || {};
  if (body.company_website) return res.status(200).json({ ok: true });
  const name = clean(body.name, 100), email = clean(body.email, 160), vision = clean(body.vision);
  if (!name || !email.includes("@") || !vision) return res.status(400).json({ error: "Please complete the required fields." });
  const requestId = crypto.randomUUID();
  const summary = [
    `New Quiet Few build request: ${requestId}`, `Name: ${name}`, `Email: ${email}`,
    `Phone: ${clean(body.phone, 40) || "Not provided"}`, `Type: ${clean(body.kind, 40)}`,
    `Pages/screens: ${clean(body.pages, 10)}`, `Features: ${(Array.isArray(body.features) ? body.features : []).map(v => clean(v, 50)).join(", ") || "None selected"}`,
    `Budget: ${clean(body.budget, 80)}`, `Timeline: ${clean(body.timeline, 80)}`,
    `Domain help: ${body.needsDomain ? "Yes — " + clean(body.domainIdea, 120) : "No"}`,
    `Planning range: $${Number(body.quote?.low || 0).toLocaleString()}–$${Number(body.quote?.high || 0).toLocaleString()}`,
    "", "Vision:", vision
  ].join("\n");
  const jobs = [];
  if (process.env.RESEND_API_KEY) jobs.push(fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.REQUEST_FROM_EMAIL || "requests@thequietfewcollective.com", to: [EMAIL_TO], reply_to: email, subject: `New ${clean(body.kind, 40)} request — ${name}`, text: summary }) }));
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
    const sms = new URLSearchParams({ To: SMS_TO, From: process.env.TWILIO_FROM_NUMBER, Body: `Quiet Few request: ${name} wants a ${clean(body.kind, 30)}. Range $${body.quote?.low || 0}–$${body.quote?.high || 0}. Check ${EMAIL_TO}.` });
    jobs.push(fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: sms }));
  }
  if (!jobs.length) return res.status(503).json({ error: "Notifications are being connected. Email itsleftybro@thequietfewcollective.com for now." });
  const results = await Promise.allSettled(jobs);
  if (results.every(r => r.status === "rejected" || !r.value.ok)) return res.status(502).json({ error: "Notification delivery failed. Please email us directly." });
  return res.status(200).json({ ok: true, requestId });
}