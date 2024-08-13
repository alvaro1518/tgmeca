import { savePreinscripcion, getAllPreinscripciones, onGetPreinscripciones, deletePreinscripcion, getPreinscripcion, updatePreinscripcion, observeAuthState, logoutUser } from './firebase.js';

const projectForm = document.getElementById('project-form');
const projectsContainer = document.getElementById('projects-container');
const logoutButton = document.getElementById('logout-button');

let editStatus = false;
let id = '';

observeAuthState(user => {
  if (!user) {
    window.location.href = 'login.html';
  }
});


window.addEventListener('DOMContentLoaded', async () => {
  observeAuthState(user => {
    if (user) {
      onGetPreinscripciones((querySnapshot) => {
        let html = '';

        querySnapshot.forEach((doc) => {
          const preinscripcion = doc.data();
          if (preinscripcion.userId === user.uid) {  // Solo mostrar preinscripciones del usuario actual
            
            html += `
              <div class="card mt-3" style="background-color: #417e8d; border-radius: 35px;">
                <div class="card-body">
                  <h5 class="card-title" style="color: white;">Título: ${preinscripcion.title}</h5>
                  <p class="card-text" style="color: white;">Descripción del Proyecto: ${preinscripcion.description}</p>
                  <p class="card-text" >Semestre: ${preinscripcion.semester}</p>
                  <p class="card-text">Tipo: ${preinscripcion.type}</p>
                  ${preinscripcion.isAccepted ? `
                    <button class="btn btn-secondary" disabled>Aceptado</button>
                  ` : `
                    <button class="btn btn-primary btn-edit" data-id="${doc.id}">Editar</button>
                  `}
                  <button class="btn btn-danger btn-delete" data-id="${doc.id}">Eliminar</button>
                </div>
              </div>
            `;
          }
        });

        projectsContainer.innerHTML = html;

        const btnsDelete = projectsContainer.querySelectorAll('.btn-delete');
        btnsDelete.forEach((btn) => {
          btn.addEventListener('click', ({ target: { dataset } }) => {
            deletePreinscripcion(dataset.id);
          });
        });

        const btnsEdit = projectsContainer.querySelectorAll('.btn-edit');
        btnsEdit.forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            const doc = await getPreinscripcion(e.target.dataset.id);
            const preinscripcion = doc.data();

            projectForm['semester'].value = preinscripcion.semester;
            projectForm['title'].value = preinscripcion.title;
            projectForm['description'].value = preinscripcion.description;
            projectForm['type'].value = preinscripcion.type;

            editStatus = true;
            id = e.target.dataset.id;
            projectForm['btn-project-save'].innerText = 'Actualizar';
          });
        });
      });
    } else {
      window.location.href = '/login';
    }
  });
});

logoutButton.addEventListener('click', async () => {
  try {
    await logoutUser();
    window.location.href = '/login';
    history.pushState(null, null, '/login');
    window.addEventListener('popstate', function() {
      window.location.href = '/login';
    });
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
  }
});

projectForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const semester = projectForm['semester'].value.trim();
  const title = projectForm['title'].value.trim();
  const description = projectForm['description'].value.trim();
  const type = projectForm['type'].value;

  if (semester === '' || title === '' || description === '' || type === '') {
    alert('Por favor, llena todos los campos.');
    return;
  }

  observeAuthState(user => {
    if (user) {
      if (!editStatus) {
        savePreinscripcion({ semester, title, description, type, userId: user.uid, isAccepted: false });
      } else {
        updatePreinscripcion(id, { semester, title, description, type });
        editStatus = false;
        projectForm['btn-project-save'].innerText = 'Guardar';
      }
    }
  });

  projectForm.reset();
});
