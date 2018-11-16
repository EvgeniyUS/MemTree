window.onload = function() {
    loadMainTree();
}

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
    //alert (node.parentNode.childNodes[1].value);
    addEle(false, node.parentNode.childNodes[4]);
    //alert (node.parentNode.childNodes[4].nodeName);
}

function rmFunc(node) {
    if (node.parentNode.parentNode) {
      node.parentNode.parentNode.removeChild(node.parentNode);
    }
}

function setAttributes(el, attrs) {
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}

function nameChanged(inputNode) {
    $.ajax({
        url: '127.0.0.1:8000/gorynych/',
        type: 'post',
        data: {
            'id': inputNode.parentNode.id,
            'name': inputNode.value,
            'parent': null
        },
        dataType: 'json',
        success: function (data) {
            alert("Ajax works!");
        },
        failure: function(data) { 
            alert('Got an error dude');
        }
    });
    //alert (inputNode.parentNode.id);
    //alert (inputNode.parentNode.id, inputNode.value);
}

function addEle(value = false, ele = document.getElementById("myUL")) {
    var root = document.createElement('li');

    var span = document.createElement('span');
    span.className = "caret";
    nodeOpenToggler(span);
    root.appendChild(span);

    var inp = document.createElement('input');
    if (value) {
        setAttributes(inp, {"placeholder": "Наименование", "oninput": "nameChanged(this)", "value": value['name']});
        root.setAttribute('id', value['id']);
        root.id = value['id'];
    }
    else {
        setAttributes(inp, {"placeholder": "Наименование", "oninput": "nameChanged(this)"});
    }
    root.appendChild(inp);

    var crBtn = document.createElement('button');
    crBtn.innerHTML = "<img src='static/gorynych/img/Create.png'/>";
    //crBtn.setAttribute("onclick", "crFunc(this)");
    setAttributes(crBtn, {"onclick": "crFunc(this)", "style": "background-color:transparent; border-color:transparent;"});
    openNode(crBtn);
    root.appendChild(crBtn);

    var rmBtn = document.createElement('button');
    rmBtn.innerHTML = "<img src='static/gorynych/img/Delete.png'/>";
    //rmBtn.setAttribute("onclick", "rmFunc(this)");
    setAttributes(rmBtn, {"onclick": "rmFunc(this)", "style": "background-color:transparent; border-color:transparent;"});
    root.appendChild(rmBtn);
    
    var childs = document.createElement('ul');
    childs.className = "nested";
    root.appendChild(childs);

    //if (value['parent']) {
    //    
    //    
    //}
    ele.appendChild(root);

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


