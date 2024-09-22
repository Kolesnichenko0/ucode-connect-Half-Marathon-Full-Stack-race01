document.querySelector('#recoverByLoginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const login = document.getElementById('login').value;

    const loginRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!loginRegex.test(login)) {
        showError('Invalid login', '3-20 characters, letters, numbers, underscores only.');
        return;
    }

    fetch('/recover-password-by-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({login: login})
    })
        .then(response => {
            if (response.ok) {
                response.json().then(data => {
                    showSuccess(`Login and password sent to ${data.email}`);
                });
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

function showError(message, details) {
    const successDiv = document.getElementById('success');
    successDiv.style.display = 'none';

    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = `<strong>${message}</strong>`;

    if (details) {
        const detailsDiv = document.createElement('div');
        detailsDiv.innerText = details;
        detailsDiv.style.fontSize = '0.8em';
        errorDiv.appendChild(detailsDiv);
    }

    errorDiv.style.display = 'block';
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.style.display = 'none';

    const successDiv = document.getElementById('success');
    successDiv.innerHTML = `<strong>${message}</strong>`;
    successDiv.style.display = 'block';
}