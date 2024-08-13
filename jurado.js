import { 
  observeAuthState, 
  getUserData, 
  getAnteproyectosByJuradoId, 
  getJurorDetails, 
  logoutUser, 
  updateUserData, 
  getStudentData, 
  updateAnteproyecto, 
  sendNotification,
  db,
  collection,
  getDocs,
  notifyAdmin,
  updateProjectStatus,
  updateDoc,
  doc,
  getDoc,
  auth,
  updatePassword as firebaseUpdatePassword
} from './firebase.js';
import { EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";

const juradoNameElement = document.getElementById('jurado-name');
const logoutButton = document.getElementById('logout-button');
const profileButton = document.getElementById('profile-button');
const anteproyectoDetailElement = document.getElementById('anteproyecto-detail');
const observationModal = new bootstrap.Modal(document.getElementById('observationModal'));
const observationForm = document.getElementById('observation-form');
const observationText = document.getElementById('observation-text');
const anteproyectoIdInput = document.getElementById('anteproyecto-id');

// Elementos del DOM
const changePasswordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
const changePasswordForm = document.getElementById('change-password-form');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmNewPasswordInput = document.getElementById('confirm-new-password');

// Botón para abrir el modal de cambio de contraseña
document.getElementById('change-password-button').addEventListener('click', () => {
  changePasswordModal.show();
});

// Manejar el envío del formulario de cambio de contraseña
changePasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevenir el comportamiento por defecto del formulario

  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmNewPassword = confirmNewPasswordInput.value;

  // Validar que las nuevas contraseñas coincidan
  if (newPassword !== confirmNewPassword) {
    alert('Las nuevas contraseñas no coinciden.');
    return;
  }

  try {
    // Cambiar la contraseña
    await changePassword(currentPassword, newPassword);
    alert('Contraseña actualizada con éxito.');
    changePasswordModal.hide();
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    alert('Error al cambiar la contraseña. Por favor, intente nuevamente.');
  }
});

// Función para cambiar la contraseña
const changePassword = async (currentPassword, newPassword) => {
  try {
    // Obtener el usuario actual
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No se ha encontrado un usuario autenticado.");
    }

    // Reautenticar al usuario con la contraseña actual
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Actualizar la contraseña
    await firebaseUpdatePassword(user, newPassword);
  } catch (error) {
    throw new Error("Error al cambiar la contraseña: " + error.message);
  }
};
let currentUser;

observeAuthState(async (user) => {
  if (!user) {
    window.location.href = '/login';
    return;
  }

  currentUser = user; // Guardar el usuario en una variable global

  try {
    const userDataDoc = await getUserData(user.uid);
    if (userDataDoc.exists()) {
      const userData = userDataDoc.data();

      // Verificar el rol del usuario
      if (userData.role !== 'jurado') {
        window.location.href = '/login';
        return;
      }

      juradoNameElement.textContent = userData.fullName || 'Jurado';
      
      const juradoDetails = await getJurorDetails(user.uid);
      if (juradoDetails) {
        const anteproyectos = await getAnteproyectosByJuradoId(user.uid);
        displayAnteproyectos(anteproyectos);
      } else {
        console.error('No se encontraron detalles del jurado.');
        window.location.href = 'jurado-form.html';
      }

      profileButton.addEventListener('click', () => {
        $('#profileModal').modal('show');
        document.getElementById('profile-full-name').value = userData.fullName || '';
        document.getElementById('profile-email').value = userData.email || '';
        document.getElementById('profile-professional-title').value = userData.professionalTitle || '';
      });

      document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('profile-full-name').value;
        const email = document.getElementById('profile-email').value;
        const professionalTitle = document.getElementById('profile-professional-title').value;

        try {
          await updateUserData(user.uid, { fullName, email, professionalTitle });
          $('#profileModal').modal('hide');
          juradoNameElement.textContent = fullName;
          alert('Perfil actualizado con éxito');
        } catch (error) {
          console.error('Error al actualizar el perfil:', error);
          alert('Error al actualizar el perfil. Por favor, intente nuevamente.');
        }
      });

    } else {
      console.error('Datos del jurado no encontrados.');
      window.location.href = 'jurado-form.html';
    }
  } catch (error) {
    console.error('Error al verificar los datos del jurado:', error);
    alert('Error al verificar los datos del jurado. Por favor, intente nuevamente.');
  }
});

logoutButton.addEventListener('click', async () => {
  try {
    await logoutUser();
    window.location.href = '/login';
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    alert('Error al cerrar sesión. Por favor, intente nuevamente.');
  }
});
document.getElementById('toggle-anteproyectos').addEventListener('click', () => {
  const isVisible = !anteproyectoDetailElement.classList.contains('d-none');
  anteproyectoDetailElement.classList.toggle('d-none', isVisible);
  document.getElementById('toggle-anteproyectos').textContent = isVisible ? 'Mostrar Anteproyectos' : 'Ocultar Anteproyectos';
});

document.getElementById('toggle-proyectos').addEventListener('click', () => {
  const isVisible = !document.getElementById('proyectos-enviados').classList.contains('d-none');
  document.getElementById('proyectos-enviados').classList.toggle('d-none', isVisible);
  document.getElementById('toggle-proyectos').textContent = isVisible ? 'Mostrar Proyectos' : 'Ocultar Proyectos';
});
async function displayAnteproyectos(anteproyectos) {
  if (anteproyectos.length === 0) {
    anteproyectoDetailElement.innerHTML = '<p>No hay anteproyectos disponibles.</p>';
    return;
  }

  anteproyectoDetailElement.innerHTML = '';
  for (const anteproyecto of anteproyectos) {
    try {
      const studentDoc = await getStudentData(anteproyecto.userId);
      const studentData = studentDoc.exists() ? studentDoc.data() : {};
      const studentName = studentData.fullName || 'Nombre no disponible';

      const juradoNumber = await getJuradoNumber(currentUser.uid); 
      const statusField = `jurado${juradoNumber}Status`;
      const isAccepted = anteproyecto[statusField] === 'aceptado';
      const isRejected = anteproyecto[statusField] === 'rechazado';
      
      const statusColor = isAccepted ? 'text-light' : 'text-danger';
      const statusText = isAccepted ? 'Aceptado' : (isRejected ? 'Rechazado' : 'Pendiente');

      const anteproyectoDiv = document.createElement('div');
      anteproyectoDiv.className = 'card mt-3';
      anteproyectoDiv.style.backgroundColor = '#417e8d'; // Color de fondo
      anteproyectoDiv.style.borderRadius = '35px'; // Bordes redondeados
      anteproyectoDiv.innerHTML = `
      <div class="card-body" style="color: white;"> <!-- Color blanco para todo el texto -->
      <h5 class="card-title">Título del Anteproyecto: ${anteproyecto.title || 'Título no disponible'}</h5>
      <p class="card-text">Estudiante: ${studentName}</p>
      <p class="card-text" style="color: white;"><small>Tutor: ${anteproyecto.tutor || 'Tutor no disponible'}</small></p>
      <p class="card-text" style="color: white;"><small>Objetivo General: ${anteproyecto.generalObjective || 'Objetivo General no disponible'}</small></p>
      <p class="card-text" style="color: white;"><small>Objetivo Específico: ${anteproyecto.specificObjective || 'Objetivo Específico no disponible'}</small></p>
      <p class="card-text ${statusColor}" id="status-${anteproyecto.id}">Estado: ${statusText}</p>
      <a href="${anteproyecto.wordFileUrl}" class="btn btn-primary" target="_blank" download="documento.docx">Descargar Word</a>
          <button class="btn btn-success mt-2 ${isAccepted || isRejected ? 'd-none' : ''}" data-id="${anteproyecto.id}" data-action="accept">Aceptar</button>
          <button class="btn btn-danger mt-2 ${isAccepted || isRejected ? 'd-none' : ''}" data-id="${anteproyecto.id}" data-action="reject">Rechazar</button>
          <button class="btn btn-info mt-2 ${isAccepted || isRejected ? '' : 'd-none'}" style="color:white" data-id="${anteproyecto.id}" data-action="edit">Editar</button>
        </div>
      `;
      anteproyectoDetailElement.appendChild(anteproyectoDiv);
    } catch (error) {
      console.error('Error al obtener los datos del estudiante:', error);
    }
  }

  attachEventListeners();
}



function attachEventListeners() {
  document.querySelectorAll('[data-action="accept"]').forEach(button => {
    button.addEventListener('click', handleAccept);
  });
  document.querySelectorAll('[data-action="reject"]').forEach(button => {
    button.addEventListener('click', handleReject);
  });
  document.querySelectorAll('[data-action="edit"]').forEach(button => {
    button.addEventListener('click', handleEdit);
  });
}


// Función para manejar la aceptación de un anteproyecto
async function handleAccept(event) {
  const anteproyectoId = event.target.getAttribute('data-id');
  anteproyectoIdInput.value = anteproyectoId;
  observationForm.dataset.action = 'accept'; // Configurar el formulario para aceptación
  showObservationModal();
}

// Función para manejar el rechazo de un anteproyecto
async function handleReject(event) {
  const anteproyectoId = event.target.getAttribute('data-id');
  anteproyectoIdInput.value = anteproyectoId;
  observationForm.dataset.action = 'reject'; // Configurar el formulario para rechazo
  showObservationModal();
}

async function handleEdit(event) {
  const anteproyectoId = event.target.getAttribute('data-id');
  console.log(`Editar anteproyecto con ID: ${anteproyectoId}`);

  // Volver a mostrar los botones de aceptar y rechazar
  const anteproyectoDiv = document.querySelector(`[data-id="${anteproyectoId}"]`).closest('.card-body');
  if (!anteproyectoDiv) {
    console.error('No se encontró el elemento del anteproyecto');
    return;
  }

  const acceptButton = anteproyectoDiv.querySelector('[data-action="accept"]');
  const rejectButton = anteproyectoDiv.querySelector('[data-action="reject"]');
  const editButton = anteproyectoDiv.querySelector('[data-action="edit"]');

  if (acceptButton && rejectButton && editButton) {
    acceptButton.classList.remove('d-none');
    rejectButton.classList.remove('d-none');
    editButton.classList.add('d-none');
  } else {
    console.error('Botones no encontrados en el DOM');
  }
}
// Función para mostrar el modal de observaciones
function showObservationModal() {
  observationModal.show();
}


// Función para enviar la observación al estudiante
async function sendObservation(anteproyectoId, observation, isAccepting) {
  try {
    if (!currentUser) {
      throw new Error('No hay usuario autenticado.');
    }
    
    const juradoNumber = await getJuradoNumber(currentUser.uid); // Usar currentUser.uid
    if (juradoNumber === null) {
      throw new Error('No se pudo determinar el número del jurado.');
    }
    
    const statusField = `jurado${juradoNumber}Status`;
    const observationField = `jurado${juradoNumber}Observation`;
    
    console.log('Número del jurado:', juradoNumber);
    
    // Actualizar el estado del anteproyecto
    await updateAnteproyecto(anteproyectoId, {
      [statusField]: isAccepting ? 'aceptado' : 'rechazado',
      [observationField]: observation // Guardar la observación en el campo correspondiente
    });

    // Enviar la notificación al estudiante
    await sendNotification({
      userId: anteproyectoId,
      message: observation,
      isAccepted: isAccepting
    });

    observationModal.hide();
    alert('Observación enviada con éxito');

    // Actualizar la vista para ocultar botones y mostrar el botón de edición
    updateAnteproyectoView(anteproyectoId, isAccepting);
  } catch (error) {
    console.error('Error al enviar la observación:', error);
    alert('Error al enviar la observación. Por favor, intente nuevamente.');
  }
}




// Función para actualizar la vista del anteproyecto
// Función para actualizar la vista del anteproyecto
async function updateAnteproyectoView(anteproyectoId, isAccepted) {
  const anteproyectoDiv = document.querySelector(`[data-id="${anteproyectoId}"]`).closest('.card');
  if (!anteproyectoDiv) {
    console.error('No se encontró el elemento del anteproyecto');
    return;
  }

  const statusElement = anteproyectoDiv.querySelector(`#status-${anteproyectoId}`);
  const statusText = isAccepted ? 'Aceptado' : 'Rechazado';
  const statusColor = isAccepted ? 'text-success' : 'text-danger';
  
  statusElement.textContent = `Estado: ${statusText}`;
  statusElement.className = `card-text ${statusColor}`;
  
  const acceptButton = anteproyectoDiv.querySelector('[data-action="accept"]');
  const rejectButton = anteproyectoDiv.querySelector('[data-action="reject"]');
  const editButton = anteproyectoDiv.querySelector('[data-action="edit"]');

  if (acceptButton && rejectButton && editButton) {
    acceptButton.classList.add('d-none');
    rejectButton.classList.add('d-none');
    editButton.classList.remove('d-none');
  } else {
    console.error('Botones no encontrados en el DOM');
  }
}





// Función para obtener el número del jurado actual
async function getJuradoNumber(userId) {
  try {
    // Obtener los detalles del jurado usando el ID de usuario
    const juradoDetails = await getJurorDetails(userId);
    if (!juradoDetails) {
      console.error('Detalles del jurado no encontrados.');
      return null;
    }

    // Comparar el ID del usuario con los IDs de jurado almacenados en el anteproyecto
    const anteproyectos = await getAnteproyectosByJuradoId(userId);
    if (anteproyectos.length === 0) {
      console.error('No se encontraron anteproyectos para este jurado.');
      return null;
    }

    const anteproyecto = anteproyectos[0]; // Suponiendo que hay al menos un anteproyecto
    const jurado1Id = anteproyecto.jurado1ID;
    const jurado2Id = anteproyecto.jurado2ID;
    const jurado3Id = anteproyecto.jurado3ID;
    if (userId === jurado1Id) {
      return 1; // Jurado 1
    } else if (userId === jurado2Id) {
      return 2; // Jurado 2
    }else if (userId === jurado3Id) {
      return 3; // Jurado 3
    } else {
      console.error('ID del jurado no coincide con ningún jurado asignado.');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener el número del jurado:', error);
    return null;
  }
}

async function displayProjects() {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('Usuario no autenticado.');
      return;
    }

    const juradoNumber = await getJuradoNumber(currentUser.uid);
    console.log(juradoNumber)
    if (juradoNumber === null) {
      console.error('Número del jurado no disponible.');
      return;
    }

    const projectsCollection = collection(db, 'proyectos');
    const projectsSnapshot = await getDocs(projectsCollection);
    const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (projects.length === 0) {
      document.getElementById('proyectos-list').innerHTML = '<p>No hay proyectos disponibles.</p>';
      return;
    }

    document.getElementById('proyectos-list').innerHTML = '';
    for (const project of projects) {
      let studentName = 'Nombre no disponible';
      try {
        const studentDoc = await getStudentData(project.userId);
        const studentData = studentDoc.exists() ? studentDoc.data() : {};
        studentName = studentData.fullName || 'Nombre no disponible';
      } catch (error) {
        console.error('Error al obtener los datos del estudiante:', error);
      }

      // Determinar el campo de estado basado en el número del jurado
      const juradoNumber = await getJuradoNumber(currentUser.uid); 
      console.log(juradoNumber);
      const statusField = `juradojurado${juradoNumber}StatusAccepted`;
      console.log(statusField)
      // Verificar si el proyecto ha sido aceptado o rechazado
      const isAccepted = project[statusField] === true;
      const isRejected = project[statusField] === false;
      console.log(isAccepted)
      
      // Determinar el color y el texto del estado
      const statusColor = isAccepted ? 'text-Info' : (isRejected ? 'text-danger' : 'text-warning');
      const statusText = isAccepted ? 'Aceptado' : (isRejected ? 'Rechazado' : 'Pendiente');
      const cardClass = isAccepted ? 'card-project-accepted' : (isRejected ? 'card-project-rejected' : 'card-project-pending');

      // Crear y mostrar la tarjeta del proyecto
      const projectDiv = document.createElement('div');
      projectDiv.className = `card mt-3 ${cardClass}`;
      projectDiv.style.backgroundColor = '#417e8d'; // Color de fondo
      projectDiv.style.borderRadius = '35px'; // Bordes redondeados
      projectDiv.innerHTML = `
        <div class="card-body">
          <h5 class="card-title" style="color:white">Título del Proyecto: ${project.title || 'Título no disponible'}</h5>
          <p class="card-text">Estudiante: ${studentName}</p>
          <p class="card-text ${statusColor}" id="status-${project.id}">Estado: ${statusText}</p>
          <a href="${project.fileUrl}" class="btn btn-primary" target="_blank" download="documento.docx">Descargar Word</a>
          <button class="btn btn-success mt-2 ${isAccepted || isRejected }" data-id="${project.id}" data-action="accepte">Aceptar</button>
          <button class="btn btn-danger mt-2 ${isAccepted || isRejected }" data-id="${project.id}" data-action="rejecte">Rechazar</button>
          
        </div>
      `;
      document.getElementById('proyectos-list').appendChild(projectDiv);
    }

    attachEventListenersForProjects();
  } catch (error) {
    console.error('Error al obtener los proyectos:', error);
  }
}



function attachEventListenersForProjects() {
  document.querySelectorAll('[data-action="accepte"]').forEach(button => {
    button.addEventListener('click', handleAcceptProject);
  });
  document.querySelectorAll('[data-action="rejecte"]').forEach(button => {
    button.addEventListener('click', handleRejectProject);
  });

}


async function handleAcceptProject(event) {
  const projectId = event.target.getAttribute('data-id');

  try {
    const currentUser = auth.currentUser;
    const juradoNumber = await getJuradoNumber(currentUser.uid);

    if (juradoNumber === null) {
      throw new Error('No se pudo determinar el número del jurado.');
    }

    const statusField = `jurado${juradoNumber}Status`;
    console.log(statusField)
    await updateProjectStatus(projectId, statusField, true);
    
    // Verifica si ambos jurados han aceptado el proyecto
    const projectDetails = await getProjectDetails(projectId);
    if (projectDetails.juradojurado1StatusAccepted === true && projectDetails.juradojurado2StatusAccepted === true && projectDetails.juradojurado3StatusAccepted === true) {
      await markProjectAsCompleteForAdmin(projectId);
      await notifyAdmin(projectId);
    }

    // Actualiza la interfaz de usuario
    updateProjectCardView(projectId, true);
    alert('Proyecto aceptado. Se notificará al administrador una vez que ambos jurados hayan aceptado el proyecto.');
  } catch (error) {
    console.error('Error al aceptar el proyecto:', error);
    alert('Error al aceptar el proyecto. Por favor, intente nuevamente.');
  }
}

async function handleRejectProject(event) {
  const projectId = event.target.getAttribute('data-id');

  try {
    const currentUser = auth.currentUser;
    const juradoNumber = await getJuradoNumber(currentUser.uid);
    console.log(juradoNumber);
    if (juradoNumber === null) {
      throw new Error('No se pudo determinar el número del jurado.');
    }

    const statusField = `jurado${juradoNumber}Status`;
    await updateProjectStatus(projectId, statusField, false);
    
    // Actualiza la interfaz de usuario
    updateProjectCardView(projectId, false);
    await notifyAdmin(projectId, false);
    alert('Proyecto rechazado y notificación enviada al administrador.');
  } catch (error) {
    console.error('Error al rechazar el proyecto:', error);
    alert('Error al rechazar el proyecto. Por favor, intente nuevamente.');
  }
}




async function getProjectDetails(projectId) {
  try {
    const projectRef = doc(db, 'proyectos', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      throw new Error('El documento del proyecto no existe.');
    }

    return projectDoc.data();
  } catch (error) {
    console.error('Error al obtener los detalles del proyecto:', error);
    throw error;
  }
}

async function updateProjectCardView(projectId, isAccepted) {
  const projectDiv = document.querySelector(`[data-id="${projectId}"]`).closest('.card');
  if (!projectDiv) {
    console.error('No se encontró el elemento del proyecto');
    return;
  }

  const statusElement = projectDiv.querySelector(`#status-${projectId}`);
  console.log(statusElement)
  const statusText = isAccepted ? 'Aceptado' : 'Rechazado';
  const statusColor = isAccepted ? 'text-success' : 'text-danger';

  statusElement.textContent = `Estado: ${statusText}`;
  statusElement.className = `card-text ${statusColor}`;


}



async function markProjectAsCompleteForAdmin(projectId) {
  try {
    const projectRef = doc(db, 'proyectos', projectId);
    await updateDoc(projectRef, {
      isCompleteForAdmin: true
    });
    console.log('Proyecto marcado como completo para el administrador.');
  } catch (error) {
    console.error('Error al marcar el proyecto como completo para el administrador:', error);
    throw error;
  }
}

// Llama a displayProjects cuando el jurado se haya autenticado y cargue la página
observeAuthState(async (user) => {
  if (user) {
    await displayProjects();
  }
});


// Manejar el envío del formulario de observaciones
observationForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const anteproyectoId = anteproyectoIdInput.value;
  const observation = observationText.value;
  const isAccepting = observationForm.dataset.action === 'accept';

  await sendObservation(anteproyectoId, observation, isAccepting);
});
