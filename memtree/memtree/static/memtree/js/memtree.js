
function confirmLogout() {
    $.confirm({
        title: `Logout?`,
        content: `Are you sure?`,
        theme: 'dark',
        animation: 'none',
        buttons: {
            Yes: {
                btnClass: 'btn-red',
                action: function () {
                    fetch(`logout/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrftoken,
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(response.statusText);
                            }
                            document.location.href = '/';
                        })
                        .catch(error => {
                            window.console.error('There was a problem with your fetch operation:', error);
                        });
                }
            },

            Cancel: {
                btnClass: 'btn-info',
                action: function () {

                }
            }
        }
    });
}

function confirmDeleteAccount() {
    $.confirm({
        title: `Delete the account?`,
        content: `All your notes will be deleted and this action cannot be undone!`,
        type: 'red',
        theme: 'dark',
        animation: 'none',
        buttons: {
            Yes: {
                btnClass: 'btn-red',
                action: function () {
                    fetch(`delete-account/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrftoken,
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(response.statusText);
                            }
                            document.location.href = '/';
                        })
                        .catch(error => {
                            window.console.error('There was a problem with your fetch operation:', error);
                        });
                }
            },
            Cancel: {
                btnClass: 'btn-info',
                action: function () {

                }
            }
        }
    });
}
