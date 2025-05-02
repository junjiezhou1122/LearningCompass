import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useSocialAuth(onSuccess) {
  const { loginWithGoogle, loginWithFacebook, loginWithGithub } = useAuth();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast({
        title: "Success",
        description: "Successfully logged in with Google",
        variant: "success",
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to login with Google",
        variant: "destructive",
      });
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook();
      toast({
        title: "Success",
        description: "Successfully logged in with Facebook",
        variant: "success",
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to login with Facebook",
        variant: "destructive",
      });
    }
  };

  const handleGithubLogin = async () => {
    try {
      await loginWithGithub();
      toast({
        title: "Success",
        description: "Successfully logged in with GitHub",
        variant: "success",
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to login with GitHub",
        variant: "destructive",
      });
    }
  };

  return {
    handleGoogleLogin,
    handleFacebookLogin,
    handleGithubLogin
  };
}
