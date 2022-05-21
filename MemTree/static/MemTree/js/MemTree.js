let CHECKED_ITEMS_IDS = Array();
let SELECTED_ITEM_ID = false;

function csrfSafeMethod(method) {
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

function spanToggler(span) {
    span.addEventListener("click", function() {
        this.collapsed = !this.collapsed;
        collapseChanged(this);
    });
}

function edit_remove_item() {
    if (CHECKED_ITEMS_IDS.length > 0) {
        $("#remove_item_confirm").dialog({
            draggable: false,
            resizable: false,
            height: "auto",
            width: "auto",
            modal: true,
            buttons: [
                {
                    text: "Yes",
                    class: "btn btn-danger btn-sm",
                    style: "margin-right:30px",
                    click: function () {
                        $.ajax({
                            type: 'POST',
                            url: 'delete/',
                            dataType: 'json',
                            data: {
                                ids: JSON.stringify(CHECKED_ITEMS_IDS),
                            },
                            success: function (data) {
                                refresh();
                            }
                        });
                        $(this).dialog("close");
                    }
                },
                {
                    text: "No",
                    class: "btn btn-success btn-sm",
                    click: function () {
                        $(this).dialog("close");
                    }
                },

            ],
        });
    } else {
        if (SELECTED_ITEM_ID) {
            const input = find(SELECTED_ITEM_ID, "input");
            if (input) {
                input.readOnly = false;
                input.focus();
            }
        }
    }
}

function setAttributes(element, attrs) {
    for (const key in attrs) {
        element.setAttribute(key, attrs[key]);
    }
}

function nameChanged(inputNode) {
    $.ajax({
        type: 'POST',
        url: 'change-name/',
        dataType: 'json',
        data: {
            'id': inputNode.parentNode.id,
            'name': inputNode.value
        },
        success: function (data) {
            inputWidthChanger(inputNode);
        },
    });
}

function inputWidthChanger(inp) {
    if ($(inp).val()) {
        const value_rows = $(inp).val().split('\n');

        $(inp).attr('rows', value_rows.length);

        let lgth = 1;
        let longest;

        for(let i=0; i < value_rows.length; i++){
            if(value_rows[i].length > lgth){
                lgth = value_rows[i].length;
                longest = value_rows[i];
            }
        }

        $(inp).attr('cols', lgth);

    } else {
        $(inp).attr('cols', 1);
    }
}

function collapseChanged(span) {
    $.ajax({
        type: 'POST',
        url: 'collapse/',
        dataType: 'json',
        data: {
            'id': span.parentNode.id,
            'collapsed': span.collapsed
        },
        success: function () {
            if (span.collapsed) {
                span.style.transform = 'rotate(0deg)';
                find(get_id(span), "ul").style.display = "none";
            }
            else {
                span.style.transform = 'rotate(90deg)';
                find(get_id(span), "ul").style.display = "block";
            }
        }
    });
}

function add_move_item() {
    if (CHECKED_ITEMS_IDS.length > 0) {
        $.ajax({
            type: 'POST',
            url: 'move/',
            dataType: 'json',
            data: {
                ids: JSON.stringify(CHECKED_ITEMS_IDS),
                parent: SELECTED_ITEM_ID
            },
            success: function (data) {
                refresh();
            },
            error: function (jqXHR, exception) {
                let msg = '';
                if (jqXHR.status === 0) {
                    msg = 'Not connect.\n Verify Network.';
                } else if (jqXHR.status == 404) {
                    msg = 'Requested page not found. [404]';
                } else if (jqXHR.status == 500) {
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
                alert(msg);
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
                const span = find(SELECTED_ITEM_ID, "span");
                if (span) {
                    span.collapsed = false;
                    collapseChanged(span);
                }
                itemBuilder(data, true);
            },
            error: function (jqXHR, exception) {
                let msg = '';
                if (jqXHR.status === 0) {
                    msg = 'Not connect.\n Verify Network.';
                } else if (jqXHR.status == 404) {
                    msg = 'Requested page not found. [404]';
                } else if (jqXHR.status == 500) {
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
                alert(msg);
            },
        });
    }
}

function selection(item_id) {
    let edit_remove_button = document.getElementById("edit_remove_button");
    if (!(CHECKED_ITEMS_IDS.includes(item_id)) || SELECTED_ITEM_ID === item_id) {
        let input = find(item_id, "input");
        if (SELECTED_ITEM_ID === item_id) {
            SELECTED_ITEM_ID = false;
            check_item(item_id);
        } else {
            if (SELECTED_ITEM_ID) {
                find(SELECTED_ITEM_ID, "input").style.border = "1px solid rgba(0, 0, 0, 0.8)";
            }
            SELECTED_ITEM_ID = item_id
            input.style.border = "1px solid rgba(155, 255, 155, 0.5)";
            edit_remove_button.disabled = false;
        }
    } else {
        check_item(item_id);
    }
}

function check_item(item_id) {
    if (item_id === SELECTED_ITEM_ID) {
        selection(item_id)
    }
    let add_move_button = document.getElementById("add_move_button");
    let edit_remove_button = document.getElementById("edit_remove_button");
    if (CHECKED_ITEMS_IDS.includes(item_id)) {
        CHECKED_ITEMS_IDS = CHECKED_ITEMS_IDS.filter(val => val !== item_id);
        find(item_id, "input").style.border = "1px solid rgba(0, 0, 0, 0.8)";
        find(item_id, "ul").className = null;
        if (CHECKED_ITEMS_IDS.length > 0) {
            edit_remove_button.className = "btn btn-danger btn-sm";
            edit_remove_button.disabled = false;
            edit_remove_button.innerHTML = 'Del'
        }
        else {
            add_move_button.innerHTML = 'Add';
            add_move_button.className = 'btn btn-success btn-sm';
            edit_remove_button.className = "btn btn-info btn-sm";
            edit_remove_button.disabled = true;
            edit_remove_button.innerHTML = 'Edit'
        }
    } else {
        CHECKED_ITEMS_IDS.push(item_id);
        find(item_id, "input").style.border = "1px solid rgba(255, 211, 0, 0.7)";
        find(item_id, "ul").className = "disabled";
        add_move_button.innerHTML = 'Move';
        add_move_button.className = 'btn btn-warning btn-sm';
        edit_remove_button.className = "btn btn-danger btn-sm";
        edit_remove_button.disabled = false;
        edit_remove_button.innerHTML = 'Del'
    }
}

function itemBuilder(item, focus=false) {
    const root = document.createElement('li');
    root.parent = item['parent'];
    root.setAttribute('id', item['id']);

    const span = document.createElement('span');
    span.setAttribute('id', `${item['id']}_span`);
    span.className = 'caret';
    span.collapsed = item['collapsed'];
    span.style.display = "none";
    spanToggler(span);

    const input = document.createElement('textarea');
    setAttributes(input, {
        "id": `${item['id']}_input`,
        "rows": 1,
        "wrap": "off",
        "oninput": "nameChanged(this)",
        "onclick": "selection(this.parentNode.id)",
        "readonly": true
    });
    input.style.color = "rgba(255,255,255,0.8)";
    if (item['name']) {
        input.value = item['name'];
    }
    inputWidthChanger(input);

    const ul = document.createElement('ul');
    ul.setAttribute("id", `${item['id']}_ul`);

    if (span.collapsed) {
        span.style.transform = 'rotate(0deg)';
        ul.style.display = "none";
    }
    else {
        span.style.transform = 'rotate(90deg)';
        ul.style.display = "block";
    }

    const counter = document.createElement('sup');
    setAttributes(counter, {
        "id": `${item['id']}_counter`,
        "class": "counter",
    });

    root.appendChild(span);
    root.appendChild(input);
    root.appendChild(counter);
    root.appendChild(ul);

    if (item['parent']) {

        find(item['parent'], "span").style.display = 'inline-block';

        const parent_input = find(item['parent'], "input");
        parent_input.style.color = "rgba(190,130,70,0.9)";
        parent_input.style.marginLeft = '15px';

        const parent_ul = find(item['parent'], "ul");
        parent_ul.appendChild(root);

        find(item['parent'], "counter").innerHTML = ` ${parent_ul.childNodes.length}`;
    }
    else {
        const meta_root = document.getElementById("myUL");
        meta_root.appendChild(root);
    }

    if (focus) {
        input.readOnly = false;
        input.focus();
    }
}

function refresh() {
    $.ajax({
        type: 'GET',
        url: 'items/',
        success: function(data) {
            document.getElementById("myUL").innerHTML = "";
            for (let i = 0; i < data.length; i++) {
                itemBuilder(data[i]);
            }
            let add_move_button = document.getElementById("add_move_button")
            add_move_button.className = 'btn btn-success btn-sm';
            add_move_button.innerHTML = 'Add';

            let edit_remove_button = document.getElementById("edit_remove_button")
            edit_remove_button.className = "btn btn-info btn-sm";
            edit_remove_button.disabled  = true;
            edit_remove_button.innerHTML = "Edit"

            CHECKED_ITEMS_IDS = Array();
            SELECTED_ITEM_ID = false;
        },
        error: function() {
            alert('Got an error');
        }
    });
}

function get_id(item) {
    return item.id.split('_')[0]
}

function find(item_id, item_type) {
    return document.getElementById(`${item_id}_${item_type}`);
}
