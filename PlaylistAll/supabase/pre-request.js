// Get current time and expiry
const now = Date.now();
const expiresAt = parseInt(pm.environment.get("expires_at")) || 0;
const bufferMs = 5 * 60 * 1000; // 5-minute buffer before expiry

// If token is missing, expired, or near expiry, refresh
if (!pm.environment.get("access_token") || now >= expiresAt - bufferMs) {
  const refreshToken = pm.environment.get("refresh_token");

  if (!refreshToken) {
    console.log("No refresh token - cannot refresh. Run login first.");
    return; // Abort or handle as needed
  }

  // Send refresh request
  const refreshUrl = `${pm.environment.get("supabaseURL")}/auth/v1/token`;

  pm.sendRequest(
    {
      url: refreshUrl,
      method: "POST",
      header: {
        apikey: pm.environment.get("supabaseAPIKey"), // Your env var for anon key
        "Content-Type": "application/json",
      },
      body: {
        mode: "raw",
        raw: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      },
    },
    function (err, response) {
      if (err) {
        console.log("Refresh error:", err);
        return;
      }

      const jsonData = response.json();
      if (jsonData.access_token && jsonData.refresh_token) {
        // Update tokens and expiry
        pm.environment.set("access_token", jsonData.access_token);
        pm.environment.set("refresh_token", jsonData.refresh_token);
        pm.environment.set(
          "expires_at",
          Date.now() + jsonData.expires_in * 1000
        );

        console.log(
          "Token refreshed! New expiry:",
          new Date(pm.environment.get("expires_at"))
        );
      } else {
        console.log("Refresh failed - invalid response");
        // Optionally clear tokens: pm.environment.unset("access_token"); etc.
      }
    }
  );

  // Wait for refresh to complete (Postman handles async, but requests proceed after)
} else {
  console.log("Token still valid - no refresh needed.");
}
