window.onload = function() {
    loadMainTree();
};

var csrftoken = $.cookie('csrftoken');

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
    });
    if (node.parentNode.childNodes.length == 1) {
        node.parentNode.parentNode.childNodes[0].collapsed = false;
        node.parentNode.parentNode.childNodes[0].style.display = 'none';
    }
    node.parentNode.removeChild(node);
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
    });
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
            addEle(json);
        },
        error: function() { 
            alert('Got an error');
        }
    });
}

function addEle(value) {
    var root = document.createElement('li');
    root.setAttribute('id', value['id']);
    root.id = value['id'];

    var span = document.createElement('span');
    span.collapsed = value['collapsed'];
    span.style.display = "none";
    nodeOpenToggler(span);
    root.appendChild(span);

    var inp = document.createElement('input');
    if (value['name']) {
        setAttributes(inp, {"oninput": "nameChanged(this)", "value": value['name']});
    }
    else {
        setAttributes(inp, {"oninput": "nameChanged(this)"});
    }
    root.appendChild(inp);

    var crBtn = document.createElement('button');
    setAttributes(crBtn, {"class": "crBtn", "onclick": "addNewEle(this.parentNode.id)"});
    crBtn.innerHTML = "+";
    openNode(crBtn);
    root.appendChild(crBtn);

    var rmBtn = document.createElement('button');
    setAttributes(rmBtn, {"class": "rmBtn", "onclick": "rmFunc(this.parentNode)"});
    rmBtn.innerHTML = "-";
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
    }
    else {
        var ele = document.getElementById("myUL");
    }
    ele.appendChild(root);

    if (inp.value == false) {
        inp.focus()
    }
}

function description(items) {
    var desc = document.getElementById('Desc');
    desc.innerText = `Items count: ${items.length}`
}

function loadMainTree() {
    description(mainTreeData);
    for (var i = 0; i < mainTreeData.length; i++) {
        addEle(mainTreeData[i]);
    }
}

