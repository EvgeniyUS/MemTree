window.onload = function() {
    loadMainTree();
}

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

function nodeOpenToggler(node) {
    node.addEventListener("click", function() {
      this.parentElement.querySelector(".nested").classList.toggle("active");
      this.classList.toggle("caret-down");
    });
}

function openNode(node) {
    node.addEventListener("click", function() {
        this.parentNode.childNodes[0].classList.toggle("caret-down", true);
        this.parentNode.childNodes[4].classList.toggle("active", true);
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
            'name': inputNode.value,
            'parent': null
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

    var span = document.createElement('span');
    span.className = "caret";
    span.style.display = "none";
    nodeOpenToggler(span);
    root.appendChild(span);

    var inp = document.createElement('input');
    if (value['name']) {
        setAttributes(inp, {"placeholder": "Наименование", "oninput": "nameChanged(this)", "value": value['name']});
    }
    else {
        //setAttributes(inp, {"placeholder": "Наименование", "oninput": "nameChanged(this)"});
        setAttributes(inp, {"oninput": "nameChanged(this)"});
    }
    root.setAttribute('id', value['id']);
    root.id = value['id'];
    root.appendChild(inp);

    //var crBtn = document.createElement('img');
    //setAttributes(crBtn, {"onclick": "addNewEle(this.parentNode.id)", "src": "static/gorynych/img/Create.png"});
    var crBtn = document.createElement('button');
    setAttributes(crBtn, {"class": "crBtn", "onclick": "addNewEle(this.parentNode.id)"});
    crBtn.innerHTML = "+";
    openNode(crBtn);
    root.appendChild(crBtn);

    //var rmBtn = document.createElement('img');
    //setAttributes(rmBtn, {"onclick": "rmFunc(this.parentNode)", "src": "static/gorynych/img/Delete.png"});
    var rmBtn = document.createElement('button');
    setAttributes(rmBtn, {"class": "rmBtn", "onclick": "rmFunc(this.parentNode)"});
    rmBtn.innerHTML = "-";
    root.appendChild(rmBtn);
    
    var ul = document.createElement('ul');
    ul.className = "nested";
    root.appendChild(ul);

    if (value['parent']) {
        ele = document.getElementById(value['parent']).childNodes[4]
        parSpan = document.getElementById(value['parent']).childNodes[0]
        parSpan.style.display = 'inline-block';
        ele.appendChild(root);
    }
    else {
        ele = document.getElementById("myUL")
        ele.appendChild(root);
    }
    if (inp.value == false) {
        inp.focus()
    }

}

function loadMainTree() {
    for (var i = 0; i < mainTreeData.length; i++) {
        addEle(mainTreeData[i]);
    }
}

