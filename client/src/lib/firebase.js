import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Add scopes for additional permissions if needed
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Google sign-in function with fallback from popup to redirect
export const signInWithGoogle = async () => {
  try {
    // Try popup first (works better on some platforms)
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (popupError) {
      console.log("Popup sign-in failed, trying redirect method", popupError);
      
      // If popup fails (especially for auth/unauthorized-domain), try redirect
      if (popupError.code === 'auth/unauthorized-domain' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/popup-blocked') {
        
        // Use redirect method as fallback
        await signInWithRedirect(auth, googleProvider);
        // This line never executes immediately as the page redirects
        return null;
      } else {
        // For other errors, rethrow
        throw popupError;
      }
    }
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

// Function to handle redirect result - call this on app initialization
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // User signed in via redirect
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Redirect result error:", error);
    throw error;
  }
};

// Sign out function
export const firebaseSignOut = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// Auth state listener
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };
