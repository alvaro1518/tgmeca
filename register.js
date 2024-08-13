import { createUser, createUserData } from './firebase.js';

const registerForm = document.getElementById('register-form');
const registerError = document.getElementById('register-error');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = registerForm['register-email'].value;
  const password = registerForm['register-password'].value;

  try {
    // Crea un nuevo usuario con las credenciales proporcionadas
    const userCredential = await createUser(email, password);
    const user = userCredential.user;

    // Guarda los datos del nuevo usuario en Firestore
    await createUserData(user.uid, {
      email: user.email,
      role: 'estudiante',
      fullName: '',
      age: '',
      major: '',
      semester: '',
      phone: '',
      gender: ''
    });

    // Redirige a la página de información del estudiante para completar el perfil
    window.location.href = '/student-info';
  } catch (error) {
    console.error('Error al crear usuario:', error);
    registerError.textContent = 'Error al crear usuario. Inténtalo de nuevo.';
    registerError.style.display = 'block';
  }
});
