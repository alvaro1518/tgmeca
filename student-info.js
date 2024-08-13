import { auth, updateUserData } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  // Use onAuthStateChanged to ensure we handle the authentication state properly
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    const form = document.getElementById('student-info-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = form['full-name'].value;
      const age = form['age'].value;
      const major = form['major'].value;
      const semester = form['semester'].value;
      const phone = form['phone'].value;
      const gender = form['gender'].value;

      try {
        // Save student data to Firestore
        await updateUserData(user.uid, {
          fullName,
          age,
          major,
          semester,
          phone,
          gender,
          profileCompleted: true // Mark profile as completed
        });

        // Redirect to dashboard
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Error saving student info:', error);
        alert('Failed to save information. Please try again.');
      }
    });
  });
});
