import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, deleteDoc, doc, getDoc, updateDoc, query, where, setDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { getAuth,EmailAuthProvider,createUserWithEmailAndPassword,reauthenticateWithCredential, updatePassword, signInWithEmailAndPassword, sendPasswordResetEmail as sendResetEmail , onAuthStateChanged, signOut,  } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-storage.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCaAtl7HGTl6Msrjq05_vRXX463xj65I7M",
  authDomain: "grado-9fca0.firebaseapp.com",
  projectId: "grado-9fca0",
  storageBucket: "grado-9fca0.appspot.com",
  messagingSenderId: "20364382327",
  appId: "1:20364382327:web:c7026875e5719470cff672"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

if (window.location.hostname === "localhost") {
  const db = getFirestore();
  const auth = getAuth();
  const storage = getStorage();

  connectFirestoreEmulator(db, "localhost", 8082);
  connectAuthEmulator(auth, "http://localhost:9098");
  connectStorageEmulator(storage, "localhost", 9198);
}

// Funciones para preinscripciones
/* export const savePreinscripcion = async (preinscripcion) => {
  if (!preinscripcion.userId || !preinscripcion.details) {
    throw new Error('Los campos userId y details son obligatorios.');
  }
  return await addDoc(collection(db, "preinscripciones"), preinscripcion);
};*/

// Exporta las funciones necesarias

export const reauthenticate = (user, currentPassword) => {
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  return reauthenticateWithCredential(user, credential);
};
export const sendPasswordResetEmail = (email) => {
  return sendResetEmail(auth, email);
};
export const savePreinscripcion = (preinscripcion) => addDoc(collection(db, "preinscripciones"), preinscripcion);
export const getAllPreinscripciones = () => getDocs(collection(db, 'preinscripciones'));
export const updatePreinscripcionStatus = (id, isAccepted) => updateDoc(doc(db, 'preinscripciones', id), { isAccepted });
export const deletePreinscripcion = (id) => deleteDoc(doc(db, 'preinscripciones', id));
export const getPreinscripcion = (id) => getDoc(doc(db, 'preinscripciones', id));
export const updatePreinscripcion = (id, updatedPreinscripcion) => updateDoc(doc(db, 'preinscripciones', id), updatedPreinscripcion);

// Funciones para anteproyectos
export const saveAnteproyecto = (anteproyecto) => addDoc(collection(db, "anteproyectos"), anteproyecto);
export const getAllAnteproyectos = () => getDocs(collection(db, 'anteproyectos'));
export async function updateAnteproyecto(anteproyectoId, updates) {
  const anteproyectoRef = doc(db, 'anteproyectos', anteproyectoId);
  try {
    await updateDoc(anteproyectoRef, updates);
  } catch (error) {
    console.error('Error al actualizar el anteproyecto:', error);
    throw error;
  }
}

export const updateAnteproyectoStatus = (id, isAccepted) => updateDoc(doc(db, 'anteproyectos', id), { isAccepted });
export const deleteAnteproyecto = (id) => deleteDoc(doc(db, 'anteproyectos', id));
export const getAnteproyecto = (id) => getDoc(doc(db, 'anteproyectos', id));


export async function updateProjectStatus(projectId, juradoId, isAccepted) {
  try {
    if (projectId === undefined || juradoId === undefined || isAccepted === undefined) {
      throw new Error('Los valores projectId, juradoId y isAccepted no pueden ser undefined');
    }

    const projectRef = doc(db, 'proyectos', projectId);
    await updateDoc(projectRef, {
      [`jurado${juradoId}Accepted`]: isAccepted
    });

    console.log('Estado del proyecto actualizado exitosamente');
  } catch (error) {
    console.error('Error al actualizar el estado del proyecto:', error);
    throw error;
  }
}

export async function notifyAdmin(projectId) {
  try {
      const notification = {
          projectId: projectId,
          message: `El proyecto con ID ${projectId} ha sido aceptado.`,
          status: 'pendiente',
          timestamp: new Date()
      };

      await addDoc(collection(db, 'notifications'), notification);
  } catch (error) {
      console.error('Error al enviar notificación al administrador:', error);
  }
}
export async function getJuradosAsignados(anteproyectoId) {
  try {
    const anteproyectoDoc = await getDoc(doc(db, 'anteproyectos', anteproyectoId));
    if (!anteproyectoDoc.exists()) {
      throw new Error('Anteproyecto no encontrado');
    }

    const anteproyectoData = anteproyectoDoc.data();
    const jurado1Id = anteproyectoData.jurado1ID;
    const jurado2Id = anteproyectoData.jurado2ID;
    const jurado3Id = anteproyectoData.jurado3ID;

    return { jurado1Id, jurado2Id, jurado3Id };
    
  } catch (error) {
    console.error('Error al obtener jurados asignados:', error);
    throw error;
  }
}
//////////////////////////////////////////////////////////////////////////////////Arrelglar*//////////////
export async function saveProject({ title, summary, fileUrl, userId, juror1Id, juror2Id, juror3Id }) {
  try {
    console.log('Datos del proyecto:', { title, summary, fileUrl, userId, juror1Id, juror2Id, juror3Id });
    const docRef = await addDoc(collection(db, 'proyectos'), {
      title,
      summary,
      fileUrl,
      userId,
      juror1Id,
      juror2Id,
      juror3Id,
      timestamp: new Date()
      
    });
    return docRef;
  } catch (error) {
    console.error('Error al guardar el proyecto:', error);
    throw new Error('Error al guardar el proyecto.');
  }
}


export async function updateUserProjectId(userId, projectId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { projectId });
  } catch (error) {
    console.error('Error al actualizar el ID del proyecto del usuario:', error);
    throw new Error('Error al actualizar el ID del proyecto del usuario.');
  }
}


export const getUserProjectId = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  return userDoc.exists() ? userDoc.data().projectId : null;
};

export const getProjectById = async (projectId) => {
  const projectRef = doc(db, 'proyectos', projectId);
  const projectDoc = await getDoc(projectRef);
  return projectDoc.exists() ? projectDoc.data() : null;
};

export const updateProject = async (projectId, updatedProject) => {
  const projectRef = doc(db, 'proyectos', projectId);
  await updateDoc(projectRef, updatedProject);
};

export const deleteProject = async (projectId) => {
  const projectRef = doc(db, 'proyectos', projectId);
  await deleteDoc(projectRef);
};
export const createUser = async (email, password, name) => {
  const auth = getAuth();
  const db = getFirestore();
  
  try {
    // Crear el usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Guardar el usuario en la colección 'users' en Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name: name,
      email: email,
      role: 'jurado' // Establece el rol como 'jurado'
    });
    
    return { success: true, message: 'Jurado creado exitosamente.' };
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    return { success: false, message: error.message };
  }
};
export const createUserData = (uid, data) => {
  return setDoc(doc(db, 'users', uid), data);
};
// Funciones generales
export const loginUser = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const observeAuthState = (callback) => onAuthStateChanged(auth, callback);
export const logoutUser = () => signOut(auth);
export const updateUserRole = (userId, role) => updateDoc(doc(db, 'users', userId), { role });
export const getUserData = async (uid) => {
  const userDoc = doc(db, "users", uid);
  return await getDoc(userDoc);
};
export const getUserAcceptanceStatus = async (userId) => {
  const querySnapshot = await getDocs(query(collection(db, 'preinscripciones'), where('userId', '==', userId)));
  let isAccepted = false;
  querySnapshot.forEach((doc) => {
    const preinscripcion = doc.data();
    if (preinscripcion.isAccepted) {
      isAccepted = true;
    }
  });
  return isAccepted;
};
export async function updateStudentAnteproyectoId(userId, anteproyectoId) {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, {
      anteproyectoId: anteproyectoId // Actualiza el campo con el ID del anteproyecto
    });
    console.log('ID del anteproyecto actualizado exitosamente.');
  } catch (error) {
    console.error('Error actualizando el ID del anteproyecto:', error);
  }
}
// Función para subir archivos a Firebase Storage y obtener la URL de descarga
export const uploadFileAndGetURL = async (file) => {
  const storageRef = ref(storage, `files/${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};
export async function sendNotificationToJurors(projectId) {
  try {
    const projectRef = doc(db, 'proyectos', projectId);
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) {
      throw new Error('El proyecto no existe.');
    }

    const projectData = projectDoc.data();
    const jurado1Id = projectData.jurado1ID;
    const jurado2Id = projectData.jurado2ID;
    const jurado3Id = projectData.jurado3ID;
    const message = `Nuevo proyecto disponible para revisión: ${projectData.title}.`;

    await Promise.all([
      sendNotification(jurado1Id, message),
      sendNotification(jurado2Id, message),
      sendNotification(jurado3Id, message)
    ]);

    console.log('Notificaciones enviadas a los jurados.');

  } catch (error) {
    console.error('Error al enviar notificaciones a los jurados:', error);
  }
}
// firebase.js

// Función para obtener los proyectos enviados
export async function getProyectosEnviados() {
  const proyectosSnapshot = await db.collection('proyectos').get();
  return proyectosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
export async function saveProjectToDatabase(title, summary, file) {
  try {
    // Primero, sube el archivo
    const fileURL = await uploadFileAndGetURL(file);
    
    // Luego guarda el proyecto en la base de datos
    const docRef = await addDoc(collection(db, 'proyectos'), {
      title,
      summary,
      fileUrl: fileURL,
      timestamp: new Date()
    });
    
    // Devuelve el ID del nuevo proyecto
    return docRef.id;
  } catch (error) {
    console.error('Error al guardar el proyecto:', error);
    throw new Error('Error al guardar el proyecto.');
  }
}


// Función para actualizar un proyecto
export async function updateProyecto(proyectoId, updates) {
  await db.collection('proyectos').doc(proyectoId).update(updates);
}

// Función para enviar una notificación
// firebase.js
export async function sendNotification({ userId, message, isAccepted }) {
  if (!userId || !message) {
    throw new Error('userId y message son campos obligatorios');
  }

  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      message,
      isAccepted,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error al enviar la notificación:', error);
    throw new Error('Error al enviar la notificación.');
  }
}


export async function getJurors() {
  const userId = auth.currentUser.uid;
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    const anteproyectoId = userData.anteproyectoId;

    if (anteproyectoId) {
      const anteproyectoRef = doc(db, 'anteproyectos', anteproyectoId);
      const anteproyectoDoc = await getDoc(anteproyectoRef);

      if (anteproyectoDoc.exists()) {
        const anteproyectoData = anteproyectoDoc.data();
        const juror1Id = anteproyectoData.jurado1?.id || null;
        const juror2Id = anteproyectoData.jurado2?.id || null;
        const juror3Id = anteproyectoData.jurado3?.id || null;
        return [juror1Id, juror2Id, juror3Id];
      }
    }
  }
  return [];
}

// Listener en tiempo real para preinscripciones
export const onGetPreinscripciones = (callback) => {
  return onSnapshot(collection(db, 'preinscripciones'), callback);
};

// Listener en tiempo real para anteproyectos
export const onGetAnteproyectos = (callback) => {
  return onSnapshot(collection(db, 'anteproyectos'), callback);
};

// Función para obtener datos de usuario por ID
export const getUserById = (userId) => getDoc(doc(db, 'users', userId));

// Función para actualizar datos de usuario
export const updateUserData = async (uid, data) => {
  try {
    // Actualiza en la colección 'users'
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, data, { merge: true });

    // Actualiza en la colección 'students'
    const studentRef = doc(db, 'students', uid);
    await setDoc(studentRef, data, { merge: true });

    console.log('Datos actualizados en las colecciones "users" y "students" con éxito');
  } catch (error) {
    console.error('Error al actualizar los datos:', error);
    throw error; // Lanza el error para manejarlo en el formulario
  }
};
// Supongamos que tienes una colección de jurados en Firestore
export async function getJuradoIds() {
  try {
    const juradoIdsSnapshot = await getDocs(collection(db, "jurados"));
    const juradoIds = juradoIdsSnapshot.docs.map(doc => doc.id);
    console.log(juradoIds);
    return juradoIds;
    
  } catch (error) {
    console.error('Error al obtener los IDs de los jurados:', error);
    throw error;
  }
}

// Función para obtener todos los jurados de la colección 'users'
export async function getJurados() {
  try {
    const juradosQuery = query(collection(db, 'users'), where('role', '==', 'jurado'));
    const querySnapshot = await getDocs(juradosQuery);
    if (querySnapshot && querySnapshot.docs) {
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } else {
      console.error("No se encontraron jurados.");
      return [];
    }
  } catch (error) {
    console.error("Error al obtener los jurados:", error);
    return [];  
  }
}

// Función para comprobar si los detalles del jurado están completos
export async function getJurorDetails(juradorId) {
  try {
    const docRef = doc(db, 'users', juradorId); // Cambiado 'jurados' a 'users'
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No se encontraron detalles del jurado.");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener los detalles del jurado:", error);
    return null;
  }
}

export const isJurorProfileComplete = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.profileCompleted || false; // Verifica si el perfil está completo
    }
    return false;
  } catch (error) {
    console.error('Error al verificar el perfil del jurado:', error);
    return false;
  }
};

// Función para guardar o actualizar detalles del jurado
export async function saveJurorDetails(juradorId, details) {
  const docRef = doc(db, 'users', juradorId); // Cambiado 'jurados' a 'users'
  await setDoc(docRef, details, { merge: true });
}

// Función para obtener un anteproyecto por ID
export async function getAnteproyectoById(id) {
  const docRef = doc(db, 'anteproyectos', id);
  return await getDoc(docRef);
}

// Función para obtener anteproyectos por ID de jurado
export async function getAnteproyectosByJuradoId(juradoId) {
  try {
    const anteproyectosRef = collection(db, 'anteproyectos');
    
    // Crea dos consultas: una para jurado1ID y otra para jurado2ID
    const q1 = query(anteproyectosRef, where('jurado1ID', '==', juradoId));
    const q2 = query(anteproyectosRef, where('jurado2ID', '==', juradoId));
    const q3 = query(anteproyectosRef, where('jurado3ID', '==', juradoId));
    
    // Ejecuta ambas consultas
    const [querySnapshot1, querySnapshot2, querySnapshot3] = await Promise.all([
      getDocs(q1),
      getDocs(q2),
      getDocs(q3),
    ]);
    
    // Combina los resultados de ambas consultas
    const anteproyectos = [
      ...querySnapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...querySnapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...querySnapshot3.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];
    
    console.log(`Número de anteproyectos recuperados: ${anteproyectos.length}`);
    return anteproyectos;
  } catch (error) {
    console.error('Error al obtener anteproyectos por ID de jurado:', error);
    return [];
  }
}

export async function getJuradorDetails(juradorId) {
  try {
    const docRef = doc(db, 'users', juradorId); // Cambiado 'jurados' a 'users'
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No se encontraron detalles del jurado.");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener los detalles del jurado:", error);
    return null;
  }
}
// Función para obtener detalles del jurado y actualizar el anteproyecto
export async function updateAnteproyectoJurados(anteproyectoId, jurado1Id, jurado2Id,jurado3Id) {
  try {
    // Obtén los detalles de cada jurado
    const jurado1Details = await getJuradorDetails(jurado1Id);
    const jurado2Details = await getJuradorDetails(jurado2Id);
    const jurado3Details = await getJuradorDetails(jurado3Id);
    // Prepara la información para actualizar el anteproyecto
    const updates = {
      jurado1ID: jurado1Id,
      jurado2ID: jurado2Id,
      jurado3ID: jurado3Id,
      jurado1: {
        id: jurado1Id,
        nombre: jurado1Details ? jurado1Details.fullName : "No disponible"
      },
      jurado2: {
        id: jurado2Id,
        nombre: jurado2Details ? jurado2Details.fullName : "No disponible"
      },
      jurado3: {
        id: jurado3Id,
        nombre: jurado3Details ? jurado3Details.fullName : "No disponible"
      }
    };
    
    // Actualiza el documento del anteproyecto
    const anteproyectoRef = doc(db, 'anteproyectos', anteproyectoId);
    await updateDoc(anteproyectoRef, updates);
    console.log('Jurados y nombres actualizados exitosamente.');
  } catch (error) {
    console.error('Error al actualizar jurados y nombres:', error);
    throw error;
  }
}



// Función para obtener los datos del estudiante por ID
export async function getStudentData(studentId) {
  try {
    if (!studentId) {
      throw new Error('El ID del estudiante no puede ser null o undefined');
    }
    const studentDoc = doc(db, 'students', studentId);
    const docSnap = await getDoc(studentDoc);
    return docSnap;
  } catch (error) {
    console.error('Error al obtener los datos del estudiante:', error);
    return null;
  }
}

// Obtener notificaciones de un estudiante
export async function getNotifications(userId) {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const notifications = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });

    return notifications;
  } catch (error) {
    console.error('Error al obtener las notificaciones:', error);
    throw new Error('Error al obtener las notificaciones.');
  }
}

// Obtener notificaciones pendientes de un jurado
export const getPendingNotifications = async (juradoId) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('juradoId', '==', juradoId), where('status', '==', 'pendiente'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al obtener notificaciones pendientes:', error);
    throw new Error('Error al obtener notificaciones pendientes.');
  }
};

// Actualizar el estado de una notificación

export async function updateNotificationStatus(notificationId, status, juryId) {
  const db = getFirestore();

  try {
    // Obtener el documento del anteproyecto usando el notificationId
    const anteproyectoRef = doc(db, 'anteproyectos', notificationId);
    const anteproyectoDoc = await getDoc(anteproyectoRef);

    if (anteproyectoDoc.exists()) {
      const data = anteproyectoDoc.data();

      // Define el campo a actualizar dependiendo del jurado
      const updateData = {};
      if (juryId === 'jury1') {
        updateData.jurado1Status = status;
        updateData.jurado1Observation = status === 'Rejected' ? 'Observación de jurado 1' : '';
      } if (juryId === 'jury2') {
        updateData.jurado2Status = status;
        updateData.jurado2Observation = status === 'Rejected' ? 'Observación de jurado 2' : '';
      } else if (juryId === 'jury3') {
        updateData.jurado3Status = status;
        updateData.jurado3Observation = status === 'Rejected' ? 'Observación de jurado 3' : '';
      }

      // Actualiza el documento del anteproyecto
      await updateDoc(anteproyectoRef, updateData);

      console.log(`Anteproyecto actualizado: ${notificationId}`);
    } else {
      throw new Error('Anteproyecto not found.');
    }
  } catch (error) {
    console.error('Error updating notification status:', error);
    throw error;
  }
}

// Agregar observación a una notificación
export async function addObservationToNotification(notificationId, observation) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      observation
    });
    console.log('Observación añadida con éxito.');
  } catch (error) {
    console.error('Error al añadir la observación:', error);
    throw error;
  }
}

export async function updateJurorStatus(anteproyectoId, juradoNumber, isAccepted) {
  const statusField = `jurado${juradoNumber}Status`;
  try {
    await updateDoc(doc(db, 'anteproyectos', anteproyectoId), {
      [statusField]: isAccepted ? 'aceptado' : 'rechazado'
    });
    console.log('Estado del jurado actualizado exitosamente.');
  } catch (error) {
    console.error('Error al actualizar el estado del jurado:', error);
    throw error;
  }
}

// Exportar servicios inicializados de Firebase
export {
  db,
  auth,
  storage,
  collection,
  addDoc,
  getDocs,
  query,
  updateDoc,
  doc,
  getDoc,
  onAuthStateChanged,
  signOut,
  where,
  ref,
  uploadBytes,
  deleteDoc,
  getDownloadURL,
  getStorage,
  getFirestore,
  initializeApp,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword,
  createUserWithEmailAndPassword
};
