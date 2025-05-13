import { createContext, useState, useEffect, useContext } from "react";
import { useToast } from "../hooks/use-toast";
import { auth, signInWithGoogle as firebaseSignInWithGoogle, signInWithGithub as firebaseSignInWithGithub, handleRedirectResult } from "../lib/firebase";
import { getApiBaseUrl } from "../lib/utils";

// Create auth context
const AuthContext = createContext(null);

// Export the context so it can be imported directly in the use-auth hook
export { AuthContext };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const apiBaseUrl = getApiBaseUrl();

  // Initialize auth state from localStorage and check for redirect auth result
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First check if there's a stored user
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
        
        // Then check if there's a redirect result from Firebase authentication
        const redirectResult = await handleRedirectResult();
        if (redirectResult) {
          console.log("Got Firebase redirect result:", redirectResult);
          // Process the result similar to direct login
          try {
            // Get the Firebase ID token
            const idToken = await redirectResult.getIdToken();
            
            if (idToken) {
              // Try to send to backend
              try {
                const data = await handleAuthRequest("google", { token: idToken });
                
                // Process user data from backend
                const normalizedUser = {
                  ...data.user,
                  firstName: data.user.firstName || null,
                  lastName: data.user.lastName || null,
                  phoneNumber: data.user.phoneNumber || null,
                  photoURL: data.user.photoURL || redirectResult.photoURL || null,
                };
                
                // Save auth data
                localStorage.setItem("user", JSON.stringify(normalizedUser));
                localStorage.setItem("token", data.token);
                
                setUser(normalizedUser);
                setToken(data.token);
                
                toast({
                  title: "Login successful",
                  description: `Welcome, ${normalizedUser.username}!`,
                });
              } catch (serverError) {
                console.error("Backend connection failed after redirect:", serverError);
                
                // Fallback to Firebase user if server is down
                const userData = {
                  id: redirectResult.uid,
                  email: redirectResult.email,
                  username: redirectResult.displayName || redirectResult.email.split("@")[0],
                  photoURL: redirectResult.photoURL,
                  firstName: redirectResult.displayName ? redirectResult.displayName.split(" ")[0] : null,
                  lastName: redirectResult.displayName && redirectResult.displayName.split(" ").length > 1
                    ? redirectResult.displayName.split(" ").slice(1).join(" ") : null,
                  phoneNumber: redirectResult.phoneNumber || null,
                };
                
                // Save temporary user data
                localStorage.setItem("user", JSON.stringify(userData));
                localStorage.setItem("token", idToken);
                
                setUser(userData);
                setToken(idToken);
                
                toast({
                  title: "Limited Login",
                  description: "Connected to authentication but not to database. Some features may be limited.",
                  variant: "warning",
                });
              }
            }
          } catch (tokenError) {
            console.error("Failed to process redirect result:", tokenError);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [toast]);

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
      const githubUser = await firebaseSignInWithGithub();
      
      // If we don't have a githubUser object, it means the auth was done via redirect
      // and we will handle it in the useEffect
      if (!githubUser) return;

      // Step 2: Get the Firebase ID token
      const idToken = await githubUser.getIdToken();

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
          photoURL: data.user.photoURL || githubUser.photoURL || null,
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
          id: githubUser.uid,
          email: githubUser.email,
          username:
            githubUser.displayName || (githubUser.email ? githubUser.email.split("@")[0] : `user_${githubUser.uid.substring(0, 8)}`),
          photoURL: githubUser.photoURL,
          firstName: githubUser.displayName
            ? githubUser.displayName.split(" ")[0]
            : null,
          lastName:
            githubUser.displayName &&
            githubUser.displayName.split(" ").length > 1
              ? githubUser.displayName.split(" ").slice(1).join(" ")
              : null,
          phoneNumber: githubUser.phoneNumber || null,
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
