// Get DOM elements
const urlForm = document.getElementById("urlForm");
const urlInput = document.getElementById("urlInput");
const shortenBtn = document.getElementById("shortenBtn");
const result = document.getElementById("result");
const shortUrl = document.getElementById("shortUrl");
const copyBtn = document.getElementById("copyBtn");
const error = document.getElementById("error");
const loading = document.getElementById("loading");

// Handle form submission
urlForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Reset UI state
  result.classList.remove("show");
  error.classList.remove("show");
  loading.classList.add("show");
  shortenBtn.disabled = true;

  const originalUrl = urlInput.value.trim();

  // Basic URL validation
  if (!isValidUrl(originalUrl)) {
    showError("Please enter a valid URL (e.g., https://example.com)");
    return;
  }

  try {
    // TODO: Replace with actual API endpoint when backend is ready
    // For now, this is a placeholder that generates a mock shortened URL
    const shortenedUrl = await shortenUrl(originalUrl);

    // Display result
    shortUrl.href = shortenedUrl;
    shortUrl.textContent = shortenedUrl;
    result.classList.add("show");
    error.classList.remove("show");
  } catch (err) {
    showError(err.message || "Failed to shorten URL. Please try again.");
  } finally {
    loading.classList.remove("show");
    shortenBtn.disabled = false;
  }
});

// URL validation function
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

// Shorten URL function
async function shortenUrl(originalUrl) {
  const baseUrl = window.API_BASE_URL || "";
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ originalUrl }),
  });
  const data = await response.json();
  return data.shortUrl;
}

// Show error message
function showError(message) {
  error.textContent = message;
  error.classList.add("show");
  result.classList.remove("show");
}

// Copy to clipboard functionality
copyBtn.addEventListener("click", async () => {
  const urlToCopy = shortUrl.href;

  try {
    await navigator.clipboard.writeText(urlToCopy);
    copyBtn.textContent = "Copied!";
    copyBtn.classList.add("copied");

    setTimeout(() => {
      copyBtn.textContent = "Copy";
      copyBtn.classList.remove("copied");
    }, 2000);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = urlToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);

    copyBtn.textContent = "Copied!";
    copyBtn.classList.add("copied");

    setTimeout(() => {
      copyBtn.textContent = "Copy";
      copyBtn.classList.remove("copied");
    }, 2000);
  }
});
