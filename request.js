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
  function updateQuote() {
    const kind = form.querySelector('input[name="kind"]:checked').value;
    const base = kind === "Website" ? 2400 : kind === "Web app" ? 7200 : 9800;
    const total = base + Math.max(0, Number(pages.value) - 3) * 325 + selections().length * 850 + (needsDomain.checked ? 250 : 0);
    pageCount.value = pages.value;
    quoteRange.textContent = "$" + total.toLocaleString() + " – $" + Math.round(total * 1.45).toLocaleString();
    return { low: total, high: Math.round(total * 1.45) };
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