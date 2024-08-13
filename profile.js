import { auth, getUserData, updateUserData } from './firebase.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Asegúrate de que el usuario esté autenticado
  const user = auth.currentUser;

  // Si el usuario no está autenticado, redirige a login
  if (!user) {
    window.location.href = '/login';
    return;
  }

  // Selecciona el formulario de perfil
  const form = document.getElementById('profile-form');

  try {
    // Obtén los datos del usuario
    const userDataDoc = await getUserData(user.uid);
    if (userDataDoc.exists()) {
      const userData = userDataDoc.data();
      form['full-name'].value = userData.fullName || '';
      form['age'].value = userData.age || '';
      form['major'].value = userData.major || '';
      form['semester'].value = userData.semester || '';
      form['phone'].value = userData.phone || '';
      form['gender'].value = userData.gender || 'Masculino';
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = form['full-name'].value;
    const age = form['age'].value;
    const major = form['major'].value;
    const semester = form['semester'].value;
    const phone = form['phone'].value;
    const gender = form['gender'].value;

    try {
      await updateUserData(user.uid, {
        fullName,
        age,
        major,
        semester,
        phone,
        gender
      });

      alert('Información actualizada con éxito');
    } catch (error) {
      console.error('Error updating user data:', error);
      alert('Error updating information. Please try again.');
    }
  });
});
