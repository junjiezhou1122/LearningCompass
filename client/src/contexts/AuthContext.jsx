import { createContext, useState, useEffect, useContext } from "react";
import { useToast } from "../hooks/use-toast";
import { RecaptchaVerifier } from "firebase/auth";
import { auth, signInWithGoogle as firebaseSignInWithGoogle } from "../lib/firebase";
import { getApiBaseUrl } from "../lib/utils";

// Create auth context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const apiBaseUrl = getApiBaseUrl();

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false);
  }, []);

  // Helper function to handle API requests
  const handleAuthRequest = async (endpoint, body) => {
    try {
      console.log(`Making request to ${apiBaseUrl}/api/auth/${endpoint}`);

      const response = await fetch(`${apiBaseUrl}/api/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include", // Include cookies for cross-origin requests
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from server: ${errorText}`);

        try {
          // Try to parse as JSON if possible
          const errorData = JSON.parse(errorText);
          throw new Error(
            errorData.message ||
              `${endpoint} failed with status: ${response.status}`
          );
        } catch (e) {
          // If not JSON, throw with status code
          throw new Error(
            `${endpoint} failed with status: ${response.status}. Server might not be running or endpoint is incorrect.`
          );
        }
      }

      // Now we know response is ok, try to parse JSON
      try {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error(
            `Server returned non-JSON content type: ${contentType}`
          );
          console.error(`Response body: ${text.substring(0, 200)}...`);
          throw new Error(
            `Server returned non-JSON response. API endpoint may be incorrect or server is not running.`
          );
        }

        return await response.json();
      } catch (error) {
        console.error(`JSON parsing error: ${error.message}`);
        throw new Error(`Invalid JSON response from server: ${error.message}`);
      }
    } catch (error) {
      console.error(`${endpoint} error:`, error);
      toast({
        title: `${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)} failed`,
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Register a new user
  const register = async (userData) => {
    try {
      setLoading(true);
      const data = await handleAuthRequest("register", userData);

      // Ensure user object has all necessary fields
      const normalizedUser = {
        ...data.user,
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        phoneNumber: data.user.phoneNumber || null,
        photoURL: data.user.photoURL || null,
      };

      // Save auth data
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      localStorage.setItem("token", data.token);

      setUser(normalizedUser);
      setToken(data.token);

      toast({
        title: "Registration successful",
        description: "Welcome to Learning Compass!",
      });

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true);

      // Step 1: Use Firebase's direct authentication
      const googleUser = await firebaseSignInWithGoogle();

      // Step 2: Get the Firebase ID token
      const idToken = await googleUser.getIdToken();

      if (!idToken) {
        throw new Error("Failed to get Firebase ID token");
      }

      // Step 3: Send the token to our backend for database integration
      try {
        const data = await handleAuthRequest("google", { token: idToken });

        // Ensure user object has all necessary fields
        const normalizedUser = {
          ...data.user,
          firstName: data.user.firstName || null,
          lastName: data.user.lastName || null,
          phoneNumber: data.user.phoneNumber || null,
          photoURL: data.user.photoURL || googleUser.photoURL || null,
        };

        // Save auth data from our database
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        localStorage.setItem("token", data.token);

        setUser(normalizedUser);
        setToken(data.token);

        toast({
          title: "Login successful",
          description: `Welcome, ${normalizedUser.username}!`,
        });

        return { user: normalizedUser, token: data.token };
      } catch (serverError) {
        console.error("Backend server connection failed:", serverError);

        // Fallback to using just Firebase user if server is down
        toast({
          title: "Limited Login",
          description:
            "Connected to authentication but not to database. Some features may be limited.",
          variant: "warning",
        });

        // Create a temporary user from Firebase data
        const userData = {
          id: googleUser.uid,
          email: googleUser.email,
          username:
            googleUser.displayName || googleUser.email.split("@")[0],
          photoURL: googleUser.photoURL,
          firstName: googleUser.displayName
            ? googleUser.displayName.split(" ")[0]
            : null,
          lastName:
            googleUser.displayName &&
            googleUser.displayName.split(" ").length > 1
              ? googleUser.displayName.split(" ").slice(1).join(" ")
              : null,
          phoneNumber: googleUser.phoneNumber || null,
        };

        // Save temporary user data
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", idToken);

        setUser(userData);
        setToken(idToken);

        return { user: userData, token: idToken };
      }
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login with GitHub
  const loginWithGithub = async () => {
    try {
      setLoading(true);

      // Step 1: Use Firebase's direct authentication
      const result = await signInWithPopup(auth, githubProvider);

      // Step 2: Get the Firebase ID token
      const idToken = await result.user.getIdToken();

      if (!idToken) {
        throw new Error("Failed to get Firebase ID token");
      }

      // Step 3: Send the token to our backend for database integration
      try {
        const data = await handleAuthRequest("github", { token: idToken });

        // Ensure user object has all necessary fields
        const normalizedUser = {
          ...data.user,
          firstName: data.user.firstName || null,
          lastName: data.user.lastName || null,
          phoneNumber: data.user.phoneNumber || null,
          photoURL: data.user.photoURL || result.user.photoURL || null,
        };

        // Save auth data from our database
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        localStorage.setItem("token", data.token);

        setUser(normalizedUser);
        setToken(data.token);

        toast({
          title: "Login successful",
          description: `Welcome, ${normalizedUser.username}!`,
        });

        return { user: normalizedUser, token: data.token };
      } catch (serverError) {
        console.error("Backend server connection failed:", serverError);

        // Fallback to using just Firebase user if server is down
        toast({
          title: "Limited Login",
          description:
            "Connected to authentication but not to database. Some features may be limited.",
          variant: "warning",
        });

        // Create a temporary user from Firebase data
        const firebaseUser = result.user;
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          username:
            firebaseUser.displayName ||
            (firebaseUser.email
              ? firebaseUser.email.split("@")[0]
              : `user_${firebaseUser.uid.substring(0, 8)}`),
          photoURL: firebaseUser.photoURL,
          firstName: firebaseUser.displayName
            ? firebaseUser.displayName.split(" ")[0]
            : null,
          lastName:
            firebaseUser.displayName &&
            firebaseUser.displayName.split(" ").length > 1
              ? firebaseUser.displayName.split(" ").slice(1).join(" ")
              : null,
          phoneNumber: firebaseUser.phoneNumber || null,
        };

        // Save temporary user data
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", idToken);

        setUser(userData);
        setToken(idToken);

        return { user: userData, token: idToken };
      }
    } catch (error) {
      console.error("GitHub login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Setup phone number verification
  const setupPhoneAuth = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "normal",
          callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
          },
          "expired-callback": () => {
            // Response expired. Ask user to solve reCAPTCHA again.
            toast({
              title: "reCAPTCHA expired",
              description: "Please verify again",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  // Send phone verification code
  const sendPhoneVerification = async (phoneNumber) => {
    try {
      setupPhoneAuth();
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;

      toast({
        title: "Verification code sent",
        description: "Please check your phone",
      });
    } catch (error) {
      toast({
        title: "Failed to send code",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Verify phone code and login
  const verifyPhoneCode = async (code) => {
    try {
      setLoading(true);
      const result = await window.confirmationResult.confirm(code);
      const idToken = await result.user.getIdToken();

      // Try to connect to the backend server
      try {
        const data = await handleAuthRequest("phone", { token: idToken });

        // Ensure user object has all necessary fields
        const normalizedUser = {
          ...data.user,
          firstName: data.user.firstName || null,
          lastName: data.user.lastName || null,
          phoneNumber: data.user.phoneNumber || result.user.phoneNumber || null,
          photoURL: data.user.photoURL || null,
        };

        // Save auth data from our database
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        localStorage.setItem("token", data.token);

        setUser(normalizedUser);
        setToken(data.token);

        toast({
          title: "Login successful",
          description: `Welcome, ${normalizedUser.username}!`,
        });

        return { user: normalizedUser, token: data.token };
      } catch (serverError) {
        console.error("Backend server connection failed:", serverError);

        // Fallback to using just Firebase user if server is down
        toast({
          title: "Limited Login",
          description:
            "Connected to authentication but not to database. Some features may be limited.",
          variant: "warning",
        });

        // Create a temporary user from Firebase data
        const firebaseUser = result.user;
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          username:
            firebaseUser.displayName ||
            `user_${firebaseUser.uid.substring(0, 8)}`,
          photoURL: firebaseUser.photoURL,
          firstName: null,
          lastName: null,
          phoneNumber: firebaseUser.phoneNumber || null,
        };

        // Save temporary user data
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", idToken);

        setUser(userData);
        setToken(idToken);

        return { user: userData, token: idToken };
      }
    } catch (error) {
      console.error("Phone verification error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login an existing user
  const login = async (credentials) => {
    try {
      setLoading(true);
      const data = await handleAuthRequest("login", credentials);

      // Ensure user object has all necessary fields
      const normalizedUser = {
        ...data.user,
        firstName: data.user.firstName || null,
        lastName: data.user.lastName || null,
        phoneNumber: data.user.phoneNumber || null,
        photoURL: data.user.photoURL || null,
      };

      // Save auth data
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      localStorage.setItem("token", data.token);

      setUser(normalizedUser);
      setToken(data.token);

      toast({
        title: "Login successful",
        description: `Welcome back, ${normalizedUser.username}!`,
      });

      return { user: normalizedUser, token: data.token };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout the current user
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);

    // Also sign out from Firebase
    auth.signOut().catch((error) => {
      console.error("Firebase signout error:", error);
    });

    toast({
      title: "Logged out successfully",
    });
  };

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        register,
        login,
        logout,
        loginWithGoogle,
        loginWithGithub,
        sendPhoneVerification,
        verifyPhoneCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
