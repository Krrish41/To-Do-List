const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");

function addTask(){
    if(inputBox.value === ''){
        alert("You must write something!");
    }
    else{
        let li = document.createElement("li");
        li.innerHTML = inputBox.value;
        listContainer.appendChild(li);

        //for edit
        let editSpan = document.createElement("span");
        editSpan.className = "edit-btn";
        editSpan.innerHTML = "<img src='./images/edit.png' alt='Edit Icon' class='editIco'>";
        li.appendChild(editSpan);

        //for delete
        let deleteSpan = document.createElement("span");
        deleteSpan.className = "delete-btn";
        deleteSpan.innerHTML = "\u00d7";
        li.appendChild(deleteSpan);
    }
    inputBox.value = "";
    saveData();
}

listContainer.addEventListener("click", function(e){
    if(e.target.tagName === "LI"){
        e.target.classList.toggle("checked");
        saveData();
    }
    else if(e.target.classList.contains("delete-btn")){
        e.target.parentElement.remove();
        saveData();
    }
    else if(e.target.classList.contains("editIco")){
        let li = e.target.closest("li");
        let newText = prompt("Edit your task:", li.firstChild.textContent);
        
        if (newText !== null && newText !== "") {
            li.firstChild.textContent = newText;
            saveData();
        }
    }
}, false);

//save data in local storage
function saveData(){
    localStorage.setItem("data", listContainer.innerHTML);
}

//loads data
function showTask(){
    listContainer.innerHTML = localStorage.getItem("data");
}
showTask();