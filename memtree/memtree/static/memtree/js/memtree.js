
function confirmLogout() {
    $.confirm({
        title: '',
        content: `Are you sure you want to log out?`,
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
                            window.console.error(error);
                            $.alert({
                                title: '',
                                content: error,
                            });
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
        title: `ATTENTION!`,
        content: `You are one step away from deleting your account!<br>All your notes will be deleted and this action cannot be undone!<br>Are you sure?`,
        type: 'red',
        theme: 'dark',
        animation: 'none',
        buttons: {
            Delete: {
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
                            window.console.error(error);
                            $.alert({
                                title: '',
                                content: error,
                            });
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
