
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
    addEle(node.parentNode.childNodes[4]);
    //alert (node.parentNode.childNodes[4].nodeName);
}

function rmFunc(node) {
    if (node.parentNode.parentNode) {
      node.parentNode.parentNode.removeChild(node.parentNode);
    }
}

function addEle(ele = document.getElementById("myUL")) {
    //var treeWidget = document.getElementById("myUL");
    var root = document.createElement('li');
    var span = document.createElement('span');
    var inp = document.createElement('input');
    var childs = document.createElement('ul');
    var crBtn = document.createElement('button');
    var rmBtn = document.createElement('button');
    inp.setAttribute("placeholder", "Наименование");
    span.className = "caret";
    nodeOpenToggler(span);
    crBtn.innerHTML = '+'
    rmBtn.innerHTML = '-'
    crBtn.setAttribute("onclick", "crFunc(this)");
    openNode(crBtn);
    rmBtn.setAttribute("onclick", "rmFunc(this)");
    childs.className = "nested";
    ele.appendChild(root);
    root.appendChild(span);
    root.appendChild(inp);
    root.appendChild(crBtn);
    root.appendChild(rmBtn);
    root.appendChild(childs);
}

//var toggler = document.getElementsByClassName("caret");
//console.log(toggler);
//var i;
//
//for (i = 0; i < toggler.length; i++) {
//    nodeOpenToggler(toggler[i]);
//}

