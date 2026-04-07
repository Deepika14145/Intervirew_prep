import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password, displayName) {
    return createUserWithEmailAndPassword(auth, email, password).then(async (cred) => {
      if (displayName) await updateProfile(cred.user, { displayName });
      return cred;
    });
  }
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }
  function logout() {
    return signOut(auth);
  }
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    let tokenRefreshInterval = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user) {
        const token = await user.getIdToken();
        localStorage.setItem("authToken", token);

        fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api/auth/sync`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        }).catch(err => console.error("Database sync failed:", err));

        tokenRefreshInterval = setInterval(async () => {
          try {
            const freshToken = await user.getIdToken(true);
            localStorage.setItem("authToken", freshToken);
          } catch (err) {
            console.error("Token refresh failed:", err);
          }
        }, 55 * 60 * 1000);
      } else {
        localStorage.removeItem("authToken");
        if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
      }
    });

    return () => {
      unsubscribe();
      if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
    };
  }, []);

  const value = { currentUser, loading, login, loginWithGoogle, signup, logout, resetPassword };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
