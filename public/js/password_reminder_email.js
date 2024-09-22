document.querySelector('#forgotPasswordForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('email').value;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
        showError('Invalid email');
        return;
    }

    fetch('/recover-password-by-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({email: email})
    })
        .then(response => {
            if (response.ok) {
                showSuccess('Login and password sent! Check your email.');
            } else {
                response.json().then(data => {
                    showError(data.error);
                });
            }
        })
        .catch(() => {
            showError('Something went wrong!');
        });
});

function showError(message) {
    const successDiv = document.getElementById('success');
    successDiv.style.display = 'none';

    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = `<strong>${message}</strong>`;
    errorDiv.style.display = 'block';
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';

    const successDiv = document.getElementById('success');
    successDiv.innerHTML = `<strong>${message}</strong>`;
    successDiv.style.display = 'block';
}
