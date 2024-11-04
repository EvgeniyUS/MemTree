/* jshint esversion: 6 */
/*globals $:false */
/*globals csrftoken:false */
let CHANGED_ITEM = false;
let CHECKED_ITEMS_IDS = Array();
let SELECTED_ITEM_ID = false;
let WEBSOCKET = false;
let WEBSOCKET_RECONNECT_TIMEOUT = 10; // sec

const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
$.fn.bootstrapBtn = bootstrapButton;              // give $().bootstrapBtn the Bootstrap functionality

function wsConnect() {
    "use strict";
    let ws_proto = 'ws://';
    if (window.location.protocol === 'https:') {
        ws_proto = 'wss://';
    }
    const socket = new WebSocket(`${ws_proto}${window.location.host}/ws/`);

    socket.onopen = function () {
        socket.send(JSON.stringify({'WebSocket': 'OK'}));
        let menu_button = document.getElementById('menu_button');
        if (menu_button) {
            menu_button.classList.remove('btn-outline-light');
            menu_button.classList.add('btn-outline-success');
        }
        WEBSOCKET = true;
    };

    socket.onclose = function (event) {
        let menu_button = document.getElementById('menu_button');
        if (menu_button) {
            menu_button.classList.add('btn-outline-light');
            menu_button.classList.remove('btn-outline-success');
        }
        WEBSOCKET = false;
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
        if (data.signal === 'updated') {
            const item = document.getElementById(data.id);
            if ('collapsed' in data) {
                item.caret.collapsed = data.collapsed;
                caretRotate(item.caret);
            } else if ('text' in data) {
                if (CHANGED_ITEM != data.id) {
                    item.text.value = data.text;
                    inputWidthChanger(item.text);
                    search();
                } else {
                    CHANGED_ITEM = false;
                }
            } else if ('parent' in data) {
                const old_parent = item.parent;
                item.parent = data.parent;
                appendToParent(item);
                parentUpdate(old_parent);
            }
        } else if (data.signal === 'created') {
            create(data);
        } else if (data.signal === 'deleted') {
            const item = document.getElementById(data.id);
            const item_parent = item.parent;
            item.remove();
            parentUpdate(item_parent);
        }
    };

    socket.onerror = function (error) {
        window.console.error('WebSocket error:', error.message);
        socket.close();
    };
}

function csrfSafeMethod(method) {
    "use strict";
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        "use strict";
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

function caretToggler(caret) {
    "use strict";
    caret.addEventListener("click", function() {
        this.collapsed = !this.collapsed;
        collapse(this);
    });
}

function errorAlert(jqXHR, exception) {
    "use strict";
    let msg;
    if (jqXHR.status === 0) {
        msg = 'Not connect.\n Verify Network.';
    } else if (jqXHR.status === 404) {
        msg = 'Requested page not found. [404]';
    } else if (jqXHR.status === 500) {
        msg = 'Internal Server Error [500].';
    } else if (exception === 'parsererror') {
        msg = 'Requested JSON parse failed.';
    } else if (exception === 'timeout') {
        msg = 'Time out error.';
    } else if (exception === 'abort') {
        msg = 'Ajax request aborted.';
    } else {
        msg = 'Uncaught Error.\n' + jqXHR.responseText;
    }
    window.console.error(msg);
}

function editOrRemove() {
    "use strict";
    if (CHECKED_ITEMS_IDS.length > 0) {
        $("#remove_item_confirm").dialog({
            draggable: false,
            resizable: false,
            height: "auto",
            width: "auto",
            modal: true,
            buttons: [
                {
                    text: "No",
                    class: "btn btn-success btn-sm",
                    style: "margin-right:30px",
                    click: function () {
                        $(this).dialog("close");
                    }
                },
                {
                    text: "Yes",
                    class: "btn btn-danger btn-sm",
                    click: function () {
                        $.ajax({
                            type: 'POST',
                            url: 'delete/',
                            dataType: 'json',
                            data: {
                                ids: JSON.stringify(CHECKED_ITEMS_IDS),
                            },
                            success: function () {
                                if (!WEBSOCKET) {
                                    for (const item_id of CHECKED_ITEMS_IDS) {
                                        const item = document.getElementById(item_id);
                                        const item_parent = item.parent;
                                        item.remove();
                                        parentUpdate(item_parent);
                                    }
                                }
                                CHECKED_ITEMS_IDS = Array();
                                buttonsUpdate();
                            },
                            error: function (jqXHR, exception) {
                                errorAlert(jqXHR, exception);
                            }
                        });
                        $(this).dialog("close");
                    }
                },
            ],
        });
    } else {
        if (SELECTED_ITEM_ID) {
            const item = document.getElementById(SELECTED_ITEM_ID);
            item.text.readOnly = false;
            item.text.focus();
        }
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

function changeText(text) {
    "use strict";
    CHANGED_ITEM = text.parentNode.id;
    $.ajax({
        type: 'POST',
        url: 'change-text/',
        dataType: 'json',
        data: {
            'id': text.parentNode.id,
            'text': text.value
        },
        success: function () {
            inputWidthChanger(text);
            search();
        },
        error: function (jqXHR, exception) {
            errorAlert(jqXHR, exception);
        }
    });
}

function inputWidthChanger(text) {
    "use strict";
    let cols = 1;
    let rows = [1];
    if (text.value) {
        rows = text.value.split('\n');
        for (const row of rows) {
            if (row.length > cols) {
                cols = row.length;
            }
        }
    }
    text.setAttribute('cols', cols);
    text.setAttribute('rows', rows.length);
}

function caretRotate(caret) {
    "use strict";
    if (caret.collapsed) {
        caret.style.transform = 'rotate(0deg)';
        caret.parentNode.ul.style.display = "none";
    }
    else {
        caret.style.transform = 'rotate(90deg)';
        caret.parentNode.ul.style.display = "block";
    }
}

function collapse(caret) {
    "use strict";
    if (!WEBSOCKET) {
        caretRotate(caret);
    }
    $.ajax({
        type: 'POST',
        url: 'collapse/',
        dataType: 'json',
        data: {
            'id': caret.parentNode.id,
            'collapsed': caret.collapsed
        },
        error: function (jqXHR, exception) {
            errorAlert(jqXHR, exception);
        }
    });
}

function addOrMove() {
    "use strict";
    if (CHECKED_ITEMS_IDS.length > 0) {
        $.ajax({
            type: 'POST',
            url: 'move/',
            dataType: 'json',
            data: {
                ids: JSON.stringify(CHECKED_ITEMS_IDS),
                parent: SELECTED_ITEM_ID
            },
            success: function () {
                if (!WEBSOCKET) {
                    for (const item_id of CHECKED_ITEMS_IDS) {
                        const item = document.getElementById(item_id);
                        const old_parent = item.parent;
                        item.parent = SELECTED_ITEM_ID;
                        appendToParent(item);
                        parentUpdate(old_parent);
                    }
                }
                showChildren(SELECTED_ITEM_ID);
                CHECKED_ITEMS_IDS = Array();
                buttonsUpdate();
            },
            error: function (jqXHR, exception) {
                errorAlert(jqXHR, exception);
            }
        });
    } else {
        $.ajax({
            type: 'POST',
            url: 'create/',
            dataType: 'json',
            data: {
                'parent': SELECTED_ITEM_ID
            },
            success: function (data) {
                const item = create(data);
                showChildren(item.parent);
                item.text.readOnly = false;
                item.text.focus();
            },
            error: function (jqXHR, exception) {
                errorAlert(jqXHR, exception);
            },
        });
    }
}

function showChildren(item_id) {
    "use strict";
    if (item_id) {
        const item = document.getElementById(item_id);
        if (item.caret.collapsed) {
            item.caret.collapsed = false;
            collapse(item.caret);
        }
    }
}

function selection(item_id) {
    "use strict";
    if (SELECTED_ITEM_ID === item_id) {
        SELECTED_ITEM_ID = false;
        CHECKED_ITEMS_IDS.push(item_id);
    } else if (CHECKED_ITEMS_IDS.includes(item_id)) {
        CHECKED_ITEMS_IDS = CHECKED_ITEMS_IDS.filter(val => val !== item_id);
    } else {
        SELECTED_ITEM_ID = item_id;
    }
    buttonsUpdate();
}

function buttonsUpdate() {
    "use strict";
    let add_move_button = document.getElementById("add_move_button");
    let edit_remove_button = document.getElementById("edit_remove_button");
    if (CHECKED_ITEMS_IDS.length > 0) {
        add_move_button.innerHTML = 'Move';
        add_move_button.className = 'btn btn-warning btn-sm';
        edit_remove_button.className = "btn btn-danger btn-sm";
        edit_remove_button.disabled = false;
        edit_remove_button.innerHTML = 'Del';
    }
    else {
        add_move_button.innerHTML = 'Add';
        add_move_button.className = 'btn btn-success btn-sm';
        edit_remove_button.className = "btn btn-info btn-sm";
        edit_remove_button.innerHTML = 'Edit';
        edit_remove_button.disabled = !SELECTED_ITEM_ID;
    }
    bordersUpdate();
    search();
}

function bordersUpdate() {
    "use strict";
    for (const item of document.getElementsByTagName('li')) {
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

function create(data) {
    "use strict";
    var item = document.getElementById(data.id);
    if (!item) {
        item = document.createElement('li');
        item.parent = data.parent;
        item.setAttribute('id', data.id);

        item.caret = document.createElement('span');
        item.caret.className = 'caret';
        item.caret.collapsed = data.collapsed;
        item.caret.style.display = "none";
        caretToggler(item.caret);

        item.text = document.createElement('textarea');
        setAttributes(item.text, {
            "class": "text",
            "rows": 1,
            "wrap": "off",
            "oninput": "changeText(this)",
            "onclick": "selection(this.parentNode.id)",
            "readonly": true
        });
        item.text.value = data.text;
        inputWidthChanger(item.text);

        item.ul = document.createElement('ul');

        item.counter = document.createElement('sup');
        item.counter.setAttribute('class', 'counter');

        item.appendChild(item.caret);
        item.appendChild(item.text);
        item.appendChild(item.counter);
        item.appendChild(item.ul);

        appendToParent(item);

        caretRotate(item.caret);
    }
    return item;
}

function appendToParent(item) {
    "use strict";
    if (item.parent) {
        document.getElementById(item.parent).ul.appendChild(item);
    }
    else {
        document.getElementById("root_ul").appendChild(item);
    }
    parentUpdate(item.parent);
}

function parentUpdate(parent_id) {
    "use strict";
    if (parent_id) {
        const parent_item = document.getElementById(parent_id);
        if (parent_item.ul.childNodes.length > 0) {
            parent_item.text.style.color = "rgba(190,130,70,0.9)";
            parent_item.caret.style.display = 'inline-block';
            parent_item.counter.innerHTML = `${parent_item.ul.childNodes.length}`;
        }
        else {
            parent_item.text.style.color = "rgba(255,255,255,0.8)";
            parent_item.caret.style.display = 'none';
            parent_item.counter.innerHTML = '';
        }
    }
}

function items(data) {
    "use strict";
    for (const item of JSON.parse(data)) {
        create(item);
    }
    document.getElementById('search_input').classList.remove('disabled');
}

function searchMark(item) {
    "use strict";
    item.text.style.background = 'rgba(155, 255, 155, 0.1)';
    if (item.parent) {
        searchMark(document.getElementById(item.parent));
    }
}

function search() {
    "use strict";
    const search_input = document.getElementById('search_input');
    var search_counter = document.getElementById('search_counter');
    const items = document.getElementsByTagName('li');
    search_counter.innerHTML = '0';
    for (const item of items) {
        if ((search_input.value) && (item.text.value.toLowerCase().includes(search_input.value.toLowerCase()))) {
            search_counter.innerHTML = `${Number(search_counter.innerHTML) + 1}`;
            searchMark(item);
        } else {
            item.text.style.background = 'transparent';
        }
    }
    if (!search_input.value) {
        search_counter.innerHTML = '';
    }
}