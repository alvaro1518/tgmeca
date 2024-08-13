// Clave secreta para cifrar y descifrar (debe ser segura y gestionada adecuadamente en un entorno de producción)
const SECRET_KEY = 'mi_clave_secreta_1234567890';

export function encrypt(text) {
  try {
    // Cifra el texto con AES
    const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Error al cifrar el texto:', error);
    throw error;
  }
}

export function decrypt(encryptedText) {
  try {
    // Descifra el texto con AES
    const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Error al descifrar los datos:', error);
    throw error;
  }
}
