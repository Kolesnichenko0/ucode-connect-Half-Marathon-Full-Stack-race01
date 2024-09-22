function updateUserIcon() {
    try {
        const userIconElement = document.getElementById('user-icon');
        const userIconFileName = sessionStorage.getItem('userIconFileName');
        userIconElement.src = userIconFileName ? `/images/user_icons/${userIconFileName}` : '/images/user_icons/default_icon.png';
        userIconElement.alt = `${sessionStorage.getItem('userFullName')} Logo`;

        if (userIconFileName) {
            userIconElement.addEventListener('click', async () => {
                try {
                    const response = await fetch('/change-icon', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Failed to change avatar');
                    }

                    const result = await response.json();

                    if (result.icon_file_name) {
                        userIconElement.src = `/images/user_icons/${result.icon_file_name}`;
                        sessionStorage.setItem('userIconFileName', result.icon_file_name);  // Update session storage
                        console.log('[INFO] Avatar changed successfully');
                    } else {
                        console.error('[ERROR] Failed to change avatar');
                    }
                } catch (error) {
                    console.error('[ERROR] Error changing avatar:', error);
                }
            });
        }
    } catch (error) {
        console.error('[ERROR] Error loading user info:', error);
    }
}

function handleUserInfoNotFound() {
    console.error('[ERROR] User info not found (404)');
    // Handle the 404 error scenario here, e.g., show a default icon or a message
    const userIconElement = document.getElementById('user-icon');
    userIconElement.src = '/images/user_icons/default_icon.png';
    userIconElement.alt = 'Default User Icon';
}

// Check if userIconFileName is already in sessionStorage
if (sessionStorage.getItem('userIconFileName')) {
    updateUserIcon();
} else {
    document.addEventListener('userInfoLoaded', updateUserIcon);
    document.addEventListener('userInfoNotFound', handleUserInfoNotFound);
}