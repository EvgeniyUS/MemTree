/* jshint esversion: 6 */
/*globals $:false */
/*globals csrftoken:false */
let CHECKED_ITEMS_IDS = Array();
let SELECTED_ITEM_ID = false;
let WEBSOCKET = false;
let WEBSOCKET_RECONNECT_TIMEOUT = 9999; // sec

const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
$.fn.bootstrapBtn = bootstrapButton;              // give $().bootstrapBtn the Bootstrap functionality

function wsConnect() {
    "use strict";
    let ws_proto = 'ws://';
    if (window.location.protocol === 'https:') {
        ws_proto = 'wss://';
    }
    window.console.log(`${ws_proto}${window.location.host}/ws/`);
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
            window.console.log('updated');
            if ('collapsed' in data) {
                const caret = find(data.id, "caret");
                caret.collapsed = data.collapsed;
                if (caret.collapsed) {
                    caret.style.transform = 'rotate(0deg)';
                    find(getId(caret), "ul").style.display = "none";
                }
                else {
                    caret.style.transform = 'rotate(90deg)';
                    find(getId(caret), "ul").style.display = "block";
                }
            } else if ('text' in data) {
                const text = find(data.id, "text");
                text.value = data.text;
                inputWidthChanger(text);
            } else if ('parent' in data) {
                const li = document.getElementById(data.id);
                const old_parent = li.parent;
                li.parent = data.parent;
                appendToParent(li);
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
            const text = find(SELECTED_ITEM_ID, "text");
            if (text) {
                text.readOnly = false;
                text.focus();
            }
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
    if ($(text).val()) {
        const value_rows = $(text).val().split('\n');
        $(text).attr('rows', value_rows.length);
        let len = 1;
        let longest;
        for (let i=0; i < value_rows.length; i++) {
            if (value_rows[i].length > len) {
                len = value_rows[i].length;
                longest = value_rows[i];
            }
        }
        $(text).attr('cols', len);
    } else {
        $(text).attr('cols', 1);
    }
}

function collapse(caret) {
    "use strict";
    if (!WEBSOCKET) {
        if (caret.collapsed) {
            caret.style.transform = 'rotate(0deg)';
            find(getId(caret), "ul").style.display = "none";
        }
        else {
            caret.style.transform = 'rotate(90deg)';
            find(getId(caret), "ul").style.display = "block";
        }
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
                        const li = document.getElementById(item_id);
                        const old_parent = li.parent;
                        li.parent = SELECTED_ITEM_ID;
                        appendToParent(li);
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
                create(data);
                showChildren(data.parent);
                const text = find(data.id, 'text');
                text.readOnly = false;
                text.focus();
            },
            error: function (jqXHR, exception) {
                errorAlert(jqXHR, exception);
            },
        });
    }
}

function showChildren(item_id) {
    "use strict";
    const caret = find(item_id, "caret");
    if (caret && caret.collapsed) {
        caret.collapsed = false;
        collapse(caret);
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
    for (const item of document.querySelectorAll('[id$="_text"]')) {
        const item_id = getId(item);
        if (item_id === SELECTED_ITEM_ID) {
            item.style.border = "1px solid rgba(155, 255, 155, 0.5)";
            find(item_id, "ul").className = null;
        } else if (CHECKED_ITEMS_IDS.includes(item_id)) {
            item.style.border = "1px solid rgba(255, 211, 0, 0.7)";
            find(item_id, "ul").className = "disabled";
        } else {
            item.style.border = "1px solid rgba(0, 0, 0, 0.8)";
            find(item_id, "ul").className = null;
        }
    }
}

function create(data) {
    "use strict";
    if (!document.getElementById(data.id)) {
        const li = document.createElement('li');
        li.parent = data.parent;
        li.setAttribute('id', data.id);

        const caret = document.createElement('span');
        caret.setAttribute('id', `${data.id}_caret`);
        caret.className = 'caret';
        caret.collapsed = data.collapsed;
        caret.style.display = "none";
        caretToggler(caret);

        const text = document.createElement('textarea');
        setAttributes(text, {
            "id": `${data.id}_text`,
            "class": "text",
            "rows": 1,
            "wrap": "off",
            "oninput": "changeText(this)",
            "onclick": "selection(this.parentNode.id)",
            "readonly": true
        });
        text.value = data.text;
        inputWidthChanger(text);

        const ul = document.createElement('ul');
        ul.setAttribute("id", `${data.id}_ul`);

        if (caret.collapsed) {
            caret.style.transform = 'rotate(0deg)';
            ul.style.display = "none";
        } else {
            caret.style.transform = 'rotate(90deg)';
            ul.style.display = "block";
        }

        const counter = document.createElement('sup');
        setAttributes(counter, {
            "id": `${data.id}_counter`,
            "class": "counter",
        });

        li.appendChild(caret);
        li.appendChild(text);
        li.appendChild(counter);
        li.appendChild(ul);

        appendToParent(li);
    }
}

function appendToParent(li) {
    "use strict";
    if (li.parent) {
        const parent_ul = find(li.parent, "ul");
        parent_ul.appendChild(li);
    }
    else {
        const root_ul = document.getElementById("root_ul");
        root_ul.appendChild(li);
    }
    parentUpdate(li.parent);
}

function parentUpdate(parent_id) {
    "use strict";
    if (parent_id) {
        const parent_ul = find(parent_id, "ul");
        const parent_input = find(parent_id, "text");
        if (parent_ul.childNodes.length > 0) {
            parent_input.style.color = "rgba(190,130,70,0.9)";
            find(parent_id, "caret").style.display = 'inline-block';
            find(parent_id, "counter").innerHTML = `${parent_ul.childNodes.length}`;
        }
        else {
            parent_input.style.color = "rgba(255,255,255,0.8)";
            find(parent_id, "caret").style.display = 'none';
            find(parent_id, "counter").innerHTML = '';
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
    item.style.background = 'rgba(155, 255, 155, 0.1)';
    if (item.parentNode.parent) {
        searchMark(find(item.parentNode.parent, 'text'));
    }
}

function search() {
    "use strict";
    let search_input = document.getElementById('search_input');
    let elements = document.getElementsByClassName('text');
    let search_counter = document.getElementById('search_counter');
    search_counter.innerHTML = '0';
    for (let i = 0; i < elements.length; ++i) {
        const item = elements[i];
        if ((search_input.value) && (item.value.toLowerCase().includes(search_input.value.toLowerCase()))) {
            search_counter.innerHTML = `${Number(search_counter.innerHTML) + 1}`;
            searchMark(item);
        } else {
            item.style.background = 'transparent';
        }
    }
    if (!search_input.value) {
        search_counter.innerHTML = '';
    }
}

function getId(item) {
    "use strict";
    return item.id.split('_')[0];
}

function find(item_id, item_type) {
    "use strict";
    return document.getElementById(`${item_id}_${item_type}`);
}
