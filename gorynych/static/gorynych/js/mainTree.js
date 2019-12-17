window.onload = function() {
    loadMainTree();
};

var csrftoken = $.cookie('csrftoken');
var item_count = 0;
var crBtnToShow = false;
var rmBtnToShow = false;

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
        var ul = this.parentNode.childNodes[4];
        ul.classList.toggle("active", true);
        collapseChanged(span);
    });
}

function rmFunc(node) {
    $.ajax({
        type: 'POST',
        url: '/gorynych/',
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
        url: '/gorynych/',
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
        url: '/gorynych/',
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
    $.ajax({
        type: 'POST',
        url: '/gorynych/',
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
        error: function() { 
            alert('Got an error');
        }
    });
}

function onFocus(inp) {
    hideButtons()
    crBtnToShow = inp.parentNode.childNodes[2];
    rmBtnToShow = inp.parentNode.childNodes[3];
    showButtons()
}

function showButtons() {
    crBtnToShow.style.display = "inline-block";
    rmBtnToShow.style.display = "inline-block";
}

function hideButtons() {
    if (crBtnToShow && rmBtnToShow) {
        crBtnToShow.style.display = "none";
        rmBtnToShow.style.display = "none";
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
    root.appendChild(crBtn);

    var rmBtn = document.createElement('button');
    setAttributes(rmBtn, {"class": "rmBtn", "onclick": "rmFunc(this.parentNode)"});
    rmBtn.innerHTML = "-";
    rmBtn.style.display = "none";
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
        var ele = document.getElementById(value['parent']).childNodes[4];
        var parSpan = document.getElementById(value['parent']).childNodes[0];
        parSpan.style.display = 'inline-block';
        var parInput = document.getElementById(value['parent']).childNodes[1];
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

function refresh() {
    $.ajax({
        type: 'GET',
        url: '/gorynych/',
        dataType: 'json',
        data: {
            'type': 'all'
        },
        success: function(json) {
            var items = json['data'];
            item_count = items.length;
            description();
            document.getElementById("myUL").innerHTML = "";
            for (var i = 0; i < items.length; i++) {
                addEle(items[i]);
            }
        },
        error: function() {
            alert('Got an error');
        }
    });
}

function loadMainTree() {
    item_count = mainTreeData.length;
    description();
    for (var i = 0; i < mainTreeData.length; i++) {
        addEle(mainTreeData[i]);
    }
}