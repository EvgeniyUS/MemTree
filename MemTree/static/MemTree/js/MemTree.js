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

var insert_button = document.createElement('button');
setAttributes(insert_button, {
    "class": "insert_button",
    "title": "Добавить/Вставить",
});
insert_button.innerHTML = "&#8853;";
addItemButtonEvent(insert_button);

var move_button = document.createElement('button');
setAttributes(move_button, {
    "class": "move_button",
    "onclick": "refresh(this.parentNode.parentNode.id)",
    "title": "Вырезать",
});
move_button.innerHTML = "&#8854;";

var remove_button = document.createElement('button');
setAttributes(remove_button, {
    "class": "remove_button",
    "onclick": "rmFunc(this.parentNode.parentNode)",
    "title": "Удалить",
});
remove_button.innerHTML = "&#8855;";

var edit_button = document.createElement('button');
setAttributes(edit_button, {
    "class": "edit_button",
    "onclick": "editFunc(this.parentNode.parentNode.id)",
    "title": "Редактировать"
});
edit_button.innerHTML = "&#8857;";

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
        if (node.parent) {
            var parent_ul = find(node.parent, "ul");
            if (parent_ul.childNodes.length < 2) {
                var span = find(node.parent, "span");
                span.collapsed = true;
                collapseChanged(span);
            }
        }
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
        // $(inp).attr('size', $(inp).val().length);
        var value_rows = $(inp).val().split('\n');

        $(inp).attr('rows', value_rows.length);

        var lgth = 1;
        var longest;

        for(var i=0; i < value_rows.length; i++){
            if(value_rows[i].length > lgth){
                lgth = value_rows[i].length;
                longest = value_rows[i];
            }
        }

        $(inp).attr('cols', lgth);

        // if (value_rows.length == 1) {
        //     inp.style.textAlign = 'center';
        //     inp.style.paddingLeft = '0';
        // }
        // else {
        //     inp.style.paddingLeft = '5px';
        //     inp.style.textAlign = 'left';
        // }

    } else {
        // $(inp).attr('size', 1);
        $(inp).attr('cols', 1);
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
                // ITEM_COUNT = ITEM_COUNT + 1;
                // description();
                itemBuilder(json, true);
            },
            error: function () {
                alert('Got an error');
            }
        });
    }
}

function inputMouseOver(item_id) {
    var button_container = find(item_id, "button_container");
    button_container.appendChild(insert_button);
    button_container.appendChild(edit_button);
    button_container.appendChild(move_button);
    button_container.appendChild(remove_button);
    insert_button.style.display = "inline-block";
    // edit_button.style.display = "inline-block";
    move_button.style.display = "inline-block";
    remove_button.style.display = "inline-block";

    // что бы не вставить себя в себя
    if (MOVE_ITEM_ID == item_id) {
        insert_button.style.display = "none";
    }

    var input = find(item_id, "input");

    // при вырезании или если значение инпута начинается с "_" скрываем кнопку remove
    // (при удалении элемента обновляется все дерево и сбрасывается вырезание)
    if (MOVE_ITEM_ID != false || input.value.charAt(0) == '_') {
        remove_button.style.display = "none";
    }

    // если значение инпута начинается с "_" скрываем кнопку move
    if (input.value.charAt(0) == '_') {
        move_button.style.display = "none";
    }
}

function itemBuilder(item, focus=false) {
    var root = document.createElement('li');
    root.parent = item['parent'];
    root.setAttribute('id', item['id']);

    var span = document.createElement('span');
    span.setAttribute('id', `${item['id']}_span`);
    span.collapsed = item['collapsed'];
    span.style.display = "none";
    spanToggler(span);

    // var checkbox = document.createElement('input');
    // checkbox.type = "checkbox";

    var input = document.createElement('textarea');
    setAttributes(input, {
        "id": `${item['id']}_input`,
        "rows": 1,
        "wrap": "off",
        "oninput": "nameChanged(this)",
        "onmouseover": "inputMouseOver(this.parentNode.id)",
        "readOnly": "true",
        // "ondblclick": "this.readOnly=false",
        "onfocusout": "this.readOnly=true"
    });
    if (item['name']) {
        input.value = item['name'];
        if (item['name'].charAt(0) == '_') {
            input.style.color = "rgba(255, 255, 100, 0.8)";
            input.style.fontWeight = "bold";
        }
    }
    inputWidthChanger(input);

    var button_container = document.createElement('sup');
    button_container.setAttribute("id", `${item['id']}_button_container`);
    button_container.className = "button_container";

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

    var counter = document.createElement('sup');
    setAttributes(counter, {
        "id": `${item['id']}_counter`,
        "class": "counter",
    });

    // var append_button = document.createElement('button');
    // setAttributes(append_button, {
    //     "id": `${item['id']}_append_button`,
    //     "class": "append_button",
    //     "title": `Добавить/Вставить в "${input.value}"`,
    // });
    // append_button.innerHTML = "+";
    // addItemButtonEvent(append_button);
    // ul.appendChild(append_button);


    root.appendChild(span);
    // root.appendChild(checkbox);
    root.appendChild(input);
    root.appendChild(counter);
    root.appendChild(button_container);
    root.appendChild(ul);

    if (item['parent']) {
        var parent_ul = find(item['parent'], "ul");

        var parent_span = find(item['parent'], "span");
        parent_span.style.display = 'inline-block';

        var parent_input = find(item['parent'], "input");
        // parent_input.style.background = "rgba(255, 255, 255, 0.05)";
        parent_input.style.marginLeft = '15px';

        parent_ul.appendChild(root);

        var parent_counter = find(item['parent'], "counter");
        parent_counter.innerHTML = ` ${parent_ul.childNodes.length}`;

        // var parent_append_button = find(item['parent'], "append_button");
        // parent_ul.appendChild(parent_append_button);
    }
    else {
        var meta_root = document.getElementById("myUL");
        meta_root.appendChild(root);
    }

    if (input.value == false && focus) {
        input.readOnly = false;
        input.focus();
    }
}

// function description() {
//     document.getElementById('Desc').innerText = `Items count: ${ITEM_COUNT}`;
// }

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
            // ITEM_COUNT = items.length;
            // description();
            document.getElementById("myUL").innerHTML = "";
            for (var i = 0; i < items.length; i++) {
                itemBuilder(items[i]);
            }
            if (move_id) {
                if (move_id != MOVE_ITEM_ID) {
                    MOVE_ITEM_ID = move_id;
                    find(move_id, "span").style.display = "none";
                    find(move_id, "input").style.border = "1px solid rgba( 255, 211, 0, 0.4 )";
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
