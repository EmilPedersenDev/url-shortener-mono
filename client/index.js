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
  // TODO: Replace this with actual API call to your backend
  // Example API call:
  // const response = await fetch('/api/shorten', {
  //     method: 'POST',
  //     headers: {
  //         'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({ url: originalUrl })
  // });
  // const data = await response.json();
  // return data.shortUrl;

  // Mock implementation for now
  // This generates a simple shortened URL based on the original URL
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate a simple hash-based short code
      const shortCode = generateShortCode(originalUrl);
      const baseUrl = window.location.origin;
      resolve(`${baseUrl}/${shortCode}`);
    }, 500); // Simulate network delay
  });
}

// Generate a short code (simple hash-based approach)
function generateShortCode(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to base36 and take first 7 characters
  return Math.abs(hash).toString(36).substring(0, 7);
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
