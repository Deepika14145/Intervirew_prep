import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from "firebase/auth";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    // Subscribe to Firebase Auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setLoading(false);
            
            // If logged in, get the auth token (JWT) to send to our backend
            if (user) {
                const token = await user.getIdToken();
                // Store token in localStorage for easy access by Axios/fetch
                localStorage.setItem("authToken", token);

                // Instantly sync the user with our backend database!
                fetch("http://localhost:5000/api/auth/sync", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                }).catch(err => console.error("Database sync failed:", err));

            } else {
                localStorage.removeItem("authToken");
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
