const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  menuToggle.textContent = open ? "×" : "☰";
});
mainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  mainNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "☰";
}));
document.getElementById("year").textContent = new Date().getFullYear();

const form = document.getElementById("enquiryForm");
const formStatus = document.getElementById("formStatus");
form.addEventListener("submit", async event => {
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  formStatus.className = "form-status";
  formStatus.textContent = "Sending your enquiry...";
  try {
    const response = await fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to send enquiry.");
    form.reset();
    formStatus.textContent = data.message;
  } catch (error) {
    formStatus.className = "form-status error";
    formStatus.textContent = error.message;
  } finally { button.disabled = false; }
});

const chatPanel = document.getElementById("chatPanel");
const chatLauncher = document.getElementById("chatLauncher");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
function setChat(open) {
  chatPanel.classList.toggle("open", open);
  chatPanel.setAttribute("aria-hidden", String(!open));
  if (open) chatInput.focus();
}
chatLauncher.addEventListener("click", () => setChat(!chatPanel.classList.contains("open")));
document.getElementById("chatClose").addEventListener("click", () => setChat(false));
function addBubble(text, type) {
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble " + type;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
document.getElementById("chatForm").addEventListener("submit", async event => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  addBubble(message, "user");
  chatInput.value = "";
  const pending = document.createElement("div");
  pending.className = "chat-bubble assistant";
  pending.textContent = "Please wait...";
  chatMessages.appendChild(pending);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  try {
    const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
    const data = await response.json();
    pending.textContent = response.ok ? data.answer : (data.error || "The assistant is unavailable.");
  } catch {
    pending.textContent = "We could not connect just now. Please contact us by phone or email.";
  }
  chatMessages.scrollTop = chatMessages.scrollHeight;
});