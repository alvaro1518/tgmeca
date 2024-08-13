import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  // Tu configuración de Firebase aquí
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const updateUserRole = async (userId, role) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: role
    });
    console.log(`Role updated successfully for user ${userId}`);
  } catch (error) {
    console.error('Error updating user role:', error);
  }
};

// Actualizar roles de usuarios específicos
updateUserRole('USER_ID_1', 'administrador');
updateUserRole('USER_ID_2', 'jurado');
updateUserRole('USER_ID_3', 'estudiante');
