import { Button } from "@/components/ui/button";
import { Github, Phone } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useSocialAuth } from "../../hooks/useSocialAuth";

export default function SocialLogin({ onPhoneAuth, onSocialSuccess }) {
  const { handleGoogleLogin, handleGithubLogin } = useSocialAuth();
  
  const handleGoogle = async () => {
    const success = await handleGoogleLogin();
    if (success && onSocialSuccess) onSocialSuccess();
  };
  
  const handleGithub = async () => {
    const success = await handleGithubLogin();
    if (success && onSocialSuccess) onSocialSuccess();
  };
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <Button
        variant="outline"
        type="button"
        className="flex gap-2 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300"
        onClick={handleGoogle}
      >
        <FcGoogle className="h-5 w-5" />
        <span>Google</span>
      </Button>
      <Button
        variant="outline"
        type="button"
        className="flex gap-2 hover:bg-gray-900 hover:text-white transition-all duration-300"
        onClick={handleGithub}
      >
        <Github className="h-5 w-5" />
        <span>GitHub</span>
      </Button>
      <Button
        variant="outline"
        type="button"
        className="flex gap-2 hover:bg-green-50 hover:text-green-600 transition-all duration-300"
        onClick={onPhoneAuth}
      >
        <Phone className="h-5 w-5" />
        <span>Phone</span>
      </Button>
    </div>
  );
}
