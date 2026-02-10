document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const form = document.getElementById("resetPasswordForm");
    const banner = document.getElementById("messageBanner");

    // If no token is present in the URL, block the form and show error
    if (!token) {
        showBanner("Invalid or missing reset token.", "error");
        if (form) form.style.display = "none";
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById("newPassword").value;

        try {
            const response = await fetch("/api/auth/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                showBanner("Password updated successfully! Redirecting to login...", "success");
                // Redirect back to login page after 3 seconds
                setTimeout(() => window.location.href = "/views/auth.html", 3000);
            } else {
                showBanner(data.error || "Failed to reset password.", "error");
            }
        } catch (err) {
            showBanner("Something went wrong. Please try again.", "error");
            console.error("Reset Error:", err);
        }
    });

    function showBanner(text, type) {
        banner.textContent = text;
        banner.className = `banner ${type}`;
        banner.classList.remove("hidden");
        banner.style.display = "flex"; // Ensure it is visible
    }
});