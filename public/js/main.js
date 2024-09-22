window.onload = async () => {
    try {
        const response = await fetch('/user-info');
        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }

        const userInfo = await response.json();

        sessionStorage.setItem('userFullName', userInfo.full_name);
        sessionStorage.setItem('userLogin', userInfo.login);
        sessionStorage.setItem('userIconFileName', userInfo.icon_file_name);

        document.getElementById('user-fullname').textContent = userInfo.full_name;
        document.getElementById('user-login').textContent = userInfo.login;
        document.dispatchEvent(new Event('userInfoLoaded'));
    } catch (error) {
        console.error('[ERROR] Error loading user info:', error);
    }
};