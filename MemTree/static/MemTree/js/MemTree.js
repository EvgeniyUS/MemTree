/* jshint esversion: 6 */
/*globals $:false */
/*globals csrftoken:false */
let CHECKED_ITEMS_IDS = Array();
let SELECTED_ITEM_ID = false;

const bootstrapButton = $.fn.button.noConflict(); // return $.fn.button to previously assigned value
$.fn.bootstrapBtn = bootstrapButton;              // give $().bootstrapBtn the Bootstrap functionality

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
        collapseChanged(this);
    });
}

function edit_remove_item() {
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
                                refresh();
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

function textChanged(text) {
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
        },
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

function collapseChanged(caret) {
    "use strict";
    if (caret.collapsed) {
        caret.style.transform = 'rotate(0deg)';
        find(get_id(caret), "ul").style.display = "none";
    }
    else {
        caret.style.transform = 'rotate(90deg)';
        find(get_id(caret), "ul").style.display = "block";
    }
    $.ajax({
        type: 'POST',
        url: 'collapse/',
        dataType: 'json',
        data: {
            'id': caret.parentNode.id,
            'collapsed': caret.collapsed
        },
    });
}

function add_move_item() {
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
                refresh();
            },
            error: function (jqXHR, exception) {
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
                window.alert(msg);
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
                const caret = find(SELECTED_ITEM_ID, "caret");
                if (caret) {
                    caret.collapsed = false;
                    collapseChanged(caret);
                }
                itemBuilder(data, true);
            },
            error: function (jqXHR, exception) {
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
                window.alert(msg);
            },
        });
    }
}

function selection(item_id) {
    "use strict";
    let edit_remove_button = document.getElementById("edit_remove_button");
    if (!(CHECKED_ITEMS_IDS.includes(item_id)) || SELECTED_ITEM_ID === item_id) {
        let text = find(item_id, "text");
        if (SELECTED_ITEM_ID === item_id) {
            SELECTED_ITEM_ID = false;
            check_item(item_id);
        } else {
            if (SELECTED_ITEM_ID) {
                find(SELECTED_ITEM_ID, "text").style.border = "1px solid rgba(0, 0, 0, 0.8)";
            }
            SELECTED_ITEM_ID = item_id;
            text.style.border = "1px solid rgba(155, 255, 155, 0.5)";
            edit_remove_button.disabled = false;
        }
    } else {
        check_item(item_id);
    }
}

function check_item(item_id) {
    "use strict";
    if (item_id === SELECTED_ITEM_ID) {
        selection(item_id);
    }
    let add_move_button = document.getElementById("add_move_button");
    let edit_remove_button = document.getElementById("edit_remove_button");
    if (CHECKED_ITEMS_IDS.includes(item_id)) {
        CHECKED_ITEMS_IDS = CHECKED_ITEMS_IDS.filter(val => val !== item_id);
        find(item_id, "text").style.border = "1px solid rgba(0, 0, 0, 0.8)";
        find(item_id, "ul").className = null;
        if (CHECKED_ITEMS_IDS.length > 0) {
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
    } else {
        CHECKED_ITEMS_IDS.push(item_id);
        find(item_id, "text").style.border = "1px solid rgba(255, 211, 0, 0.7)";
        find(item_id, "ul").className = "disabled";
        add_move_button.innerHTML = 'Move';
        add_move_button.className = 'btn btn-warning btn-sm';
        edit_remove_button.className = "btn btn-danger btn-sm";
        edit_remove_button.disabled = false;
        edit_remove_button.innerHTML = 'Del';
    }
}

function itemBuilder(item, focus) {
    "use strict";
    const li = document.createElement('li');
    li.parent = item.parent;
    li.setAttribute('id', item.id);

    const caret = document.createElement('span');
    caret.setAttribute('id', `${item.id}_caret`);
    caret.className = 'caret';
    caret.collapsed = item.collapsed;
    caret.style.display = "none";
    caretToggler(caret);

    const text = document.createElement('textarea');
    setAttributes(text, {
        "id": `${item.id}_text`,
        "class": "text",
        "rows": 1,
        "wrap": "off",
        "oninput": "textChanged(this)",
        "onclick": "selection(this.parentNode.id)",
        "readonly": true
    });
    text.value = item.text;
    inputWidthChanger(text);

    const ul = document.createElement('ul');
    ul.setAttribute("id", `${item.id}_ul`);

    if (caret.collapsed) {
        caret.style.transform = 'rotate(0deg)';
        ul.style.display = "none";
    } else {
        caret.style.transform = 'rotate(90deg)';
        ul.style.display = "block";
    }

    const counter = document.createElement('sup');
    setAttributes(counter, {
        "id": `${item.id}_counter`,
        "class": "counter",
    });

    li.appendChild(caret);
    li.appendChild(text);
    li.appendChild(counter);
    li.appendChild(ul);

    if (item.parent) {

        find(item.parent, "caret").style.display = 'inline-block';

        const parent_input = find(item.parent, "text");
        parent_input.style.color = "rgba(190,130,70,0.9)";

        const parent_ul = find(item.parent, "ul");
        parent_ul.appendChild(li);

        find(item.parent, "counter").innerHTML = `${parent_ul.childNodes.length}`;
    }
    else {
        const root_ul = document.getElementById("root_ul");
        root_ul.appendChild(li);
    }
    if (focus) {
        text.readOnly = false;
        text.focus();
    }
}

function refresh() {
    "use strict";
    $.ajax({
        type: 'GET',
        url: 'items/',
        success: function(data) {
            document.getElementById("root_ul").innerHTML = "";
            for (let i = 0; i < data.length; i++) {
                itemBuilder(data[i], false);
            }
            let add_move_button = document.getElementById("add_move_button");
            add_move_button.className = 'btn btn-success btn-sm';
            add_move_button.innerHTML = 'Add';

            let edit_remove_button = document.getElementById("edit_remove_button");
            edit_remove_button.className = "btn btn-info btn-sm";
            edit_remove_button.disabled  = true;
            edit_remove_button.innerHTML = "Edit";

            CHECKED_ITEMS_IDS = Array();
            SELECTED_ITEM_ID = false;
            search();
        },
        error: function() {
            window.alert('Got an error');
        }
    });
}

function search_mark(item) {
    "use strict";
    item.style.background = 'rgba(155, 255, 155, 0.1)';
    if (item.parentNode.parent) {
        search_mark(find(item.parentNode.parent, 'text'));
    }
}

function search() {
    "use strict";
    let search_input = document.getElementById('search_input');
    search_input.classList.remove('disabled');
    let elements = document.getElementsByClassName('text');
    let search_counter = document.getElementById('search_counter');
    search_counter.innerHTML = '0';
    for (let i = 0; i < elements.length; ++i) {
        const item = elements[i];
        if ((search_input.value) && (item.value.toLowerCase().includes(search_input.value.toLowerCase()))) {
            search_counter.innerHTML = `${Number(search_counter.innerHTML) + 1}`;
            // let idx = item.value.indexOf(search_input.value);
            // if (idx >= 0) {
            //     item.setSelectionRange(idx, idx + search_input.value.length);
            // }
            search_mark(item);
        } else {
            item.style.background = 'transparent';
        }
    }
    if (!(search_input.value)) {
        search_counter.innerHTML = '';
    }
}

function get_id(item) {
    "use strict";
    return item.id.split('_')[0];
}

function find(item_id, item_type) {
    "use strict";
    return document.getElementById(`${item_id}_${item_type}`);
}
