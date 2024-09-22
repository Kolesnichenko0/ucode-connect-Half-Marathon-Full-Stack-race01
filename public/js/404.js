window.onload = () => {
    if (!sessionStorage.getItem('userIconFileName')) {
        document.dispatchEvent(new Event('userInfoNotFound'));
    }
};