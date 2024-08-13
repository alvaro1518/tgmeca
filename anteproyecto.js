import { 
  saveAnteproyecto, 
  getAllAnteproyectos, 
  onGetAnteproyectos, 
  deleteAnteproyecto, 
  getAnteproyecto, 
  updateAnteproyecto, 
  observeAuthState, 
  logoutUser, 
  getUserAcceptanceStatus, 
  uploadFileAndGetURL,
  getNotifications, 
  updateNotificationStatus, 
  addObservationToNotification,
  updateStudentAnteproyectoId  // Asegúrate de importar esta función
} from './firebase.js';

const anteproyectoForm = document.getElementById('anteproyecto-form');
const anteproyectosContainer = document.getElementById('file-list');
const logoutButton = document.getElementById('logout-button');

let editStatus = false;
let id = '';

// Observa el estado de autenticación del usuario
observeAuthState(user => {
  if (!user) {
    window.location.href = '/login';
  } else {
    checkPreinscripcionStatus(user.uid);
  }
});


async function checkPreinscripcionStatus(userId) {
  const isAccepted = await getUserAcceptanceStatus(userId);
  if (!isAccepted) {
    alert('Tu preinscripción debe ser aceptada antes de poder acceder al formulario de anteproyecto.');
    window.location.href = 'preinscripcion.html'; // Or redirect to a suitable page
  }
}

// Cargar anteproyectos al inicio
window.addEventListener('DOMContentLoaded', async () => {
  observeAuthState(user => {
    if (user) {
      loadAnteproyectos(user.uid); // Cargar anteproyectos del usuario actual
      loadNotifications(user.uid); // Cargar notificaciones del usuario actual
    } else {
      window.location.href = '/login';
    }
  });
});

// Función para cargar y mostrar anteproyectos
function loadAnteproyectos(userId) {
  onGetAnteproyectos((querySnapshot) => {
    let html = '';

    querySnapshot.forEach((doc) => {
      const anteproyecto = doc.data();
      if (anteproyecto.userId === userId) {  // Mostrar solo los anteproyectos del usuario actual
        html += `
        <div class="card mt-3" style="background-color: #417e8d; border-radius: 35px;">
                <div class="card-body">
          
            <span style="color: white;">Título: ${anteproyecto.title}</span>
            <div>
              <a href="${anteproyecto.wordFileUrl}" download class="btn btn-secondary btn-sm me-2">Descargar</a>
              <button class="btn btn-primary btn-edit" data-id="${doc.id}">Editar</button>
              <button class="btn btn-danger btn-delete" data-id="${doc.id}">Eliminar</button>
            </div>
          </div>
          </div>
        `;
      }
    });

    anteproyectosContainer.innerHTML = html;

    const btnsDelete = anteproyectosContainer.querySelectorAll('.btn-delete');
    btnsDelete.forEach((btn) => {
      btn.addEventListener('click', ({ target: { dataset } }) => {
        deleteAnteproyecto(dataset.id).then(() => {
          anteproyectoForm.reset();
          editStatus = false;
          id = '';
          anteproyectoForm['submit-button'].innerText = 'Guardar';
          loadAnteproyectos(userId); // Recargar la lista de anteproyectos
        });
      });
    });

    const btnsEdit = anteproyectosContainer.querySelectorAll('.btn-edit');
    btnsEdit.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const doc = await getAnteproyecto(e.target.dataset.id);
        const anteproyecto = doc.data();

        anteproyectoForm['title'].value = anteproyecto.title;
        anteproyectoForm['tutor'].value = anteproyecto.tutor;
        anteproyectoForm['generalObjective'].value = anteproyecto.generalObjective;
        anteproyectoForm['specificObjective'].value = anteproyecto.specificObjective;
        anteproyectoForm['summary'].value = anteproyecto.summary;

        editStatus = true;
        id = e.target.dataset.id;
        anteproyectoForm['submit-button'].innerText = 'Actualizar';
      });
    });
  });
}

// Función para cargar y mostrar notificaciones
async function loadNotifications(userId) {
  try {
    const notifications = await getNotifications(userId);
    displayNotifications(notifications);
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

function displayNotifications(notifications) {
  const notificationsList = document.getElementById('notifications-list');
  if (notifications.length === 0) {
    notificationsList.innerHTML = '<p>No hay notificaciones.</p>';
    return;
  }

  notificationsList.innerHTML = '';
  notifications.forEach(notification => {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification';
    notificationDiv.innerHTML = `
      <p>${notification.message}</p>
      
    `;

    notificationsList.appendChild(notificationDiv);
  });
}

window.acceptNotification = async function(notificationId) {
  try {
    await updateNotificationStatus(notificationId, { status: 'aceptada' });
    alert('Notificación aceptada.');
  } catch (error) {
    console.error('Error accepting notification:', error);
    alert('Error al aceptar la notificación.');
  }
};

window.rejectNotification = async function(notificationId) {
  try {
    await updateNotificationStatus(notificationId, { status: 'rechazada' });
    alert('Notificación rechazada.');
  } catch (error) {
    console.error('Error rejecting notification:', error);
    alert('Error al rechazar la notificación.');
  }
};

// Maneja el evento de cierre de sesión
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

// Maneja el evento de envío del formulario
anteproyectoForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = anteproyectoForm['title'].value.trim();
  const tutor = anteproyectoForm['tutor'].value.trim();
  const generalObjective = anteproyectoForm['generalObjective'].value.trim();
  const specificObjective = anteproyectoForm['specificObjective'].value.trim();
  const summary = anteproyectoForm['summary'].value.trim();
  const wordFile = anteproyectoForm['wordFile'].files[0];

  if (title === '' || tutor === '' || generalObjective === '' || specificObjective === '' || summary === '' || !wordFile) {
    alert('Por favor, llena todos los campos.');
    return;
  }

  try {
    // Subir el archivo a Firebase Storage
    const fileURL = await uploadFileAndGetURL(wordFile);

    observeAuthState(user => {
      if (user) {
        getAllAnteproyectos().then(async (querySnapshot) => {
          let existingAnteproyecto = null;
          querySnapshot.forEach((doc) => {
            const anteproyecto = doc.data();
            if (anteproyecto.userId === user.uid) {
              existingAnteproyecto = doc.id;
            }
          });

          if (editStatus) {
            // Actualizar anteproyecto existente
            await updateAnteproyecto(id, { title, tutor, generalObjective, specificObjective, summary, wordFileUrl: fileURL, userId: user.uid });
            anteproyectoForm.reset();
            editStatus = false;
            id = '';
            anteproyectoForm['submit-button'].innerText = 'Guardar';
            loadAnteproyectos(user.uid); // Recargar la lista de anteproyectos
          } else if (existingAnteproyecto) {
            // Notificar al usuario para eliminar el anteproyecto existente
            if (confirm('Ya tienes un anteproyecto cargado. Debes eliminar el anteproyecto actual antes de guardar uno nuevo.')) {
              await deleteAnteproyecto(existingAnteproyecto);
              await saveAnteproyecto({ title, tutor, generalObjective, specificObjective, summary, wordFileUrl: fileURL, userId: user.uid });
              anteproyectoForm.reset();
              anteproyectoForm['submit-button'].innerText = 'Guardar';
              loadAnteproyectos(user.uid); // Recargar la lista de anteproyectos
            }
          } else {
            // Guardar un nuevo anteproyecto
            const newAnteproyectoRef = await saveAnteproyecto({ title, tutor, generalObjective, specificObjective, summary, wordFileUrl: fileURL, userId: user.uid });
            const newAnteproyectoId = newAnteproyectoRef.id; // Captura el ID del nuevo anteproyecto
            anteproyectoForm.reset();
            anteproyectoForm['submit-button'].innerText = 'Guardar';
            loadAnteproyectos(user.uid); // Recargar la lista de anteproyectos
            
            // Actualizar el ID del anteproyecto en la colección de usuarios
            await updateStudentAnteproyectoId(user.uid, newAnteproyectoId); // Asegúrate de pasar el ID correcto

          }
        }).catch(error => {
          console.error('Error obteniendo anteproyectos:', error);
          alert('Error al obtener anteproyectos. Por favor, inténtalo de nuevo.');
        });
      } else {
        window.location.href = '/login';
      }
    });
  } catch (error) {
    console.error('Error guardando el anteproyecto:', error);
    alert('Error al guardar el anteproyecto. Por favor, inténtalo de nuevo.');
  }
});


