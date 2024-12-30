/* jshint esversion: 6 */
/*globals csrftoken:false */
/*globals $:false */
let CHECKED_ITEMS_IDS = Array();
let SELECTED_ITEM_ID = null;
let WEBSOCKET_RECONNECT_TIMEOUT = 2; // sec
let EDIT_MODE = false;

function wsConnect() {
    "use strict";
    let ws_proto = 'ws://';
    if (window.location.protocol === 'https:') {
        ws_proto = 'wss://';
    }
    const socket = new WebSocket(`${ws_proto}${window.location.host}/ws/`);

    socket.onopen = function () {
        let menu_button = document.getElementById('menu_button');
        if (menu_button) {
            menu_button.classList.remove('btn-outline-light');
            menu_button.classList.add('btn-outline-success');
        }
        document.getElementById('search_input').classList.remove('disabled');
        document.getElementById('edit_mode_label').classList.remove('disabled');
        document.getElementById('root_ul').classList.remove('disabled');
        document.getElementById('root_ul').innerHTML = '';
        CHECKED_ITEMS_IDS = Array();
        SELECTED_ITEM_ID = null;
        buttonsUpdate();
        apiList(null);
    };

    socket.onclose = function (event) {
        let menu_button = document.getElementById('menu_button');
        if (menu_button) {
            menu_button.classList.add('btn-outline-light');
            menu_button.classList.remove('btn-outline-success');
        }
        document.getElementById('search_input').classList.add('disabled');
        document.getElementById('edit_mode_label').classList.add('disabled');
        document.getElementById('root_ul').classList.add('disabled');
        window.console.log(
            `WebSocket is closed. Reconnect will be attempted in ${WEBSOCKET_RECONNECT_TIMEOUT} second.`,
            event.reason
        );
        setTimeout(function() {
            wsConnect();
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
        window.console.error('WebSocket error:', error.message);
        socket.close();
    };
}

function remove() {
    "use strict";
    if (CHECKED_ITEMS_IDS.length > 0) {
        $.confirm({
            title: `Delete all selected items?`,
            content: `Count: ${CHECKED_ITEMS_IDS.length}`,
            animation: 'none',
            type: 'red',
            theme: 'dark',
            buttons: {
                ok: {
                    btnClass: 'btn-red',
                    action: function () {
                        for (const item_id of CHECKED_ITEMS_IDS) {
                            apiDelete(item_id);
                        }
                        CHECKED_ITEMS_IDS = Array();
                        buttonsUpdate();
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
    let cols = 4;
    let rows = [1];
    if (text.value) {
        cols = 1;
        rows = text.value.split('\n');
        for (const row of rows) {
            if (row.length > cols) {
                cols = row.length;
            }
        }
    }
    text.setAttribute('cols', cols);
    text.setAttribute('rows', rows.length);
    fontSize(text);
}

function fontSize(text) {
    if (text.cols > 40 || text.rows > 20) {
        text.style.fontSize = '12px';
    } else {
        text.style.fontSize = null;
    }
}

function addOrMove() {
    "use strict";
    if (CHECKED_ITEMS_IDS.length > 0) {
        for (const item_id of CHECKED_ITEMS_IDS) {
            apiUpdate({
                'id': item_id,
                'parent': SELECTED_ITEM_ID
            });
        }
        CHECKED_ITEMS_IDS = Array();
        buttonsUpdate();
    } else {
        apiCreate();
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

function buttonsUpdate() {
    "use strict";
    let add_move_button = document.getElementById("add_move_button");
    let remove_button = document.getElementById("remove_button");
    if (EDIT_MODE) {
        document.getElementById('footer').style.display = 'none';
    } else {
        document.getElementById('footer').style.display = 'block';
        add_move_button.disabled = false;
        if (CHECKED_ITEMS_IDS.length > 0) {
            add_move_button.innerHTML = 'Move';
            add_move_button.className = 'btn btn-warning btn-sm';
            remove_button.disabled = false;
        } else {
            add_move_button.innerHTML = 'Add';
            add_move_button.className = 'btn btn-success btn-sm';
            remove_button.disabled = true;
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
            "class": "text",
            "name": `text_${data.id}`, // что бы браузер не орал
            "placeholder": "null",
            "rows": data.rows,
            "cols": data.cols,
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
    item.children_count = data.children_count;
    item.caret.collapsed = data.collapsed;
    item.text.setAttribute('title', `id=${data.id}\npath=${data.path}\nlength=${data.length}\nrows=${data.rows}\ncols=${data.cols}\nalphabet=${data.alphabet}`);
    item.text.value = data.text;
    autoResize(item.text);

    if (item.children_count > 0) {
        item.text.style.color = "rgba(190,130,70,0.9)";
        item.caret.style.display = 'inline-block';
        item.counter.innerHTML = item.children_count;
    } else {
        item.text.style.color = "rgba(255,255,255,0.8)";
        item.caret.style.display = 'none';
        item.counter.innerHTML = '';
    }

    if (!item.caret.collapsed && item.children_count > 0) {
        item.caret.style.transform = 'rotate(90deg)';
        apiList(item.id);
    } else {
        item.caret.style.transform = 'rotate(0deg)';
        item.ul.innerHTML = '';
    }

    appendToParent(item);

    return item;
}

function appendToParent(item) {
    "use strict";
    var parent = document.getElementById(item.parent);
    if (parent) {
        parent = parent.ul;
    } else {
        parent = document.getElementById("root_ul");
    }
    if (item.parentNode) {
        if (parent != item.parentNode) {
            parent.appendChild(item);
        }
    } else {
        parent.appendChild(item);
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
                window.console.error('There was a problem with your fetch operation:', error);
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
            search();
        })
        .catch(error => {
            window.console.error('There was a problem with your fetch operation:', error);
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
            window.console.error('There was a problem with your fetch operation:', error);
        });
}

function apiCreate() {
    "use strict";
    fetch(`api/items/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({'parent': SELECTED_ITEM_ID})
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(response.statusText);
            }
        })
        .then(data => {
            const new_item = document.getElementById(data.id);
            if (new_item) {
                new_item.text.readOnly = false;
                window.requestAnimationFrame(() => new_item.text.focus())
            }
            buttonsUpdate();
            search();
        })
        .catch(error => {
            window.console.error('There was a problem with your fetch operation:', error);
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
                return response.json();
            } else {
                throw new Error(response.statusText);
            }
        })
        .then(data => {
            buttonsUpdate();
            search();
        })
        .catch(error => {
            window.console.error('There was a problem with your fetch operation:', error);
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
            window.console.error('There was a problem with your fetch operation:', error);
        });
}

function editMode(state) {
    EDIT_MODE = state;
    buttonsUpdate();
}