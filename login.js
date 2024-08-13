import { loginUser, getUserData, sendPasswordResetEmail } from './firebase.js';
import { encrypt } from './encryption.js'; // Usa CryptoJS para cifrado

const loginForm = document.getElementById('login-form');
const createAccountBtn = document.getElementById('create-account-btn');
const forgotPasswordBtn = document.getElementById('forgot-password-btn');
const loginError = document.getElementById('login-error');

async function redirectToPage(page) {
  try {
    // Cifra la página y redirige a la URL de redirección
    const encryptedPage = encrypt(page);
    window.location.href = `redirect.html?data=${encodeURIComponent(encryptedPage)}`;
  } catch (error) {
    console.error('Error al cifrar y redirigir:', error);
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = loginForm['login-email'].value;
  const password = loginForm['login-password'].value;

  try {
    const userCredential = await loginUser(email, password);
    const user = userCredential.user;

    const userDataDoc = await getUserData(user.uid);
    if (!userDataDoc.exists()) {
      throw new Error('Datos del usuario no encontrados');
    }

    const userData = userDataDoc.data();
    const role = userData.role;
    const hasCompletedProfile = userData.fullName && userData.age && userData.major && userData.semester && userData.phone && userData.gender;

    if (role === 'administrador') {
      await redirectToPage('/admin');
    } else if (role === 'jurado') {
      await redirectToPage('/jurado');
    } else if (role === 'estudiante') {
      if (hasCompletedProfile) {
        console.log("sss")
        await redirectToPage('/dashboard');
      } else {
        await redirectToPage('/student-info');
      }
    } else {
      throw new Error('Rol desconocido');
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    loginError.textContent = 'Error al iniciar sesión. Verifica tus credenciales y vuelve a intentarlo.';
    loginError.style.display = 'block';
  }
});

createAccountBtn.addEventListener('click', () => {
  window.location.href = '/register';
});

forgotPasswordBtn.addEventListener('click', () => {
  const email = prompt('Por favor ingresa tu correo electrónico:');
  if (email) {
    sendPasswordResetEmail(email)
      .then(() => {
        alert('Se ha enviado un correo electrónico para restablecer tu contraseña.');
      })
      .catch((error) => {
        console.error('Error al enviar el correo de restablecimiento:', error);
        alert('Error al enviar el correo de restablecimiento. Por favor intenta de nuevo.');
      });
  }
});
