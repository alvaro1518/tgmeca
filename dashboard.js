import { 
  observeAuthState, 
  getUserData, 
  updateUserData, 
  logoutUser, 
  getNotifications, 
  updateNotificationStatus 
} from './firebase.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js';

const preinscripcionButton = document.getElementById('preinscripcion-button');
const anteproyectoButton = document.getElementById('anteproyecto-button');
const proyectoButton = document.getElementById('proyecto-button');
const logoutButton = document.getElementById('logout-button');
const profileButton = document.getElementById('profile-button');
const studentNameElement = document.getElementById('student-name');
const notificationsList = document.getElementById('notifications-list');
const profileModal = new bootstrap.Modal(document.getElementById('profileModal'));
const profileForm = document.getElementById('profile-form');

const db = getFirestore();
const auth = getAuth();

observeAuthState(async user => {
    if (!user) {
        window.location.href = '/login';
        return;
    }

    try {
        const userDataDoc = await getUserData(user.uid);
        if (userDataDoc.exists()) {
            const userData = userDataDoc.data();
            
            // Verificar el rol del usuario
            if (userData.role !== 'estudiante') {
                window.location.href = '/login';
                return;
            }

            studentNameElement.textContent = userData.fullName || 'estudiante';

            // Cargar notificaciones
            const notifications = await getNotifications(user.uid);
            displayNotifications(notifications);

            profileButton.addEventListener('click', () => {
                document.getElementById('profile-full-name').value = userData.fullName || '';
                document.getElementById('profile-age').value = userData.age || '';
                document.getElementById('profile-major').value = userData.major || '';
                document.getElementById('profile-semester').value = userData.semester || '';
                document.getElementById('profile-phone').value = userData.phone || '';
                document.getElementById('profile-gender').value = userData.gender || 'Male';

                profileModal.show();
            });

            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const fullName = document.getElementById('profile-full-name').value;
                const age = document.getElementById('profile-age').value;
                const major = document.getElementById('profile-major').value;
                const semester = document.getElementById('profile-semester').value;
                const phone = document.getElementById('profile-phone').value;
                const gender = document.getElementById('profile-gender').value;

                try {
                    await updateUserData(user.uid, {
                        fullName,
                        age,
                        major,
                        semester,
                        phone,
                        gender
                    });

                    alert('Perfil actualizado exitosamente.');
                    profileModal.hide();
                    studentNameElement.textContent = fullName;
                } catch (error) {
                    console.error('Error updating profile:', error);
                    alert('Error al actualizar el perfil. Por favor, intente nuevamente.');
                }
            });

            // Verificar la disponibilidad del proyecto
            await checkProjectAvailability(user.uid);

        } else {
            console.error('User data not found.');
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
});


preinscripcionButton.addEventListener('click', () => {
  window.location.href = 'preinscripcion.html';
});

anteproyectoButton.addEventListener('click', () => {
  window.location.href = 'anteproyecto.html';
});

proyectoButton.addEventListener('click', () => {
  window.location.href = 'proyecto.html';
});

logoutButton.addEventListener('click', async () => {
  try {
    await logoutUser();
    window.location.href = '/login';
  } catch (error) {
    console.error('Error logging out:', error);
    alert('Failed to logout. Please try again.');
  }
});

const notificationsButton = document.getElementById('notifications-button');
const notificationsDropdown = document.getElementById('notifications-dropdown');
const notificationCount = document.getElementById('notification-count');

notificationsButton.addEventListener('click', () => {
  notificationsDropdown.style.display = notificationsDropdown.style.display === 'block' ? 'none' : 'block';
});

function displayNotifications(notifications) {
  notificationsList.innerHTML = '';
  let count = 0;

  if (notifications.length === 0) {
    notificationsList.innerHTML = '<p>No hay notificaciones.</p>';
  } else {
    notifications.forEach(notification => {
      const notificationDiv = document.createElement('div');
      notificationDiv.className = 'notification mt-3';
      notificationDiv.dataset.id = notification.id;

      notificationDiv.innerHTML = `
        <div class="notification-body">
          <p>${notification.message}</p>
          <small class="text-muted">${notification.isAccepted ? 'Aceptado' : 'Pendiente'}</small>
        </div>
      `;

      notificationsList.appendChild(notificationDiv);
      count++;
    });
  }

  // Update the notification count
  notificationCount.textContent = count;
}

// Your existing logic for handling notifications







window.acceptNotification = async function(notificationId) {
  try {
    console.log('Accepting notification:', notificationId); // Añadido para depuración
    await updateNotificationStatus(notificationId, 'Accepted', 'jury1');
    alert('Notificación aceptada.');
    await checkProjectAvailability(); // Verifica si el botón del proyecto debe habilitarse
  } catch (error) {
    console.error('Error accepting notification:', error);
    alert('Error al aceptar la notificación. Por favor, inténtalo de nuevo.');
  }
};

window.rejectNotification = async function(notificationId) {
  try {
    console.log('Rejecting notification:', notificationId); // Añadido para depuración
    await updateNotificationStatus(notificationId, 'Rejected', 'jury1');
    alert('Notificación rechazada.');
    const notificationDiv = document.querySelector(`[data-id="${notificationId}"]`);
    if (notificationDiv) {
      notificationsList.removeChild(notificationDiv);
    }
  } catch (error) {
    console.error('Error rejecting notification:', error);
    alert('Error al rechazar la notificación. Por favor, inténtalo de nuevo.');
  }
};


async function checkProjectAvailability(userId) {
  try {
    // Obtener el documento del usuario desde la colección "users"
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const projectId = userData.projectId; // Obtén el ID del proyecto
      const anteproyectoId = userData.anteproyectoId; // Obtén el ID del anteproyecto

      // Array de notificaciones combinado
      let notifications = [];

      // Función para obtener el nombre del jurado por ID
      const getJurorNameById = async (juradoId) => {
        if (!juradoId) return 'Jurado desconocido';
        const juradoRef = doc(db, 'users', juradoId);
        const juradoDoc = await getDoc(juradoRef);
        if (juradoDoc.exists()) {
          const juradoData = juradoDoc.data();
          return juradoData.fullName || 'Jurado sin nombre';
        } else {
          return 'Jurado no encontrado';
        }
      };

      // Verificar el estado de aceptación en la colección de proyectos
      if (projectId) {
        const projectRef = doc(db, 'proyectos', projectId);
        const projectSnapshot = await getDoc(projectRef);

        if (projectSnapshot.exists()) {
          const projectData = projectSnapshot.data();
          const jurado1Accepted = projectData.juradojurado1StatusAccepted === true;
          const jurado2Accepted = projectData.juradojurado2StatusAccepted === true;
          const jurado3Accepted = projectData.juradojurado3StatusAccepted === true;
          const coordinatorAccepted = projectData.acceptedByCoordinator === true;

          const allJuradosAccepted = jurado1Accepted && jurado2Accepted && jurado3Accepted && coordinatorAccepted;

          // Añadir notificación si todos los jurados y el coordinador han aceptado
          if (allJuradosAccepted) {
            notifications.push({
              id: 'all-ready',
              message: '¡Tu proyecto ya se encuentra listo para sustentar!',
              isAccepted: true
            });
          }
        } else {
          console.log(`Proyecto con ID ${projectId} no encontrado.`);
        }
      } else {
        console.log('El ID del proyecto no está disponible en los datos del usuario.');
      }

      // Verificar el estado de aceptación en la colección de anteproyectos
      if (anteproyectoId) {
        const anteproyectoRef = doc(db, 'anteproyectos', anteproyectoId);
        const anteproyectoDoc = await getDoc(anteproyectoRef);

        if (anteproyectoDoc.exists()) {
          const data = anteproyectoDoc.data();
          const jurado1Status = data.jurado1Status === 'aceptado';
          const jurado2Status = data.jurado2Status === 'aceptado';
          const jurado3Status = data.jurado3Status === 'aceptado';
          const allAccepted = jurado1Status && jurado2Status && jurado3Status;

          // Habilitar o deshabilitar el botón de Proyecto según el estado
          proyectoButton.disabled = !allAccepted;

          // Añadir observaciones a las notificaciones
          if (data.jurado1Observation) {
            const jurado1Name = await getJurorNameById(data.jurado1ID);
            notifications.push({ id: 'jurado1', message: `${jurado1Name}: ${data.jurado1Observation}`, isAccepted: jurado1Status });
          }
          if (data.jurado2Observation) {
            const jurado2Name = await getJurorNameById(data.jurado2ID);
            notifications.push({ id: 'jurado2', message: `${jurado2Name}: ${data.jurado2Observation}`, isAccepted: jurado2Status });
          }
          if (data.jurado3Observation) {
            const jurado3Name = await getJurorNameById(data.jurado3ID);
            notifications.push({ id: 'jurado3', message: `${jurado3Name}: ${data.jurado3Observation}`, isAccepted: jurado3Status });
          }
        } else {
          console.log(`Anteproyecto con ID ${anteproyectoId} no encontrado.`);
        }
      } else {
        console.log('El ID del anteproyecto no está disponible en los datos del usuario.');
      }

      // Mostrar las notificaciones combinadas
      displayNotifications(notifications);
    } else {
      console.log('Usuario no encontrado.');
    }
  } catch (error) {
    console.error('Error al comprobar la disponibilidad del proyecto:', error);
  }
}












