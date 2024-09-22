document.querySelector('#registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const login = document.querySelector('#login').value;
    const password = document.querySelector('#password').value;
    const confirmPassword = document.querySelector('#confirmPassword').value;
    const email = document.querySelector('#email').value;
    const fullName = document.querySelector('#fullName').value;

    const loginRegex = /^[a-zA-Z0-9_]{3,20}$/;

    if (!loginRegex.test(login)) {
        showError('Invalid login', '3-20 characters, letters, numbers, underscores only.');
        return;
    }

    const fullNameRegex = /^[a-zA-Z\s]{2,}$/;

    if (!fullNameRegex.test(fullName)) {
        showError('Invalid full name', '2-100 characters, start/end with a letter, letters and spaces only.');
        return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
        showError('Invalid email');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/;

    if (!passwordRegex.test(password)) {
        showError('Invalid password', '8-20 characters, at least one lowercase, uppercase, digit, special character.');
        return;
    }

    const formData = new FormData(this);
    formData.delete('confirmPassword');

    fetch('/register-process', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData))
    })
        .then(response => {
            if (response.status === 201) {
                showSuccess('User registered successfully!');
                clearForm();
                setTimeout(() => {
                    window.location.href = '/main'; // Redirect to the main page after 2 seconds
                }, 2000);
            } else {
                return response.json().then(data => {
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
    successDiv.innerText = message;
    successDiv.style.display = 'block';
}

function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    const passwordIcon = document.getElementById(inputId + 'Icon');
    const typeAttribute = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', typeAttribute);
    passwordIcon.classList.toggle('fa-eye');
    passwordIcon.classList.toggle('fa-eye-slash');
}

function clearForm() {
    document.querySelector('#login').value = '';
    document.querySelector('#password').value = '';
    document.querySelector('#confirmPassword').value = '';
    document.querySelector('#email').value = '';
    document.querySelector('#fullName').value = '';
}