(() => {
  const form = document.querySelector("#requestForm");
  if (!form) return;
  const pages = form.querySelector("#pages");
  const pageCount = form.querySelector("#pageCount");
  const quoteRange = form.querySelector("#quoteRange");
  const status = form.querySelector("#requestStatus");
  const needsDomain = form.querySelector("#needsDomain");
  const domainPanel = form.querySelector("#domainPanel");

  const selections = () => [...form.querySelectorAll("#features input:checked")].map((input) => input.value);
  // Quiet Few 2026 fair-market rate card.
  // Custom studio pricing: below conventional US agency pricing, while preserving
  // enough budget for discovery, bespoke UI/UX, engineering, QA, launch, and revisions.
  const RATE_CARD = {
    "Website": {
      base: 1800, includedScreens: 3, extraScreen: 250, uncertainty: 1.25,
      features: { "Payments": 750, "Booking": 650, "Memberships": 950, "AI assistant": 1800, "E-commerce": 1800, "Admin portal": 1200 }
    },
    "Web app": {
      base: 9500, includedScreens: 3, extraScreen: 450, uncertainty: 1.35,
      features: { "Payments": 1500, "Booking": 1300, "Memberships": 2200, "AI assistant": 3500, "E-commerce": 3500, "Admin portal": 2800 }
    },
    "Mobile app": {
      base: 12500, includedScreens: 3, extraScreen: 500, uncertainty: 1.35,
      features: { "Payments": 1700, "Booking": 1500, "Memberships": 2500, "AI assistant": 4000, "E-commerce": 4000, "Admin portal": 3200 }
    }
  };
  const roundTo50 = (amount) => Math.round(amount / 50) * 50;

  function updateQuote() {
    const kind = form.querySelector('input[name="kind"]:checked').value;
    const selected = selections();
    const rate = RATE_CARD[kind];
    let subtotal = rate.base + Math.max(0, Number(pages.value) - rate.includedScreens) * rate.extraScreen;
    subtotal += selected.reduce((sum, feature) => sum + (rate.features[feature] || 0), 0);

    // E-commerce and memberships already include much of the payment setup.
    // Avoid charging the customer twice for overlapping implementation work.
    if (selected.includes("Payments") && selected.includes("E-commerce")) subtotal -= rate.features.Payments * 0.65;
    if (selected.includes("Payments") && selected.includes("Memberships")) subtotal -= rate.features.Payments * 0.35;
    if (needsDomain.checked) subtotal += 150;

    const low = roundTo50(subtotal);
    const high = roundTo50(subtotal * rate.uncertainty);
    pageCount.value = pages.value;
    quoteRange.textContent = "$" + low.toLocaleString() + " – $" + high.toLocaleString();
    return { low, high, currency: "USD", pricingVersion: "2026.08" };
  }
  form.addEventListener("input", updateQuote);
  needsDomain.addEventListener("change", () => { domainPanel.hidden = !needsDomain.checked; updateQuote(); });
  updateQuote();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector(".submit-build");
    button.disabled = true;
    status.className = "form-status";
    status.textContent = "Sending your private request…";
    const data = Object.fromEntries(new FormData(form));
    data.features = selections();
    data.quote = updateQuote();
    data.needsDomain = needsDomain.checked;
    data.source = location.href;
    try {
      const response = await fetch("/api/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "The request could not be sent.");
      status.className = "form-status success";
      status.textContent = "Request received. The Quiet Few Collective will contact you within one business day.";
      form.reset(); needsDomain.dispatchEvent(new Event("change")); updateQuote();
    } catch (error) {
      status.className = "form-status error";
      status.textContent = error.message || "The request could not be sent. Please email itsleftybro@thequietfewcollective.com.";
    } finally { button.disabled = false; }
  });
})();