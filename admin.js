import {
  getAllPreinscripciones,
  updatePreinscripcionStatus,
  getAllAnteproyectos,
  updateAnteproyectoStatus,
  observeAuthState,
  logoutUser,
  getUserById,
  getJurados,
  updateAnteproyectoJurados,
  getNotifications,
  updateNotificationStatus,
  addObservationToNotification,
  collection,
  db,
  auth, // Asegúrate de importar 'auth'
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  query,
  where,
  createUserWithEmailAndPassword,
  createUser// Importa la función para crear usuarios
}  from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const preinscripcionesContainer = document.getElementById('preinscripciones-container');
  const anteproyectosContainer = document.getElementById('anteproyectos-container');
  const showPreinscripcionesButton = document.getElementById('show-preinscripciones');
  const showAnteproyectosButton = document.getElementById('show-anteproyectos');
  const logoutButton = document.getElementById('logout-button');
  const selectJuradosForm = document.getElementById('select-jurados-form');
  const anteproyectoIdInput = document.getElementById('anteproyecto-id');
  const jurado1Select = document.getElementById('jurado1');
  const jurado2Select = document.getElementById('jurado2');
  const jurado3Select = document.getElementById('jurado3');
  const selectJuradosModal = document.getElementById('selectJuradosModal');
  const createJuradoForm = document.getElementById('create-jurado-form');

  if (createJuradoForm) {
    createJuradoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('jurado-name').value;
      const email = document.getElementById('jurado-email').value;
      const password = document.getElementById('jurado-password').value;

      const result = await createUser(email, password, name);
      console.log(result);
      if (result.success) {
        alert(result.message);

        // Cerrar el modal usando Bootstrap 5
        const myModalEl = document.getElementById('createJuradoModal');
        const modal = bootstrap.Modal.getInstance(myModalEl);
        modal.hide();

        // Opcional: Actualizar la lista de jurados
        // loadJurados();
      } else {
        alert(result.message);
      }
    });
  }



    


    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await logoutUser();
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Error cerrando sesión:', error);
                alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
            }
        });
    }

    if (showPreinscripcionesButton) {
        showPreinscripcionesButton.addEventListener('click', () => {
            preinscripcionesContainer.style.display = 'block';
            anteproyectosContainer.style.display = 'none';
            loadPreinscripciones();
        });
    }

    if (showAnteproyectosButton) {
        showAnteproyectosButton.addEventListener('click', () => {
            preinscripcionesContainer.style.display = 'none';
            anteproyectosContainer.style.display = 'block';
            loadAnteproyectos();
        });
    }


    async function loadPreinscripciones() {
      try {
          const querySnapshot = await getAllPreinscripciones();
          let html = '';
  
          for (const doc of querySnapshot.docs) {
              const preinscripcion = doc.data();
              const userDoc = await getUserById(preinscripcion.userId);
              const userName = userDoc.data().fullName || 'Nombre no disponible';
  
              const statusText = preinscripcion.isAccepted === undefined ? 'Pendiente' : (preinscripcion.isAccepted ? 'Aceptado' : 'Rechazado');
              const cardClass = preinscripcion.isAccepted === undefined ? 'bg-light' : (preinscripcion.isAccepted ? 'bg-success' : 'bg-danger');
              const displayActions = preinscripcion.isAccepted === undefined ? 'block' : 'none';
              const displayEdit = preinscripcion.isAccepted === undefined ? 'none' : 'block';
              
              html += `
                  <div class="card mt-3 ${cardClass}" id="card-${doc.id}" style="border-radius: 35px; color: black;">
                      <div class="card-body" >
                          <h5 class="card-title" >Título: ${preinscripcion.title || 'Título no disponible'}</h5>
                          <p class="card-text">Estudiante: ${userName}</p>
                          <p class="card-text"> Descripción: ${preinscripcion.description || 'Descripción no disponible'}</p>
                          <p class="card-text"  ><small class="text-muted">Semestre: ${preinscripcion.semester || 'Semestre no disponible'}</small></p>
                          <p class="card-text" ><small class="text-muted">Tipo: ${preinscripcion.type || 'Tipo no disponible'}</small></p>
                          <p class="card-text"><small class="text-muted"  id="status-${doc.id}">Estado: ${statusText}</small></p>
                          <div id="actions-${doc.id}" style="display: ${displayActions};">
                              <button class="btn btn-success btn-accept" style="color: black;" data-id="${doc.id}">Aceptar</button>
                              <button class="btn btn-danger btn-reject"style="color: black;" data-id="${doc.id}">Rechazar</button>
                          </div>
                          <button class="btn btn-warning btn-edit" data-id="${doc.id}" style="display: ${displayEdit};">Editar</button>
                      </div>
                  </div>
              `;
          }
  
          preinscripcionesContainer.innerHTML = html;
  
          preinscripcionesContainer.querySelectorAll('.btn-accept').forEach(btn => {
              btn.addEventListener('click', async ({ target: { dataset } }) => {
                  try {
                      await updatePreinscripcionStatus(dataset.id, true);
                      updateCardAppearance(dataset.id, true);
                      alert('Preinscripción aceptada.');
                  } catch (error) {
                      console.error('Error al aceptar preinscripción:', error);
                      alert('Error al aceptar preinscripción. Por favor, inténtalo de nuevo.');
                  }
              });
          });
  
          preinscripcionesContainer.querySelectorAll('.btn-reject').forEach(btn => {
              btn.addEventListener('click', async ({ target: { dataset } }) => {
                  try {
                      await updatePreinscripcionStatus(dataset.id, false);
                      updateCardAppearance(dataset.id, false);
                      alert('Preinscripción rechazada.');
                  } catch (error) {
                      console.error('Error al rechazar preinscripción:', error);
                      alert('Error al rechazar preinscripción. Por favor, inténtalo de nuevo.');
                  }
              });
          });
  
          preinscripcionesContainer.querySelectorAll('.btn-edit').forEach(btn => {
              btn.addEventListener('click', ({ target: { dataset } }) => {
                  toggleEditButtons(dataset.id);
              });
          });
      } catch (error) {
          console.error('Error al cargar preinscripciones:', error);
          alert('Error al cargar preinscripciones. Por favor, inténtalo de nuevo.');
      }
  }

    async function loadAnteproyectos() {
        try {
            const querySnapshot = await getAllAnteproyectos();
            let html = '';

            for (const doc of querySnapshot.docs) {
                const anteproyecto = doc.data();
                const userDoc = await getUserById(anteproyecto.userId);
                const userName = userDoc.data().fullName || 'Nombre no disponible';

                const statusText = anteproyecto.isAccepted === undefined ? 'Pendiente' : (anteproyecto.isAccepted ? 'Aceptado' : 'Rechazado');
                const cardClass = anteproyecto.isAccepted === undefined ? '' : (anteproyecto.isAccepted ? 'bg-success' : 'bg-danger');
                const displayActions = anteproyecto.isAccepted === undefined ? 'block' : 'none';
                const displayEdit = anteproyecto.isAccepted === undefined ? 'none' : 'block';
                const wordFileUrl = anteproyecto.wordFileUrl || '#'; 
                html += `
                    <div class="card mt-3 ${cardClass}" id="card-${doc.id}" style="border-radius: 35px; color: black;">
                        <div class="card-body">
                            <h5 class="card-title">${anteproyecto.title || 'Título no disponible'}</h5>
                            <p class="card-text">Estudiante: ${userName}</p>
                            <p class="card-text" >Resumen:${anteproyecto.summary || 'Descripción no disponible'}</p>
                            <p class="card-text"><small class="text-muted">Tutor: ${anteproyecto.tutor || 'Tutor no disponible'}</small></p>
                            <p class="card-text" ><small class="text-muted">Objetivo General: ${anteproyecto.generalObjective || 'Objetivo General no disponible'}</small></p>
                            <p class="card-text"><small class="text-muted">Objetivo Específico: ${anteproyecto.specificObjective || 'Objetivo Específico no disponible'}</small></p>
                            <p class="card-text"><small class="text-muted" id="status-${doc.id}">Estado: ${statusText}</small></p>
                            <div id="actions-${doc.id}" style="display: ${displayActions};">
                                <button class="btn btn-success btn-accept" style="color: black;" data-id="${doc.id}">Aceptar</button>
                                <button class="btn btn-danger btn-reject" style="color: black;" data-id="${doc.id}">Rechazar</button>
                            </div>
                            <button class="btn btn-warning btn-edit" data-id="${doc.id}" style="display: ${displayEdit};">Editar</button>
                            <a href="${wordFileUrl}" class="btn btn-primary" style="color: black;" target="_blank" download="documento.docx">Descargar Word</a>
                        </div>
                    </div>
                `;
            }

            anteproyectosContainer.innerHTML = html;

            anteproyectosContainer.querySelectorAll('.btn-accept').forEach(btn => {
                btn.addEventListener('click', async ({ target: { dataset } }) => {
                    try {
                        await updateAnteproyectoStatus(dataset.id, true);
                        updateCardAppearance(dataset.id, true);
                        alert('Anteproyecto aceptado.');
                        anteproyectoIdInput.value = dataset.id;
                        loadJurados(); 
                        $(selectJuradosModal).modal('show');
                    } catch (error) {
                        console.error('Error al aceptar anteproyecto:', error);
                        alert('Error al aceptar anteproyecto. Por favor, inténtalo de nuevo.');
                    }
                });
            });

            anteproyectosContainer.querySelectorAll('.btn-reject').forEach(btn => {
                btn.addEventListener('click', async ({ target: { dataset } }) => {
                    try {
                        await updateAnteproyectoStatus(dataset.id, false);
                        updateCardAppearance(dataset.id, false);
                        alert('Anteproyecto rechazado.');
                    } catch (error) {
                        console.error('Error al rechazar anteproyecto:', error);
                        alert('Error al rechazar anteproyecto. Por favor, inténtalo de nuevo.');
                    }
                });
            });

            anteproyectosContainer.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', ({ target: { dataset } }) => {
                    toggleEditButtons(dataset.id);
                });
            });
        } catch (error) {
            console.error('Error al cargar anteproyectos:', error);
            alert('Error al cargar anteproyectos. Por favor, inténtalo de nuevo.');
        }
    }

    function updateCardAppearance(id, isAccepted) {
        const statusElement = document.getElementById(`status-${id}`);
        const actionsElement = document.getElementById(`actions-${id}`);
        const cardElement = document.getElementById(`card-${id}`);
        
        if (statusElement) {
            statusElement.textContent = `Estado: ${isAccepted ? 'Aceptado' : 'Rechazado'}`;
        }
        
        if (actionsElement) {
            actionsElement.style.display = 'none';
        }

        if (cardElement) {
            cardElement.classList.remove('border-success', 'border-danger');
            cardElement.classList.add(isAccepted ? 'border-success' : 'border-danger');
        }
    }

    function toggleEditButtons(id) {
        const actionsElement = document.getElementById(`actions-${id}`);
        const editButton = document.querySelector(`.btn-edit[data-id="${id}"]`);

        if (actionsElement) {
            actionsElement.style.display = actionsElement.style.display === 'none' ? 'block' : 'none';
        }

        if (editButton) {
            editButton.style.display = editButton.style.display === 'none' ? 'block' : 'none';
        }
    }

    async function loadJurados() {
        try {
            const jurados = await getJurados();
            const jurado1Select = document.getElementById('jurado1');
            const jurado2Select = document.getElementById('jurado2');
            const jurado3Select = document.getElementById('jurado3');
            jurado1Select.innerHTML = '<option value="">Selecciona un jurado</option>';
            jurado2Select.innerHTML = '<option value="">Selecciona un jurado</option>';
            jurado3Select.innerHTML = '<option value="">Selecciona un jurado</option>';
            jurados.forEach(jurado => {
                const option = `<option value="${jurado.id}">${jurado.fullName}</option>`;
                jurado1Select.innerHTML += option;
                jurado2Select.innerHTML += option;
                jurado3Select.innerHTML += option;
            });
        } catch (error) {
            console.error('Error al cargar jurados:', error);
            alert('Error al cargar jurados. Por favor, inténtalo de nuevo.');
        }
    }
    

    if (selectJuradosForm) {
        selectJuradosForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const anteproyectoId = anteproyectoIdInput.value;
            const jurado1Id = jurado1Select.value;
            const jurado2Id = jurado2Select.value;
            const jurado3Id = jurado3Select.value;

            try {
                await updateAnteproyectoJurados(anteproyectoId, jurado1Id, jurado2Id, jurado3Id);
                alert('Jurados asignados exitosamente.');
                $(selectJuradosModal).modal('hide');
                loadAnteproyectos(); 
            } catch (error) {
                console.error('Error al asignar jurados:', error);
                alert('Error al asignar jurados. Por favor, inténtalo de nuevo.');
            }
        });
    }
    const notificationsContainer = document.getElementById('notifications-container');
const notificationsList = document.getElementById('notifications-list');

async function loadNotifications() {
  try {
    const notifications = await getNotifications(); // Implementa la función para obtener todas las notificaciones
    displayNotifications(notifications);
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}
// Función para obtener todos los proyectos
// Función para obtener todos los proyectos aceptados por ambos jurados
async function getAllProjects() {
  try {
    const projectsCollection = collection(db, 'proyectos');

    // Crear una consulta para obtener solo los proyectos aceptados por ambos jurados
    const acceptedProjectsQuery = query(
      projectsCollection,
      where('juradojurado1StatusAccepted', '==', true),
      where('juradojurado2StatusAccepted', '==', true),
      where('juradojurado3StatusAccepted', '==', true)
    );

    const projectsSnapshot = await getDocs(acceptedProjectsQuery);

    // Verificar si hay proyectos aceptados por ambos jurados
    if (projectsSnapshot.empty) {
      console.log('No hay proyectos aceptados por ambos jurados.');
      return [];
    }

    // Procesar los documentos y devolver una lista de proyectos
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return projects;
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    throw error;
  }
}

  
  // Función para actualizar el estado de un proyecto
// Función para actualizar el estado de un proyectorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr
async function updateProjectStatus(projectId, isAccepted, isJuror) {
  try {
    const projectRef = doc(db, 'proyectos', projectId);
    const projectSnapshot = await getDoc(projectRef);
    if (!projectSnapshot.exists()) {
      throw new Error('El proyecto no existe');
    }

    const projectData = projectSnapshot.data();
    const updateData = {};

    if (isJuror) {
      // Actualiza el estado de aceptación del jurado
      if (projectData.juror1Id === auth.currentUser.uid) {
        updateData.juradojurado1StatusAccepted = isAccepted;
      } if (projectData.juror2Id === auth.currentUser.uid) {
        updateData.juradojurado2StatusAccepted = isAccepted;
      } else if (projectData.juror3Id === auth.currentUser.uid) {
        updateData.juradojurado3StatusAccepted = isAccepted;
      }
    } else {
      // Actualiza el estado de aceptación del coordinador
      updateData.acceptedByCoordinator = isAccepted;
    }

    await updateDoc(projectRef, updateData);

    // Verifica si ambos jurados han aceptado y si el coordinador también ha aceptado
    const bothJurorsAccepted = projectData.juradojurado1StatusAccepted && projectData.juradojurado2StatusAccepted && projectData.juradojurado3StatusAccepted;
    if (bothJurorsAccepted && isAccepted && !isJuror) {
      //await sendNotificationToStudent(projectId, 'Tu proyecto ha sido aceptado por los dos jurados y el coordinador.');
    }

    // Actualiza la interfaz de usuario
    updateCardAppearance(projectId, isAccepted);
  } catch (error) {
    console.error('Error al actualizar el estado del proyecto:', error);
  }
}





async function loadProjectStatus(projectId) {
  try {
    const projectRef = doc(db, 'proyectos', projectId);
    const projectSnapshot = await getDoc(projectRef);
    if (!projectSnapshot.exists()) {
      throw new Error('El proyecto no existe');
    }

    const projectData = projectSnapshot.data();

    // Verificar el estado de los jurados
    const juror1Accepted = projectData.juradojurado1StatusAccepted;
    const juror2Accepted = projectData.juradojurado2StatusAccepted;
    const juror3Accepted = projectData.juradojurado3StatusAccepted;
    // Actualizar la interfaz de usuario según el estado
    if (juror1Accepted || juror2Accepted || juror3Accepted) {
      document.getElementById('acceptButton').disabled = true;
      document.getElementById('rejectButton').disabled = true;
      if (juror1Accepted && juror2Accepted && juror3Accepted) {
        // Si ambos jurados aceptaron, puedes mostrar un mensaje u ocultar los botones
        document.getElementById('acceptButton').style.display = 'none';
        document.getElementById('rejectButton').style.display = 'none';
      } else {
        // Si solo uno ha aceptado, podrías mostrar un mensaje indicando que falta la aceptación del otro jurado
        console.log('Esperando la decisión del otro jurado');
      }
    }

  } catch (error) {
    console.error('Error al cargar el estado del proyecto:', error);
  }
}

// Llamar a la función cuando la página se carga
document.addEventListener('DOMContentLoaded', () => {
  loadProjectStatus('ID_DEL_PROYECTO');
});

  // Función para enviar notificación al estudiante
  async function sendNotificationToStudent(projectId, message) {
    try {
      // Obtén el ID del estudiante asociado al proyecto
      const projectRef = doc(db, 'proyectos', projectId);
      const projectSnapshot = await getDoc(projectRef); // Usa getDoc aquí
      if (!projectSnapshot.exists()) {
        throw new Error('El proyecto no existe');
      }
      const studentId = projectSnapshot.data().userId;
  
      // Envía la notificación (ajusta la colección y el formato de la notificación según tus necesidades)
      const notificationRef = collection(db, 'notifications');
      await addDoc(notificationRef, {
        userId: studentId,
        message: message,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      throw error;
    }
  }
  
  
  // Función para actualizar la apariencia de la tarjeta del proyecto
  function updateCardAppearance(projectId, isAccepted) {
    const card = document.getElementById(`card-${projectId}`);
    const actions = document.getElementById(`actions-${projectId}`);
  
    if (isAccepted) {
      card.classList.add('border-success');
      card.classList.remove('border-danger');
      actions.style.display = 'none';
    } else {
      card.classList.add('border-danger');
      card.classList.remove('border-success');
      actions.style.display = 'none';
    }
  }
  // Función para obtener proyectos que ambos jurados hayan aceptado
function fetchApprovedProjects() {
    const projectsRef = db.collection('proyectos');
    
    // Filtrar proyectos donde ambos jurados hayan aceptado
    projectsRef.where('juradojurado1StatusAccepted', '==', true)
               .where('juradojurado2StatusAccepted', '==', true)
               .where('juradojurado3StatusAccepted', '==', true)
               .get()
               .then((querySnapshot) => {
                   if (querySnapshot.empty) {
                       console.log('No se encontraron proyectos aprobados por ambos jurados.');
                       return;
                   }

                   // Limpiar el contenedor de proyectos
                   const projectsContainer = document.getElementById('projectsContainer');
                   projectsContainer.innerHTML = '';

                   querySnapshot.forEach((doc) => {
                       const projectData = doc.data();
                       
                       // Crear y mostrar la tarjeta o item del proyecto
                       const projectElement = document.createElement('div');
                       projectElement.className = 'project-card';
                       projectElement.innerHTML = `
                           <h3>${projectData.title}</h3>
                           <p>${projectData.description}</p>
                           <p><strong>Fecha de Envío:</strong> ${projectData.submissionDate.toDate().toLocaleDateString()}</p>
                           <!-- Añadir otros campos que desees mostrar -->
                       `;
                       
                       projectsContainer.appendChild(projectElement);
                   });
               })
               .catch((error) => {
                   console.error('Error al obtener los proyectos:', error);
               });
}

// Llamar a la función para cargar los proyectos al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    fetchApprovedProjects();
});

  // Función para cargar los proyectos
  // Función para cargar los proyectos
// Función para cargar los proyectos en el dashboard
async function loadProjects() {
  try {
    const projects = await getAllProjects();
    let html = '';

    for (const project of projects) {
      const userDoc = await getUserById(project.userId);
      const userName = userDoc.data().fullName || 'Nombre no disponible';

      const statusText = project.acceptedByCoordinator === undefined ? 'Pendiente' : (project.acceptedByCoordinator ? 'Aceptado' : 'Rechazado');
      const cardClass = project.acceptedByCoordinator === undefined ? '' : (project.acceptedByCoordinator ? 'bg-success' : 'bg-danger');
      const displayActions = project.acceptedByCoordinator === undefined ? 'block' : 'none';
      const displayEdit = project.acceptedByCoordinator !== undefined ? 'block' : 'none';
      const fileUrl = project.fileUrl || '#';

      html += `
        <div class="card mt-3 ${cardClass}" id="card-${project.id}" style="border-radius: 35px; color: black;">
          <div class="card-body">
            <h5 class="card-title">Título: ${project.title || 'Título no disponible'}</h5>
            <p class="card-text">Estudiante: ${userName}</p>
            <p class="card-text">Resumen: ${project.summary || 'Resumen no disponible'}</p>
            <p class="card-text"><small class="text-muted">Estado: ${statusText}</small></p>
            <div id="actions-${project.id}" style="display: ${displayActions};">
              <button class="btn btn-success btn-accept" style="color: black;" data-id="${project.id}">Aceptar</button>
              <button class="btn btn-danger btn-reject" style="color: black;" data-id="${project.id}">Rechazar</button>
            </div>
            <div id="edit-${project.id}" style="display: ${displayEdit};">
              <button class="btn btn-primary btn-edit" data-id="${project.id}">Editar</button>
            </div>
            <a href="${fileUrl}" class="btn btn-primary" style="color: black;" target="_blank" download="documento.docx">Descargar Word</a>
          </div>
        </div>
      `;
    }

    document.getElementById('proyectos-list').innerHTML = html;

    document.querySelectorAll('.btn-accept').forEach(btn => {
      btn.addEventListener('click', async ({ target: { dataset } }) => {
        try {
          await updateProjectStatus(dataset.id, true, false); // Actualiza el estado como aceptado por el coordinador
          loadProjects(); // Recargar los proyectos para actualizar la vista
          alert('Proyecto aceptado.');
        } catch (error) {
          console.error('Error al aceptar proyecto:', error);
          alert('Error al aceptar proyecto. Por favor, inténtalo de nuevo.');
        }
      });
    });

    document.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', async ({ target: { dataset } }) => {
        try {
          await updateProjectStatus(dataset.id, false, false); // Actualiza el estado como rechazado por el coordinador
          loadProjects(); // Recargar los proyectos para actualizar la vista
          alert('Proyecto rechazado.');
        } catch (error) {
          console.error('Error al rechazar proyecto:', error);
          alert('Error al rechazar proyecto. Por favor, inténtalo de nuevo.');
        }
      });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', async ({ target: { dataset } }) => {
        try {
          // Aquí puedes definir la lógica para reactivar los botones de aceptación y rechazo
          const projectId = dataset.id;
          const card = document.getElementById(`card-${projectId}`);
          const actions = card.querySelector(`#actions-${projectId}`);
          const edit = card.querySelector(`#edit-${projectId}`);

          actions.style.display = 'block'; // Mostrar botones de aceptación y rechazo
          edit.style.display = 'none'; // Ocultar el botón de editar
        } catch (error) {
          console.error('Error al editar proyecto:', error);
          alert('Error al editar proyecto. Por favor, inténtalo de nuevo.');
        }
      });
    });
  } catch (error) {
    console.error('Error al cargar proyectos:', error);
    alert('Error al cargar proyectos. Por favor, inténtalo de nuevo.');
  }
}



  

  
  
  
  // Event listener para el botón de mostrar proyectos
  document.getElementById('show-proyectos').addEventListener('click', () => {
    loadProjects();
  });

  async function loadProjectStatus(projectId) {
    try {
      const projectRef = doc(db, 'proyectos', projectId);
      const projectSnapshot = await getDoc(projectRef);
      if (!projectSnapshot.exists()) {
        throw new Error('El proyecto no existe');
      }
  
      const projectData = projectSnapshot.data();
  
      // Actualiza la interfaz de usuario basándote en el estado del proyecto
      updateProjectUI(projectData);
  
    } catch (error) {
      console.error('Error al cargar el estado del proyecto:', error);
    }
  }
  
  function updateProjectUI(projectData) {
    // Ejemplo de cómo actualizar la UI basado en los datos del proyecto
    if (projectData.acceptedByCoordinator) {
      // Oculta los botones de aceptar/rechazar si el coordinador ya aceptó
      document.getElementById('accept-button').style.display = 'none';
      document.getElementById('reject-button').style.display = 'none';
    } else {
      // Muestra los botones de aceptar/rechazar si el coordinador no ha tomado acción
      document.getElementById('accept-button').style.display = 'block';
      document.getElementById('reject-button').style.display = 'block';
    }
  }
  
  
function displayNotifications(notifications) {
  notificationsList.innerHTML = '';
  notifications.forEach(notification => {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = 'notification';
    notificationDiv.innerHTML = `
      <p>${notification.message}</p>
      <button class="btn btn-success" onclick="acceptNotification('${notification.id}')">Aceptar</button>
      <button class="btn btn-danger" onclick="rejectNotification('${notification.id}')">Rechazar</button>
      ${notification.status === 'rechazada' ? `<textarea id="observation-${notification.id}" placeholder="Añadir observación"></textarea>
      <button class="btn btn-info" onclick="addObservation('${notification.id}')">Enviar Observación</button>` : ''}
    `;

    notificationsList.appendChild(notificationDiv);
  });
}

window.acceptNotification = async function(notificationId) {
  try {
    await updateNotificationStatus(notificationId, { status: 'aceptada' });
    loadNotifications(); // Recargar notificaciones
  } catch (error) {
    console.error('Error accepting notification:', error);
  }
};

window.rejectNotification = async function(notificationId) {
  try {
    await updateNotificationStatus(notificationId, { status: 'rechazada' });
    loadNotifications(); // Recargar notificaciones
  } catch (error) {
    console.error('Error rejecting notification:', error);
  }
};


window.addObservation = async function(notificationId) {
  const observation = document.getElementById(`observation-${notificationId}`).value;
  try {
    await addObservationToNotification(notificationId, { observation });
    loadNotifications(); // Recargar notificaciones
  } catch (error) {
    console.error('Error adding observation:', error);
  }
};

// Llamar a la función al cargar la página
document.addEventListener('DOMContentLoaded', loadNotifications);
});
