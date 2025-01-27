/* jshint esversion: 6 */
/*globals csrftoken:false */
/*globals $:false */
let CHECKED_ITEMS_IDS = Array();
let SELECTED_ITEM_ID = null;
let WEBSOCKET_RECONNECT_TIMEOUT = 1; // sec
let EDIT_MODE = false;

function connect() {
    "use strict";
    let ws_proto = 'ws://';
    if (window.location.protocol === 'https:') {
        ws_proto = 'wss://';
    }
    const socket = new WebSocket(`${ws_proto}${window.location.host}/ws/`);

    socket.onopen = function () {
        document.getElementById('body').classList.remove('disabled');
        apiList(null);
    };

    socket.onclose = function (event) {
        document.getElementById('body').classList.add('disabled');
        $('.item').addClass('disabled');
        window.console.log(
            `WebSocket is closed. Reconnect will be attempted in ${WEBSOCKET_RECONNECT_TIMEOUT} second.`,
            event.reason
        );
        setTimeout(function() {
            connect();
        }, WEBSOCKET_RECONNECT_TIMEOUT * 1000);
    };

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.signal === 'deleted') {
            const item = document.getElementById(data.id);
            if (item) {
                item.remove();
            }
        } else {
            createOrUpdate(data);
        }
    };

    socket.onerror = function (error) {
        socket.close();
    };
}

function removeChecked() {
    "use strict";
    if (CHECKED_ITEMS_IDS.length > 0) {
        $.confirm({
            title: '',
            content: `Delete all selected (${CHECKED_ITEMS_IDS.length}) elements?`,
            animation: 'none',
            type: 'red',
            theme: 'dark',
            buttons: {
                Yes: {
                    btnClass: 'btn-red',
                    action: function () {
                        apiBulkDelete();
                        CHECKED_ITEMS_IDS = Array();
                        buttonsUpdate();
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
}

function removeChildren() {
    "use strict";
    if (CHECKED_ITEMS_IDS.length > 0) {
        $.confirm({
            title: '',
            content: `Delete all children from selected (${CHECKED_ITEMS_IDS.length}) elements?`,
            animation: 'none',
            type: 'red',
            theme: 'dark',
            buttons: {
                Yes: {
                    btnClass: 'btn-red',
                    action: function () {
                        for (const item_id of CHECKED_ITEMS_IDS) {
                            apiDeleteChildren(item_id);
                        }
                        CHECKED_ITEMS_IDS = Array();
                        buttonsUpdate();
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
}

function setAttributes(element, attrs) {
    "use strict";
    for (const key in attrs) {
        if (attrs.hasOwnProperty(key)) {
            element.setAttribute(key, attrs[key]);
        }
    }
}

function autoResize(text) {
    "use strict";
    text.style.height = "0px";
    text.style.width = "0px";
    if (text.cols > 40 || text.rows > 20) {
        text.style.fontSize = '12px';
    } else {
        text.style.fontSize = null;
    }
    text.style.height = text.scrollHeight + 2 + "px";
    text.style.width = text.scrollWidth + 10 + "px";
}

function add() {
    "use strict";
    $.confirm({
        title: '',
        content: '<textarea type="text" autocomplete="off" placeholder="Enter text" class="newtext form-control"/>',
        animation: 'none',
        type: 'green',
        theme: 'dark',
        buttons: {
            formSubmit: {
                text: 'Create',
                btnClass: 'btn-green',
                action: function () {
                    var text = this.$content.find('.newtext').val();
                    apiCreate(text);
                }
            },
            cancel: function () {
                // pass
            },
        },
        onContentReady: function () {
            window.requestAnimationFrame(() => this.$content.find('.newtext').focus())
        }
    });
}

function moveChecked() {
    "use strict";
    if (CHECKED_ITEMS_IDS.length > 0) {
        apiBulkMove();
        CHECKED_ITEMS_IDS = Array();
        buttonsUpdate();
    }
}

function moveChildren() {
    "use strict";
    if (CHECKED_ITEMS_IDS.length > 0) {
        for (const item_id of CHECKED_ITEMS_IDS) {
            apiMoveChildren({'id': item_id});
        }
        CHECKED_ITEMS_IDS = Array();
        buttonsUpdate();
    }
}

function selection(item_id) {
    "use strict";
    if (!EDIT_MODE) {
        if (SELECTED_ITEM_ID === item_id) {
            SELECTED_ITEM_ID = null;
            CHECKED_ITEMS_IDS.push(item_id);
        } else if (CHECKED_ITEMS_IDS.includes(item_id)) {
            CHECKED_ITEMS_IDS = CHECKED_ITEMS_IDS.filter(val => val !== item_id);
        } else {
            SELECTED_ITEM_ID = item_id;
        }
        buttonsUpdate();
    }
}

function clearSelection() {
    "use strict";
    SELECTED_ITEM_ID = null;
    CHECKED_ITEMS_IDS = Array();
    buttonsUpdate();
}

function buttonsUpdate() {
    "use strict";
    if (EDIT_MODE) {
        document.getElementById('footer').style.display = 'none';
    } else {
        document.getElementById('footer').style.display = 'block';
        let add_move_button = document.getElementById("add_move_button");
        let action_button = document.getElementById("action_button");
        let checked_counter = document.getElementById('checked_counter');
        add_move_button.disabled = false;
        if (CHECKED_ITEMS_IDS.length > 0) {
            action_button.hidden = false;
            checked_counter.innerHTML = CHECKED_ITEMS_IDS.length;
        } else {
            action_button.hidden = true;
            checked_counter.innerHTML = '';
        }
    }
    bordersUpdate();
}

function bordersUpdate() {
    "use strict";
    for (const item of document.getElementsByClassName('item')) {
        if (EDIT_MODE) {
            item.text.readOnly = false;
            item.ul.className = null;
            item.text.style.border = "1px solid rgba(0, 100, 200, 0.5)";
        } else {
            item.text.readOnly = true;
            if (item.id === SELECTED_ITEM_ID) {
                item.text.style.border = "1px solid rgba(155, 255, 155, 0.5)";
                item.ul.className = null;
            } else if (CHECKED_ITEMS_IDS.includes(item.id)) {
                item.text.style.border = "1px solid rgba(255, 211, 0, 0.7)";
                item.ul.className = "disabled";
            } else {
                item.text.style.border = "1px solid rgba(0, 0, 0, 0.8)";
                item.ul.className = null;
            }
        }
    }
}

function createOrUpdate(data) {
    "use strict";
    var item = document.getElementById(data.id);
    if (!item) {
        item = document.createElement('li');
        setAttributes(item, {
            "class": "item",
            "id": data.id,
        });

        item.caret = document.createElement('span');
        item.caret.innerHTML = '>';
        item.caret.className = 'caret';
        item.caret.style.display = 'none';
        item.caret.addEventListener("click", function() {
            apiUpdate({
                'id': this.parentNode.id,
                'collapsed': !this.collapsed
            });
        });

        item.text = document.createElement('textarea');
        setAttributes(item.text, {
            "type": "text",
            "autocomplete": "off",
            "class": "text",
            "name": `text_${data.id}`, // что бы браузер не орал
            "placeholder": "null",
            "wrap": "off",
            "readonly": true,
            "oninput": "autoResize(this)",
            "onchange": "apiUpdate({'id': this.parentNode.id, 'text': this.value})",
            "onclick": "selection(this.parentNode.id)",
        });

        item.ul = document.createElement('ul');

        item.counter = document.createElement('sup');
        item.counter.setAttribute('class', 'counter');

        item.appendChild(item.caret);
        item.appendChild(item.text);
        item.appendChild(item.counter);
        item.appendChild(item.ul);
    }
    item.parent = data.parent;
    item._children = data.children;
    item.children_count = data.children_count;
    appendToParent(item);
    item.caret.collapsed = data.collapsed;

    const created = new Date(data.created).toLocaleString();
    var modified = new Date(data.modified).toLocaleString();
    if (created === modified) {
        modified = '-';
    }

    item.text.setAttribute('data-bs-toggle', 'tooltip');
    item.text.setAttribute('data-bs-placement', 'top');
    item.text.setAttribute('title',
        `id: ${data.id}\n` +
        `path: ${data.path}\n` +
        `created: ${created}\n` +
        `modified: ${modified}\n` +
        `length: ${data.length}\n` +
        `rows: ${data.rows}\n` +
        `cols: ${data.cols}\n` +
        `alphabet: ${data.alphabet}`
    );
    item.text.value = data.text;
    item.text.cols = data.cols;
    item.text.rows = data.rows;
    autoResize(item.text);

    if (item.children_count > 0) {
        item.text.style.color = "rgba(190,130,70,0.9)";
        item.caret.style.display = 'inline-block';
        item.counter.innerHTML = item.children_count;
        if (item.caret.collapsed) {
            item.caret.style.transform = 'rotate(0deg)';
            item.ul.innerHTML = '';
        } else {
            item.caret.style.transform = 'rotate(90deg)';
            apiList(item.id);
        }
    } else {
        item.text.style.color = "rgba(255,255,255,0.8)";
        item.caret.style.display = 'none';
        item.counter.innerHTML = '';
    }

    item.classList.remove('disabled');
    return item;
}

function appendToParent(item) {
    "use strict";
    if (item.parent) {
        var parent = document.getElementById(item.parent);
        if (parent) {
            if (parent.ul != item.parentNode) {
                parent.ul.appendChild(item);
            }
        } else {
            item.remove();
        }
    } else {
        parent = document.getElementById("root_ul");
        if (parent != item.parentNode) {
            parent.appendChild(item);
        }
    }
}

function search() {
    "use strict";
    const search_value = document.getElementById('search_input').value;
    const search_counter = document.getElementById('search_counter');
    var marked_items = [];
    if (search_value) {
        fetch(`api/items/?search=${search_value}`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error(response.statusText);
                }
            })
            .then(data => {
                search_counter.innerHTML = data.length;
                for (const item_data of data) {
                    for (const item_id of item_data.path_list) {
                        const item = document.getElementById(item_id);
                        if (item) {
                            item.text.style.background = 'rgba(155, 255, 155, 0.1)';
                            marked_items.push(item_id);
                        } else {
                            break;
                        }
                    }
                }
                for (const item of document.getElementsByClassName('item')) {
                    if (!marked_items.includes(item.id)) {
                        item.text.style.background = 'transparent';
                    }
                }
            })
            .catch(error => {
                errorAlert(error);
            });
    } else {
        search_counter.innerHTML = '';
        for (const item of document.getElementsByClassName('item')) {
            item.text.style.background = 'transparent';
        }
    }
}

function apiRetrieve(item_id) {
    "use strict";
    fetch(`api/items/${item_id}/`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(response.statusText);
            }
        })
        .then(data => {
            createOrUpdate(data);
            buttonsUpdate();
            search();
        })
        .catch(error => {
            errorAlert(error);
        });
}

function apiList(parent_id) {
    "use strict";
    fetch(`api/items/?parent=${parent_id}`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(response.statusText);
            }
        })
        .then(data => {
            for (const item_data of data) {
                createOrUpdate(item_data);
            }
            buttonsUpdate();
            search();
        })
        .catch(error => {
            errorAlert(error);
        });
}

function apiCreate(text) {
    "use strict";
    fetch(`api/items/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                'parent': SELECTED_ITEM_ID,
                'text': text
            })
    })
        .then(response => {
            if (response.ok) {
                search();
            } else {
                throw new Error(response.statusText);
            }
        })
        .catch(error => {
            errorAlert(error);
        });
}

function apiUpdate(item_data) {
    "use strict";
    fetch(`api/items/${item_data.id}/`, {
        method: 'PUT',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(item_data)
    })
        .then(response => {
            if (response.ok) {
                if ('text' in item_data) {
                    search();
                }
            } else {
                throw new Error(response.statusText);
            }
        })
        .catch(error => {
            errorAlert(error);
        });
}

function apiDelete(item_id) {
    "use strict";
    fetch(`api/items/${item_id}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
        })
        .catch(error => {
            errorAlert(error);
        });
}

function apiBulkDelete() {
    "use strict";
    fetch(`api/items/bulk-delete/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({'items_ids': CHECKED_ITEMS_IDS})
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
        })
        .catch(error => {
            errorAlert(error);
        });
}

function apiDeleteChildren(item_id) {
    "use strict";
    fetch(`api/items/${item_id}/delete-children/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
        })
        .catch(error => {
            errorAlert(error);
        });
}

function apiBulkMove() {
    "use strict";
    fetch(`api/items/bulk-move/`, {
        method: 'PUT',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'parent': SELECTED_ITEM_ID,
            'items_ids': CHECKED_ITEMS_IDS})
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
        })
        .catch(error => {
            errorAlert(error);
        });
}

function apiMoveChildren(item_data) {
    "use strict";
    fetch(`api/items/${item_data.id}/move-children/`, {
        method: 'PUT',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({'parent': SELECTED_ITEM_ID})
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
        })
        .catch(error => {
            errorAlert(error);
        });
}

function editMode(state) {
    EDIT_MODE = state;
    buttonsUpdate();
}