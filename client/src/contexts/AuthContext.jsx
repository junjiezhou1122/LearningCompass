import { createContext, useState, useEffect, useContext } from "react";
import { useToast } from "../hooks/use-toast";
import {
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../lib/firebase";

// Create auth context
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  // Register a new user
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Save auth data
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      setUser(data.user);
      setToken(data.token);

      toast({
        title: "Registration successful",
        description: "Welcome to EduRecommend!",
      });

      return data;
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);

      // Send the Google token to your backend
      const response = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: await result.user.getIdToken(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Google login failed");
      }

      // Save auth data
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      setUser(data.user);
      setToken(data.token);

      toast({
        title: "Login successful",
        description: `Welcome, ${data.user.username}!`,
      });

      return data;
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login with GitHub
  const loginWithGithub = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, githubProvider);

      // Send the GitHub token to your backend
      const response = await fetch("/api/auth/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: await result.user.getIdToken(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "GitHub login failed");
      }

      // Save auth data
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      setUser(data.user);
      setToken(data.token);

      toast({
        title: "Login successful",
        description: `Welcome, ${data.user.username}!`,
      });

      return data;
    } catch (error) {
      toast({
        title: "GitHub login failed",
        description: error.message,
        variant: "destructive",
      });
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

      // Send the phone auth token to your backend
      const response = await fetch("/api/auth/phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: await result.user.getIdToken(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Phone verification failed");
      }

      // Save auth data
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      setUser(data.user);
      setToken(data.token);

      toast({
        title: "Login successful",
        description: `Welcome, ${data.user.username}!`,
      });

      return data;
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login an existing user
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save auth data
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      setUser(data.user);
      setToken(data.token);

      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.username}!`,
      });

      return data;
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
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
