/**
 * API base URL per environment.
 */
(function () {
  const hostname = window.location.hostname;
  if (!hostname) {
    window.API_BASE_URL = "http://localhost:3000";
  } else {
    // Production: set your real API URL, or use same-origin relative path
    window.API_BASE_URL =
      "https://your-api-id.execute-api.region.amazonaws.com";
  }
})();
