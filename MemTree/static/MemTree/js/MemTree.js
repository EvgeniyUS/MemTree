var ITEM_COUNT = 0;
var MOVE_ITEM_ID = false;

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

var add_button = document.createElement('button');
setAttributes(add_button, {
    "class": "add_button",
    "title": "Добавить/Вставить",
});
add_button.innerHTML = "&#8626;";
addItemButtonEvent(add_button);

var move_button = document.createElement('button');
setAttributes(move_button, {
    "class": "move_button",
    "onclick": "refresh(this.parentNode.parentNode.id)",
    "title": "Вырезать",
});
move_button.innerHTML = "&#9986;";

var remove_button = document.createElement('button');
setAttributes(remove_button, {
    "class": "remove_button",
    "onclick": "rmFunc(this.parentNode.parentNode)",
    "title": "Удалить",
});
remove_button.innerHTML = "&times;";

var edit_button = document.createElement('button');
setAttributes(edit_button, {
    "class": "edit_button",
    "onclick": "editFunc(this.parentNode.parentNode.id)",
    "title": "Редактировать"
});
edit_button.innerHTML = "&#9998;";

function spanToggler(span) {
    span.addEventListener("click", function() {
        if (this.collapsed) {
            this.collapsed = false;
        }
        else {
            this.collapsed = true;
        }
        collapseChanged(this);
        this.parentElement.querySelector(".nested").classList.toggle("active");
        this.classList.toggle("caret-down");
    });
}

function addItemButtonEvent(button) {
    button.addEventListener("click", function() {
        var parent_id = this.parentNode.id.split("_")[0];
        var span = find(parent_id, "span");
        span.collapsed = false;
        span.classList.toggle("caret-down", true);
        var ul = find(parent_id, "ul");
        ul.classList.toggle("active", true);
        collapseChanged(span);
        addItem(parent_id);
    });
}

function rmFunc(node) {
    var result = true;
    var ul = find(node.id, "ul");
    if (ul.childNodes.length > 0) {
        var value = find(node.id, "input").value;
        result = confirm(`Удалить "${value}"?`);
    }
    if (result) {
        $.ajax({
            type: 'POST',
            url: '/memtree/',
            dataType: 'json',
            data: {
                'type': 'delete',
                'id': node.id
            },
            success: function (json) {
                refresh();
            },
        });
    }
}

function editFunc(item_id) {
    var item_input = find(item_id, "input");
    item_input.readOnly = false;
    item_input.focus();
}

function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

function nameChanged(inputNode) {
    $.ajax({
        type: 'POST',
        url: '/memtree/',
        dataType: 'json',
        data: {
            'type': 'name',
            'id': inputNode.parentNode.id,
            'name': inputNode.value
        },
        success: function (json) {
            inputWidthChanger(inputNode);
        },
    });
}

function inputWidthChanger(inp) {
    if ($(inp).val()) {
        $(inp).attr('size', $(inp).val().length);
    } else {
        $(inp).attr('size', 1);
    }
}

function collapseChanged(span) {
    $.ajax({
        type: 'POST',
        url: '/memtree/',
        dataType: 'json',
        data: {
            'type': 'collapse',
            'id': span.parentNode.id,
            'collapsed': span.collapsed
        },
    });
}

function addItem(parent_id=null) {
    if (MOVE_ITEM_ID) {
        $.ajax({
            type: 'POST',
            url: '/memtree/',
            dataType: 'json',
            data: {
                'type': 'move',
                'id': MOVE_ITEM_ID,
                'parent': parent_id
            },
            success: function (json) {
                refresh();
            },
            error: function () {
                alert('Got an error');
            }
        });
    }
    else {
        $.ajax({
            type: 'POST',
            url: '/memtree/',
            dataType: 'json',
            data: {
                'type': 'create',
                'parent': parent_id
            },
            success: function (json) {
                ITEM_COUNT = ITEM_COUNT + 1;
                description();
                itemBuilder(json, true);
            },
            error: function () {
                alert('Got an error');
            }
        });
    }
}

function inputFocus(item_id) {
    var btn_cont = find(item_id, "btn_cont");
    btn_cont.appendChild(add_button);
    btn_cont.appendChild(edit_button);
    btn_cont.appendChild(move_button);
    btn_cont.appendChild(remove_button);

    if (MOVE_ITEM_ID != item_id) {
        add_button.style.display = "inline-block";
    }
    else {
        add_button.style.display = "none";
    }
    if (MOVE_ITEM_ID == false) {
        remove_button.style.display = "inline-block";
    }
    else {
        remove_button.style.display = "none";
    }
}

function itemBuilder(item, focus=false) {
    var root = document.createElement('li');
    root.setAttribute('id', item['id']);

    var span = document.createElement('span');
    span.setAttribute('id', `${item['id']}_span`);
    span.collapsed = item['collapsed'];
    span.style.display = "none";
    spanToggler(span);
    root.appendChild(span);

    // var checkbox = document.createElement('input');
    // checkbox.type = "checkbox";
    // root.appendChild(checkbox);

    var input = document.createElement('input');
    setAttributes(input, {
        "id": `${item['id']}_input`,
        "oninput": "nameChanged(this)",
        "onfocus": "inputFocus(this.parentNode.id)",
        "readOnly": "true",
        // "ondblclick": "this.readOnly=false",
        "onfocusout": "this.readOnly=true"
    });
    if (item['name']) {
        input.setAttribute("value", item['name']);
    }
    inputWidthChanger(input);
    root.appendChild(input);

    var btn_cont = document.createElement('a');
    btn_cont.setAttribute("id", `${item['id']}_btn_cont`);
    root.appendChild(btn_cont);

    var ul = document.createElement('ul');
    ul.setAttribute("id", `${item['id']}_ul`);
    if (span.collapsed) {
        span.className = "caret";
        ul.className = "nested";
    }
    else {
        span.className = "caret caret-down";
        ul.className = "nested active";
    }
    root.appendChild(ul);

    var parent_ul = false;
    if (item['parent']) {
        parent_ul = find(item['parent'], "ul");
        var parent_span = find(item['parent'], "span");
        parent_span.style.display = 'inline-block';
        var parent_input = find(item['parent'], "input");
        parent_input.style.background = "#1b1e21";
        parent_input.style.fontWeight = "bold";
    }
    else {
        parent_ul = document.getElementById("myUL");
    }
    parent_ul.appendChild(root);

    if (input.value == false && focus) {
        input.readOnly = false;
        input.focus();
    }
}

function description() {
    document.getElementById('Desc').innerText = `Items count: ${ITEM_COUNT}`;
}

function refresh(move_id=false) {
    $.ajax({
        type: 'GET',
        url: '/memtree/',
        dataType: 'json',
        data: {
            'type': 'all'
        },
        success: function(json) {
            var items = json['all'];
            ITEM_COUNT = items.length;
            description();
            document.getElementById("myUL").innerHTML = "";
            for (var i = 0; i < items.length; i++) {
                itemBuilder(items[i]);
            }
            if (move_id) {
                if (move_id != MOVE_ITEM_ID) {
                    MOVE_ITEM_ID = move_id;
                    find(move_id, "span").style.display = "none";
                    find(move_id, "input").style.border = "2px dotted rgba( 230, 30, 30, 0.9 )";
                    find(move_id, "ul").style.display = "none";
                }
                else {
                    MOVE_ITEM_ID = false;
                }
            }
            else {
                MOVE_ITEM_ID = false;
            }
        },
        error: function() {
            alert('Got an error');
        }
    });
}

function find(item_id, item_type) {
    return document.getElementById(`${item_id}_${item_type}`);
}
