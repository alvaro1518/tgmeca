// proyecto.js
import { observeAuthState, getUserAcceptanceStatus, logoutUser, uploadFileAndGetURL, saveProject, getUserProjectId, updateUserProjectId, getJurors,sendNotification } from './firebase.js';
import { getFirestore, doc, getDoc, deleteDoc, updateDoc  } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';
const logoutButton = document.getElementById('logout-button');
const contentContainer = document.getElementById('content-container');
const projectForm = document.getElementById('proyecto-form');
const projectDisplay = document.getElementById('project-display');
const editProjectModal = new bootstrap.Modal(document.getElementById('editProjectModal'), { keyboard: false });
const editProjectForm = document.getElementById('edit-project-form');

const db = getFirestore();
const auth = getAuth();

let currentProjectId = null;

window.addEventListener('DOMContentLoaded', async () => {
  observeAuthState(async user => {
    if (!user) {
      window.location.href ='/login';
    } else {
      const isAccepted = await getUserAcceptanceStatus(user.uid);
      if (!isAccepted) {
        alert('Su preinscripción no ha sido aceptada. No puede acceder a esta sección.');
        window.location.href = '/preinscripcion';
      } else {
        await checkAnteproyectoAcceptance(user.uid);
      }
    }
  });
});

async function checkAnteproyectoAcceptance(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const anteproyectoId = userData.anteproyectoId;

      if (anteproyectoId) {
        const anteproyectoRef = doc(db, 'anteproyectos', anteproyectoId);
        const anteproyectoDoc = await getDoc(anteproyectoRef);

        if (anteproyectoDoc.exists()) {
          const data = anteproyectoDoc.data();
          console.log('Datos del anteproyecto:', data); // Depuración

          const responses = data.juryResponses || {};
          const allAccepted = Object.values(responses).every(response => response === 'Accepted');

          if (allAccepted) {
            // Extrae los IDs de los jurados correctamente
            const juror1Id = data.jurado1?.id || null;
            const juror2Id = data.jurado2?.id || null;
            const juror3Id = data.jurado3?.id || null;

            if (juror1Id && juror2Id && juror3Id) {
              contentContainer.style.display = 'block';
              displayUserProject(userId);  // Muestra el proyecto del usuario
            } else {
              console.log('IDs de los jurados no disponibles.');
              alert('Los IDs de los jurados no están disponibles.');
              contentContainer.style.display = 'none';
            }
          } else {
            contentContainer.style.display = 'none';
            alert('El anteproyecto no ha sido aceptado por ambos jurados. No puedes acceder a esta sección.');
            window.location.href = 'anteproyecto.html';
          }
        } else {
          console.log(`Anteproyecto con ID ${anteproyectoId} no encontrado.`);
          contentContainer.style.display = 'none';
        }
      } else {
        console.log('El ID del anteproyecto no está disponible en los datos del usuario.');
        contentContainer.style.display = 'none';
      }
    } else {
      console.log('Usuario no encontrado.');
      contentContainer.style.display = 'none';
    }
  } catch (error) {
    console.error('Error al comprobar la aceptación del anteproyecto:', error);
    contentContainer.style.display = 'none';
    alert('Hubo un error al verificar el estado del anteproyecto. Por favor, inténtalo de nuevo más tarde.');
  }
}



logoutButton.addEventListener('click', async () => {
  try {
    await logoutUser();
    window.location.href = '/login';
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
  }
});

projectForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const projectTitle = projectForm['projectTitle'].value.trim();
  const projectSummary = projectForm['projectSummary'].value.trim();
  const projectFile = projectForm['projectFile'].files[0];

  if (projectTitle === '' || projectSummary === '' || !projectFile) {
    alert('Por favor, llena todos los campos.');
    return;
  }

  try {
    const fileURL = await uploadFileAndGetURL(projectFile);

    observeAuthState(async (user) => {
      if (user) {
        const projectId = await getUserProjectId(user.uid);
        if (projectId) {
          alert('Ya tienes un proyecto registrado. No puedes registrar otro.');
          return;
        }

        // Obtén el ID del anteproyecto
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const anteproyectoId = userDoc.data().anteproyectoId;
        const anteproyectoRef = doc(db, 'anteproyectos', anteproyectoId);
        const anteproyectoDoc = await getDoc(anteproyectoRef);

        if (anteproyectoDoc.exists()) {
          const anteproyectoData = anteproyectoDoc.data();
          const juror1Id = anteproyectoData.jurado1ID || null;
          const juror2Id = anteproyectoData.jurado2ID || null;
          const juror3Id = anteproyectoData.jurado3ID || null;
          
          if (!juror1Id || !juror2Id || !juror3Id) {
            alert('Los IDs de los jurados no están disponibles.');
            return;
          }

          const newProjectRef = await saveProject({
            title: projectTitle,
            summary: projectSummary,
            fileUrl: fileURL,
            userId: user.uid,
            juror1Id,
            juror2Id,
            juror3Id
          });

          await updateUserProjectId(user.uid, newProjectRef.id);

          // Notificar solo a los dos jurados
          await notifyJurors(juror1Id, juror2Id,juror3Id, newProjectRef.id);

          alert('Proyecto guardado con éxito.');
          projectForm.reset();
          displayUserProject(user.uid);
        } else {
          console.log('Anteproyecto no encontrado.');
          alert('No se pudo encontrar el anteproyecto asociado.');
        }
      } else {
        window.location.href = '/login';
      }
    });
  } catch (error) {
    console.error('Error guardando el proyecto:', error);
    alert('Error al guardar el proyecto. Por favor, inténtalo de nuevo.');
  }
});

async function notifyJurors(juror1Id, juror2Id,juror3Id, projectId) {
  const message = `El estudiante ha guardado un nuevo proyecto. Revisa el proyecto con ID: ${projectId}`;

  if (!juror1Id || !juror2Id || !juror3Id || !message) {
    console.error('Error: ID del jurado o mensaje no están definidos.');
    return;
  }

  try {
    // Enviar notificaciones a ambos jurados
    await sendNotification({ userId: juror1Id, message, isAccepted: false });
    await sendNotification({ userId: juror2Id, message, isAccepted: false });
    await sendNotification({ userId: juror3Id, message, isAccepted: false });
    console.log('Notificaciones enviadas a los jurados.');
  } catch (error) {
    console.error('Error al notificar a los jurados:', error);
    alert('Error al notificar a los jurados. Por favor, inténtalo de nuevo.');
  }
}




async function displayUserProject(userId) {
  try {
    const projectId = await getUserProjectId(userId);
    if (projectId) {
      const projectRef = doc(db, 'proyectos', projectId);
      const projectDoc = await getDoc(projectRef);

      if (projectDoc.exists()) {
        const projectData = projectDoc.data();

        projectDisplay.innerHTML = `
          <div class="card mt-3" style="background-color: #417e8d; border-radius: 35px;">
            <div class="card-body">
              <h5 class="card-title" style="color:white">TÍtulo: ${projectData.title}</h5>
              <p class="card-text">Resumen: ${projectData.summary}</p>
              <a href="${projectData.fileUrl}" target="_blank" class="btn btn-primary">Ver Proyecto</a>
              <button class="btn btn-secondary" onclick="editProject('${projectId}')">Editar</button>
              <button class="btn btn-danger" onclick="deleteProject('${projectId}', '${userId}')">Eliminar</button>
            </div>
          </div>
        `;
        currentProjectId = projectId;
      } else {
        console.log('Proyecto no encontrado.');
      }
    }
  } catch (error) {
    console.error('Error al mostrar el proyecto:', error);
  }
}
// Asegúrate de que las funciones estén disponibles globalmente
window.deleteProject = async function(projectId, userId) {
  try {
    const projectRef = doc(db, 'proyectos', projectId);
    await deleteDoc(projectRef);

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      projectId: ''
    });

    alert('Proyecto eliminado con éxito.');
    projectDisplay.innerHTML = ''; // Limpia la visualización del proyecto
    projectForm.reset(); // Opcional: resetea el formulario
  } catch (error) {
    console.error('Error al eliminar el proyecto:', error);
    alert('Error al eliminar el proyecto. Por favor, inténtalo de nuevo.');
  }
}

window.editProject = function(projectId) {
  currentProjectId = projectId;
  editProjectModal.show();
  loadProjectData(projectId);
}

// El resto del código...

async function deleteProject(projectId, userId) {
  try {
    const projectRef = doc(db, 'proyectos', projectId);
    await deleteDoc(projectRef);

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      projectId: ''
    });

    alert('Proyecto eliminado con éxito.');
    projectDisplay.innerHTML = '';
    projectForm.reset();  // Resetea el formulario si deseas
  } catch (error) {
    console.error('Error al eliminar el proyecto:', error);
    alert('Error al eliminar el proyecto. Por favor, inténtalo de nuevo.');
  }
}

// Asegúrate de que las funciones estén disponibles globalmente
window.editProject = function(projectId) {
  currentProjectId = projectId;
  editProjectModal.show();
  loadProjectData(projectId);
}

async function loadProjectData(projectId) {
  try {
    const projectRef = doc(db, 'proyectos', projectId);
    const projectDoc = await getDoc(projectRef);

    if (projectDoc.exists()) {
      const projectData = projectDoc.data();
      editProjectForm['editProjectTitle'].value = projectData.title;
      editProjectForm['editProjectSummary'].value = projectData.summary;
      // El archivo no se puede cargar en el input por motivos de seguridad, se debe seleccionar nuevamente.
    } else {
      console.log('Proyecto no encontrado.');
    }
  } catch (error) {
    console.error('Error al cargar los datos del proyecto para editar:', error);
  }
}

editProjectForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const projectTitle = editProjectForm['editProjectTitle'].value.trim();
  const projectSummary = editProjectForm['editProjectSummary'].value.trim();
  const projectFile = editProjectForm['editProjectFile'].files[0];

  if (projectTitle === '' || projectSummary === '') {
    alert('Por favor, llena todos los campos.');
    return;
  }

  try {
    let fileURL = null;
    if (projectFile) {
      fileURL = await uploadFileAndGetURL(projectFile);
    }

    const projectRef = doc(db, 'proyectos', currentProjectId);
    await updateDoc(projectRef, {
      title: projectTitle,
      summary: projectSummary,
      ...(fileURL && { fileUrl: fileURL })
    });

    alert('Proyecto actualizado con éxito.');
    editProjectModal.hide();
    displayUserProject(auth.currentUser.uid);
  } catch (error) {
    console.error('Error al actualizar el proyecto:', error);
    alert('Error al actualizar el proyecto. Por favor, inténtalo de nuevo.');
  }
});
