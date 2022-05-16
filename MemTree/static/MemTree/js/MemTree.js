// var ITEM_COUNT = 0;
MOVE_ITEM_IDS = Array();
SELECTED_ITEM_ID = false;

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
        this.parentElement.querySelector(".nested").classList.toggle("active");
        this.classList.toggle("caret-down");
    });
}

function rmFunc() {
    let result = true;
    const li = document.getElementById(SELECTED_ITEM_ID);
    const ul = find(SELECTED_ITEM_ID, "ul");
    if (ul.childNodes.length > 0) {
        const value = find(li.id, "input").value;
        result = confirm(`Удалить "${value}"?`);
    }
    if (result) {
        if (li.parent) {
            const parent_ul = find(li.parent, "ul");
            if (parent_ul.childNodes.length < 2) {
                const span = find(li.parent, "span");
                span.collapsed = true;
                collapseChanged(span);
            }
        }
        $.ajax({
            type: 'POST',
            url: 'delete/',
            dataType: 'json',
            data: {
                'id': li.id
            },
            success: function (data) {
                refresh();
            },
        });
    }
}

function editFunc() {
    const item_input = find(SELECTED_ITEM_ID, "input");
    if (item_input) {
        item_input.readOnly = false;
        item_input.focus();
    }
}

function setAttributes(el, attrs) {
    for (const key in attrs) {
        el.setAttribute(key, attrs[key]);
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
    });
}

function addItem() {
    if (MOVE_ITEM_IDS.length > 0) {
        $.ajax({
            type: 'POST',
            url: 'move/',
            dataType: 'json',
            data: {
                ids: JSON.stringify(MOVE_ITEM_IDS),
                parent: SELECTED_ITEM_ID
            },
            success: function (data) {
                refresh();
            },
            error: function (jqXHR, exception) {
                var msg = '';
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
    }
    else {
        $.ajax({
            type: 'POST',
            url: 'create/',
            dataType: 'json',
            data: {
                'parent': SELECTED_ITEM_ID
            },
            success: function (data) {
                // ITEM_COUNT = ITEM_COUNT + 1;
                // description();
                const span = find(SELECTED_ITEM_ID, "span");
                if (span) {
                    span.collapsed = false;
                    span.classList.toggle("caret-down", true);
                    const ul = find(SELECTED_ITEM_ID, "ul");
                    ul.classList.toggle("active", true);
                    collapseChanged(span);
                }
                itemBuilder(data, true);
            },
            error: function (jqXHR, exception) {
                var msg = '';
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
    if (!(MOVE_ITEM_IDS.includes(item_id)) || SELECTED_ITEM_ID === item_id) {
        let input = find(item_id, "input");
        // при вырезании или если значение инпута начинается с "_" скрываем кнопку remove
        // (при удалении элемента обновляется все дерево и сбрасывается вырезание)
        document.getElementById("remove_button").disabled = MOVE_ITEM_IDS.length !== 0 || input.value.charAt(0) === '_';
        if (SELECTED_ITEM_ID === item_id) {
            SELECTED_ITEM_ID = false;
            input.style.border = "1px solid rgba(0, 0, 0, 0.8)";

            document.getElementById("edit_button").disabled = true;
            document.getElementById("move_button").disabled = true;
            document.getElementById("remove_button").disabled = true;
        } else {
            if (SELECTED_ITEM_ID) {
                find(SELECTED_ITEM_ID, "input").style.border = "1px solid rgba(0, 0, 0, 0.8)";
            }
            SELECTED_ITEM_ID = item_id
            input.style.border = "1px solid rgba(155, 255, 155, 0.5)";

            document.getElementById("create_button").disabled = false;
            document.getElementById("edit_button").disabled = false;
            document.getElementById("move_button").disabled = false;

        }
    }
}

function itemBuilder(item, focus=false) {
    const root = document.createElement('li');
    root.parent = item['parent'];
    root.setAttribute('id', item['id']);

    const span = document.createElement('span');
    span.setAttribute('id', `${item['id']}_span`);
    span.collapsed = item['collapsed'];
    span.style.display = "none";
    spanToggler(span);

    // var checkbox = document.createElement('input');
    // checkbox.type = "checkbox";

    const input = document.createElement('textarea');
    setAttributes(input, {
        "id": `${item['id']}_input`,
        "rows": 1,
        "wrap": "off",
        "oninput": "nameChanged(this)",
        "onclick": "selection(this.parentNode.id)",
        "oncontextmenu": "move(this.parentNode.id)",
        "readOnly": "true",
        // "onfocusout": "this.readOnly=true",
    });
    input.style.color = "rgba(255,255,255,0.8)";
    if (item['name']) {
        input.value = item['name'];
        if (item['name'].charAt(0) === '_') {
            input.style.fontWeight = "bold";
            input.style.fontSize = "20px";
        }
    }
    inputWidthChanger(input);

    const ul = document.createElement('ul');
    ul.setAttribute("id", `${item['id']}_ul`);

    if (span.collapsed) {
        span.className = "caret";
        ul.className = "nested";
    }
    else {
        span.className = "caret caret-down";
        ul.className = "nested active";
    }

    const counter = document.createElement('sup');
    setAttributes(counter, {
        "id": `${item['id']}_counter`,
        "class": "counter",
    });

    root.appendChild(span);
    // root.appendChild(checkbox);
    root.appendChild(input);
    root.appendChild(counter);
    root.appendChild(ul);

    if (item['parent']) {

        find(item['parent'], "span").style.display = 'inline-block';

        const parent_input = find(item['parent'], "input");
        parent_input.style.color = "rgba(255,98,70,0.8)";
        parent_input.style.marginLeft = '15px';

        const parent_ul = find(item['parent'], "ul");
        parent_ul.appendChild(root);

        find(item['parent'], "counter").innerHTML = ` ${parent_ul.childNodes.length}`;
    }
    else {
        const meta_root = document.getElementById("myUL");
        meta_root.appendChild(root);
    }

    // if (input.value == false && focus) {
    if (focus) {
        input.readOnly = false;
        input.focus();
    }
}

// function description() {
//     document.getElementById('Desc').innerText = `Items count: ${ITEM_COUNT}`;
// }


function move(item_id) {
    if (MOVE_ITEM_IDS.includes(item_id)) {
        MOVE_ITEM_IDS = MOVE_ITEM_IDS.filter(val => val !== item_id);
        // find(item_id, "span").style.display = "inline-block";
        let input = find(item_id, "input");
        input.style.border = "1px solid rgba(0, 0, 0, 0.8)";
        // input.disabled = false;
        find(item_id, "ul").style.display = "grid";
    } else {
        MOVE_ITEM_IDS.push(item_id);
        // find(item_id, "span").style.display = "none";
        let input = find(item_id, "input");
        input.style.border = "1px solid rgba(255, 211, 0, 0.4)";
        // input.disabled = true;
        find(item_id, "ul").style.display = "none";
    }
}

function refresh() {
    $.ajax({
        type: 'GET',
        url: 'items/',
        success: function(data) {
            // ITEM_COUNT = items.length;
            // description();
            document.getElementById("myUL").innerHTML = "";
            for (let i = 0; i < data.length; i++) {
                itemBuilder(data[i]);
            }
            document.getElementById("create_button").disabled  = false;
            document.getElementById("edit_button").disabled  = true;
            document.getElementById("remove_button").disabled  = true;
            document.getElementById("move_button").disabled  = true;
            document.getElementById("remove_button").disabled  = true;
            MOVE_ITEM_IDS = Array();
            SELECTED_ITEM_ID = false;
        },
        error: function() {
            alert('Got an error');
        }
    });
}

function find(item_id, item_type) {
    return document.getElementById(`${item_id}_${item_type}`);
}
