const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function errorAlert(error) {
    window.console.error(error);
    $.confirm({
        title: 'Error',
        content: error,
        theme: 'dark',
        animation: 'none',
        buttons: {
            Ok: {
                btnClass: 'btn-info',
                action: function () {
                    // pass
                }
            }
        }
    });
}

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
                    fetch(`/logout/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrftoken,
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => {
                        if (!response.ok) {
                            return response.text().then(errorMessage => {
                                throw new Error(errorMessage);
                            })
                        }
                        document.location.href = '/';
                    })
                    .catch(error => {
                        errorAlert(error);
                    });
                }
            },

            Cancel: {
                btnClass: 'btn-info',
                action: function () {
                    // pass
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
                    fetch(`/delete-account/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrftoken,
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => {
                        if (!response.ok) {
                            return response.text().then(errorMessage => {
                                throw new Error(errorMessage);
                            })
                        }
                        document.location.href = '/';
                    })
                    .catch(error => {
                        errorAlert(error);
                    });
                }
            },
            Cancel: {
                btnClass: 'btn-info',
                action: function () {
                    // pass
                }
            }
        }
    });
}

function triggerFileInput() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        fetch('/api/items/import-data/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrftoken
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(errorMessage => {
                    throw new Error(errorMessage);
                })
            }
        })
        .catch(error => {
            errorAlert(error);
        });
    });

    fileInput.click();
}