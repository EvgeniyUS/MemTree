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

function crFunc(node) {
    //alert (node.parentNode.childNodes[4]);
    //addEle(false, node.parentNode.childNodes[4]);
    addNewEle(node.parentNode.id);
    //alert (node.parentNode.childNodes[4].nodeName);
}

function rmFunc(node) {
    $.ajax({
        type: 'POST',
        url: '/gorynych/',
        dataType: 'json',
        data: {
            'type': 'delete',
            'id': node.parentNode.id,
            'name': null,
            'parent': null
        },
        //success: function () {
        //    alert("Ajax works!");
        //},
        //failure: function() { 
        //    alert('Got an error dude');
        //}
    });
    node.parentNode.parentNode.removeChild(node.parentNode);
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
        //success: function () {
        //    alert("Ajax works!");
        //},
        //failure: function() { 
        //    alert('Got an error dude');
        //}
    });
    //alert (inputNode.parentNode.id);
    //alert (inputNode.parentNode.id, inputNode.value);
}

function addNewEle(parentId=null) {
    $.ajax({
        type: 'POST',
        url: '/gorynych/',
        dataType: 'json',
        //async: false,
        data: {
            'type': 'create',
            'id': null,
            'name': null,
            'parent': parentId
        },
        success: function (json) {
            var value = {'id': json['id']};
            if (parentId) {
                addEle(value, document.getElementById(parentId).childNodes[4]);
            }
            else {
                addEle(value);
            }
        },
        error: function() { 
            alert('Got an error');
        }
    });
}

function addEle(value, ele = document.getElementById("myUL")) {
    var root = document.createElement('li');

    var span = document.createElement('span');
    span.className = "caret";
    nodeOpenToggler(span);
    root.appendChild(span);

    var inp = document.createElement('input');
    setAttributes(inp, {"placeholder": "Наименование", "oninput": "nameChanged(this)", "value": value['name']});
    root.setAttribute('id', value['id']);
    root.id = value['id'];
    root.appendChild(inp);

    var crBtn = document.createElement('img');
    setAttributes(crBtn, {"onclick": "crFunc(this)", "src": "static/gorynych/img/Create.png"});
    openNode(crBtn);
    root.appendChild(crBtn);

    var rmBtn = document.createElement('img');
    setAttributes(rmBtn, {"onclick": "rmFunc(this)", "src": "static/gorynych/img/Delete.png"});
    root.appendChild(rmBtn);
    
    var ul = document.createElement('ul');
    ul.className = "nested";
    root.appendChild(ul);

    if (value['parent']) {
        ele = document.getElementById(value['parent']).childNodes[4]
        ele.appendChild(root);
    }
    else {
        ele.appendChild(root);
    }

}

function loadMainTree() {
    for (var i = 0; i < mainTreeData.length; i++) {
        addEle(mainTreeData[i]);
    }
}


//var toggler = document.getElementsByClassName("caret");
//console.log(toggler);
//var i;
//
//for (i = 0; i < toggler.length; i++) {
//    nodeOpenToggler(toggler[i]);
//}


