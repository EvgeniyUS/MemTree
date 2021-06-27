// var ITEM_COUNT = 0;
var MOVE_ITEM_ID = false;
var SELECTED_ITEM_ID = false;

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

function rmFunc(node) {
    var result = true;
    var li = document.getElementById(SELECTED_ITEM_ID);
    var ul = find(SELECTED_ITEM_ID, "ul");
    if (ul.childNodes.length > 0) {
        var value = find(li.id, "input").value;
        result = confirm(`Удалить "${value}"?`);
    }
    if (result) {
        if (li.parent) {
            var parent_ul = find(li.parent, "ul");
            if (parent_ul.childNodes.length < 2) {
                var span = find(li.parent, "span");
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
                'id': li.id
            },
            success: function (json) {
                refresh();
            },
        });
    }
}

function editFunc(item_id) {
    var item_input = find(SELECTED_ITEM_ID, "input");
    if (item_input) {
        item_input.readOnly = false;
        item_input.focus();
    }
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

    } else {
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
                'parent': SELECTED_ITEM_ID
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
                'parent': SELECTED_ITEM_ID
            },
            success: function (json) {
                // ITEM_COUNT = ITEM_COUNT + 1;
                // description();
                var span = find(SELECTED_ITEM_ID, "span");
                if (span) {
                    span.collapsed = false;
                    span.classList.toggle("caret-down", true);
                    var ul = find(SELECTED_ITEM_ID, "ul");
                    ul.classList.toggle("active", true);
                    collapseChanged(span);
                }
                itemBuilder(json, true);
            },
            error: function () {
                alert('Got an error');
            }
        });
    }
}

function inputMouseOver(item_id) {
    SELECTED_ITEM_ID = item_id

    var create_button = document.getElementById("create_button");
    create_button.disabled = false;

    var remove_button = document.getElementById("remove_button");
    remove_button.disabled = false;

    document.getElementById("edit_button").disabled  = false;
    document.getElementById("move_button").disabled  = false;


    // что бы не вставить себя в себя
    if (MOVE_ITEM_ID == item_id) {
        create_button.disabled = true;
    }

    var input = find(item_id, "input");

    // при вырезании или если значение инпута начинается с "_" скрываем кнопку remove
    // (при удалении элемента обновляется все дерево и сбрасывается вырезание)
    if (MOVE_ITEM_ID != false || input.value.charAt(0) == '_') {
        remove_button.disabled = true;
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
        // "onmouseover": "inputMouseOver(this.parentNode.id)",
        "onfocus": "inputMouseOver(this.parentNode.id)",
        "readOnly": "true",
        "onfocusout": "this.readOnly=true",
    });
    if (item['name']) {
        input.value = item['name'];
        if (item['name'].charAt(0) == '_') {
            input.style.color = "rgba(255, 255, 100, 0.8)";
            input.style.fontWeight = "bold";
        }
    }
    inputWidthChanger(input);

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

    root.appendChild(span);
    // root.appendChild(checkbox);
    root.appendChild(input);
    root.appendChild(counter);
    root.appendChild(ul);

    if (item['parent']) {
        var parent_ul = find(item['parent'], "ul");

        var parent_span = find(item['parent'], "span");
        parent_span.style.display = 'inline-block';

        var parent_input = find(item['parent'], "input");
        parent_input.style.marginLeft = '15px';

        parent_ul.appendChild(root);

        var parent_counter = find(item['parent'], "counter");
        parent_counter.innerHTML = ` ${parent_ul.childNodes.length}`;
    }
    else {
        var meta_root = document.getElementById("myUL");
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

function move() {
    MOVE_ITEM_ID = SELECTED_ITEM_ID;
    find(SELECTED_ITEM_ID, "span").style.display = "none";
    find(SELECTED_ITEM_ID, "input").style.border = "1px solid rgba( 255, 211, 0, 0.4 )";
    find(SELECTED_ITEM_ID, "ul").style.display = "none";
    SELECTED_ITEM_ID = false;
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
            // ITEM_COUNT = items.length;
            // description();
            document.getElementById("myUL").innerHTML = "";
            for (var i = 0; i < items.length; i++) {
                itemBuilder(items[i]);
            }
            MOVE_ITEM_ID = false;
            SELECTED_ITEM_ID = false;

            document.getElementById("create_button").disabled  = false;
            document.getElementById("edit_button").disabled  = true;
            document.getElementById("remove_button").disabled  = true;
            document.getElementById("move_button").disabled  = true;
            document.getElementById("remove_button").disabled  = true;

        },
        error: function() {
            alert('Got an error');
        }
    });
}

function find(item_id, item_type) {
    return document.getElementById(`${item_id}_${item_type}`);
}
