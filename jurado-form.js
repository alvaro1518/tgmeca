// jurado-form.js
import { observeAuthState, logoutUser, updateAnteproyecto } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('anteproyecto-form');
  const anteproyectoIdInput = document.getElementById('anteproyecto-id');
  const statusSelect = document.getElementById('status');
  const commentsTextArea = document.getElementById('comments');
  const logoutButton = document.getElementById('logout-button');
document.getElementById('change-password-button').addEventListener('click', () => {
  $('#changePasswordModal').modal('show');
});

document.getElementById('change-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;

  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado.');
    }

    // Verificar la contraseña actual (Firebase Authentication no proporciona esta función directamente,
    // por lo que debes implementar un método para verificarla, si es necesario).

    // Cambiar la contraseña
    await user.updatePassword(newPassword);
    
    $('#changePasswordModal').modal('hide');
    alert('Contraseña cambiada con éxito');
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    alert('Error al cambiar la contraseña. Por favor, intente nuevamente.');
  }
});

  observeAuthState(user => {
    if (!user) {
      window.location.href = '/login';
    }
  });

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        await logoutUser();
        window.location.href = '/login';
      } catch (error) {
        console.error('Error cerrando sesión:', error);
        alert('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const anteproyectoId = anteproyectoIdInput.value;
      const status = statusSelect.value;
      const comments = commentsTextArea.value;

      try {
        await updateAnteproyecto(anteproyectoId, { status, comments });
        alert('Anteproyecto actualizado exitosamente.');
        window.location.href = 'jurado.html'; 
      } catch (error) {
        console.error('Error al actualizar anteproyecto:', error);
        alert('Error al actualizar anteproyecto. Por favor, inténtalo de nuevo.');
      }
    });
  }
});
