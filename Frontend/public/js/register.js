document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // 1. Get values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // 2. Simple Validation
            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            try {
                // 3. Send Data to Backend
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Success! Redirect to login
                    alert("Account created successfully! Please sign in.");
                    window.location.href = '/auth.html'; 
                } else {
                    // Error (e.g., User already exists)
                    alert(data.message || "Registration failed. Please try again.");
                }
            } catch (error) {
                console.error('Error:', error);
                alert("Something went wrong. Is the server running?");
            }
        });
    }
});