const API_BASE_URL = 'https://wedding-backend-wqaz.onrender.com/api';
const headers = {
    "x-admin-password":"cambia-esto-ya"
}
const usersListEl = document.querySelector('#users-list');
const statusEl = document.querySelector('#status');
const newUserBtn = document.querySelector('#new-user-btn');
const dialogEl = document.querySelector('#info-dialog');
const dialogTitleEl = document.querySelector('#dialog-title');
const dialogContentEl = document.querySelector('#dialog-content');
const dialogCloseBtn = document.querySelector('#dialog-close-btn');
const searchInpt = document.querySelector("#search > input#search-input");
const confirmCheckbox = document.querySelector("#asistentes-checkbox")

let users = [];
let filterusers = [];

function setStatus(message) {

  statusEl.textContent = message;
  setTimeout(()=>{
    statusEl.textContent = "";
  },5000);

}

function showDialog(title, content) {
  dialogTitleEl.textContent = title;
  dialogContentEl.textContent = content;

  if (typeof dialogEl.showModal === 'function') {
    dialogEl.showModal();
    return;
  }

  alert(`${title}\n\n${content}`);
}

async function fetchJson() {
  const response = await fetch(`${API_BASE_URL}/users/?includeInvitation=true`,{
    method:"GET",
    headers
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar ${path}`);
  }

  return await response.json();
}

async function fetchUserList(){
    const list = await fetchJson(); 
    users.push(...list.users);
}

async function deleteUser(user) {

  try{
    const res = await fetch(`${API_BASE_URL}/users/${user.id}`,{
        method:"DELETE",
        headers:Object.assign(headers,{"Content-Type":"application/json"})
    }).then(r=>r.json());
    users = users.filter((u) => u.id !== user.id);
    setStatus("Invitado eliminado");
  }catch(e){
    showDialog("Error", `Error al eliminar al invitado ${user.name} ${user.lastname}`) 
  }
  renderUsers();
}

async function createNewUser() {
  const fullname = prompt('Nombre del nuevo invitado:');

  if (!fullname || !fullname.trim()) {
    return;
  }

  const [name,lastname] = fullname.split(/ (.*)/i);

  try{
    const res = await fetch(`${API_BASE_URL}/users`,{
        method:"POST",
        headers:Object.assign(headers, {"Content-Type":"application/json"}),
        body:JSON.stringify({
            name,
            lastname
        })
    }).then(r=>r.json());    
    users = [...users, res];
    filterusers = [...filterusers,res]
  }catch(e){
    showDialog("Error", "Error al agregar al invitado");
    throw e;
  }

  renderUsers();
  setStatus('Invitado agregado localmente.');
}

async function showInvitationUrl(user) {
  showDialog(`URL de ${user.name}`, user.invitation.url || 'Sin URL disponible');
}

async function showConfirmationMessage(user) {
    let res;
    try{
        res = await fetch(`${API_BASE_URL}/users/${user.id}`,{
            method:"GET",
            headers
        }).then(r=>r.json())
    }catch(e){
        showDialog("Error", "Error al solicitar el mensaje");
        throw e;
    }
    showDialog(`Mensaje de ${user.name}`, res.invitation.message || 'Sin mensaje');
}

function createUserItem(user) {
  const itemEl = document.createElement('li');
  itemEl.className = 'user-item';

  const nameEl = document.createElement('strong');
  nameEl.textContent = user.name + " " + user.lastname;

  const actionsEl = document.createElement('div');
  actionsEl.className = 'user-actions';

  const confirmStatus = document.createElement("span");
  confirmStatus.classList.add("status");
  confirmStatus.textContent = "PENDIENTE";

  if(user.invitation.confirm == true){
    confirmStatus.textContent = "SI ASITIRÁ";
    confirmStatus.classList.add("asist")
    confirmStatus.classList.remove("notasist")
  }else if(user.invitation.confirm == false){
    confirmStatus.textContent = "NO ASISTIRÁ";
    confirmStatus.classList.remove("asist");
    confirmStatus.classList.add("notasist");
  }


  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.textContent = 'Borrar';
  deleteBtn.addEventListener('click', () => deleteUser(user));

  const urlBtn = document.createElement('button');
  urlBtn.type = 'button';
  urlBtn.textContent = 'Url';
  urlBtn.addEventListener('click', () => showInvitationUrl(user));

  const messageBtn = document.createElement('button');
  messageBtn.type = 'button';
  messageBtn.textContent = 'Mensaje';
  messageBtn.addEventListener('click', () => showConfirmationMessage(user));

  actionsEl.append(confirmStatus, deleteBtn, urlBtn, messageBtn);
  itemEl.append(nameEl, actionsEl);

  return itemEl;
}

function filterUsers(){
    const search = searchInpt.value.toUpperCase();
    const filters = [];
    for(const user of users){
        const needAsistand = confirmCheckbox.checked;
        const isMatch = (user.name+" "+user.lastname).toUpperCase().match(search)
        if(needAsistand && !user.invitation.confirm)continue;
        if(isMatch)filters.push(user);
    }
    return filters;
}

function renderUsers() {
  usersListEl.replaceChildren();
  const filter = filterUsers();
  if (filter.length === 0) {
    const emptyEl = document.createElement('li');
    emptyEl.textContent = 'No hay usuarios invitados.';
    usersListEl.append(emptyEl);
    return;
  }

  filter.forEach((user) => {
    usersListEl.append(createUserItem(user));
  });

}

async function main(){
    await fetchUserList();

    searchInpt.onchange = ()=>renderUsers();
    
    confirmCheckbox.onchange = ()=>renderUsers();

    renderUsers();
}

newUserBtn.addEventListener('click', createNewUser);
dialogCloseBtn.addEventListener('click', () => dialogEl.close());

main();
