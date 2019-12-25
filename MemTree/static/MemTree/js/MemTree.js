// var csrftoken = $.cookie('csrftoken');
var item_count = 0;
var crBtnToShow = false;
var moveBtnToShow = false;
var rmBtnToShow = false;
var moveId = false;

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

function nodeOpenToggler(span) {
    span.addEventListener("click", function() {
        if (this.collapsed) {
            this.collapsed = false;
        }
        else {
            this.collapsed = true;
        }
        collapseChanged(span);
        this.parentElement.querySelector(".nested").classList.toggle("active");
        this.classList.toggle("caret-down");
    });
}

function openNode(button) {
    button.addEventListener("click", function() {
        var span = this.parentNode.childNodes[0];
        span.collapsed = false;
        span.classList.toggle("caret-down", true);
        var ul = this.parentNode.childNodes[5];
        ul.classList.toggle("active", true);
        collapseChanged(span);
    });
}

function rmFunc(node) {
    $.ajax({
        type: 'POST',
        url: '/memtree/',
        dataType: 'json',
        data: {
            'type': 'delete',
            'id': node.id,
            'name': null,
            'parent': null
        },
        success: function (json) {
            refresh();
        },
    });
}

function setAttributes(el, attrs) {
    for(var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

function nameChanged(inputNode) {
    $.ajax({
        type: 'POST',
        url: '/memtree/',
        dataType: 'json',
        data: {
            'type': 'update',
            'id': inputNode.parentNode.id,
            'collapsed': inputNode.parentNode.childNodes[0].collapsed,
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
            'type': 'update',
            'id': span.parentNode.id,
            'collapsed': span.collapsed,
            'name': span.parentNode.childNodes[1].value
        },
    });
}

function addNewEle(parentId=null) {
    if (moveId) {
        $.ajax({
            type: 'POST',
            url: '/memtree/',
            dataType: 'json',
            data: {
                'type': 'update',
                'id': moveId,
                'parent': parentId
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
                'id': null,
                'name': null,
                'parent': parentId
            },
            success: function (json) {
                item_count = item_count + 1;
                description();
                addEle(json, true);
            },
            error: function () {
                alert('Got an error');
            }
        });
    }
}

function onFocus(inp) {
    hideButtons();
    crBtnToShow = inp.parentNode.childNodes[2];
    moveBtnToShow = inp.parentNode.childNodes[3];
    rmBtnToShow = inp.parentNode.childNodes[4];
    showButtons();
}

function showButtons() {
    if (moveId != crBtnToShow.parentNode.id) {
        crBtnToShow.style.display = "inline-block";
    }
    if (moveId == false) {
        rmBtnToShow.style.display = "inline-block";
    }
    moveBtnToShow.style.display = "inline-block";
}

function hideButtons() {
    if (crBtnToShow && rmBtnToShow) {
        crBtnToShow.style.display = "none";
        rmBtnToShow.style.display = "none";
        moveBtnToShow.style.display = "none";
    }
}

function addEle(value, focus=false) {
    var root = document.createElement('li');
    root.setAttribute('id', value['id']);
    root.id = value['id'];

    var span = document.createElement('span');
    span.collapsed = value['collapsed'];
    span.style.display = "none";
    nodeOpenToggler(span);
    root.appendChild(span);

    var inp = document.createElement('input');
    inp.style.background = "#F5F5F5";
    if (value['name']) {
        setAttributes(inp, {
            "oninput": "nameChanged(this)",
            "onfocus": "onFocus(this)",
            "value": value['name']});
    }
    else {
        setAttributes(inp, {
            "oninput": "nameChanged(this)",
            "onfocus": "onFocus(this)",
        });
    }
    inputWidthChanger(inp);
    root.appendChild(inp);

    var crBtn = document.createElement('button');
    setAttributes(crBtn, {"class": "crBtn", "onclick": "addNewEle(this.parentNode.id)"});
    crBtn.innerHTML = "+";
    openNode(crBtn);
    crBtn.style.display = "none";
    crBtn.title = "Добавить/вставить";
    root.appendChild(crBtn);

    var moveBtn = document.createElement('button');
    setAttributes(moveBtn, {"class": "moveBtn", "onclick": "refresh(this.parentNode.id)"});
    moveBtn.innerHTML = ">";
    moveBtn.style.display = "none";
    moveBtn.title = "Переместить";
    root.appendChild(moveBtn);

    var rmBtn = document.createElement('button');
    setAttributes(rmBtn, {"class": "rmBtn", "onclick": "rmFunc(this.parentNode)"});
    rmBtn.innerHTML = "x";
    rmBtn.style.display = "none";
    rmBtn.title = "Удалить";
    root.appendChild(rmBtn);

    var ul = document.createElement('ul');
    if (span.collapsed) {
        span.className = "caret";
        ul.className = "nested";
    }
    else {
        span.className = "caret caret-down";
        ul.className = "nested active";
    }
    root.appendChild(ul);

    if (value['parent']) {
        var parEle = document.getElementById(value['parent']);
        var ele = parEle.childNodes[5];
        var parSpan = parEle.childNodes[0];
        parSpan.style.display = 'inline-block';
        var parInput = parEle.childNodes[1];
        parInput.style.background = "#FFF3CC";
    }
    else {
        var ele = document.getElementById("myUL");
    }
    ele.appendChild(root);

    if (inp.value == false && focus) {
        inp.focus()
    }
}

function description() {
    document.getElementById('Desc').innerText = `Items count: ${item_count}`;
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
            item_count = items.length;
            description();
            document.getElementById("myUL").innerHTML = "";
            for (var i = 0; i < items.length; i++) {
                addEle(items[i]);
            }
            if (move_id) {
                moveId = move_id;
                var item = document.getElementById(move_id);
                item.childNodes[0].style.display = "none";
                item.childNodes[1].style.background = "#FFE4E1";
                item.childNodes[1].disabled = true;
                item.childNodes[5].style.display = "none";
            }
            else {
                moveId = false;
            }
        },
        error: function() {
            alert('Got an error');
        }
    });
}
