import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  School,
  Mail,
  Lock,
  User,
  Facebook,
  LogIn,
  UserPlus,
  Github,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FcGoogle } from "react-icons/fc";

export default function AuthModals() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
  } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  // Handle login with Google
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setIsLoginOpen(false);
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  // Handle login with GitHub
  const handleGithubLogin = async () => {
    try {
      await loginWithGithub();
      setIsLoginOpen(false);
    } catch (error) {
      console.error("GitHub login error:", error);
    }
  };

  // Handle login form input changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle register form input changes
  const handleRegisterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!loginForm.username || !loginForm.password) {
      toast({
        title: t("error"),
        description: t("pleaseEnterMessage"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await login(loginForm);
      setIsLoginOpen(false);
      setLoginForm({ username: "", password: "" });
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle register form submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (
      !registerForm.firstName ||
      !registerForm.lastName ||
      !registerForm.email ||
      !registerForm.username ||
      !registerForm.password ||
      !registerForm.confirmPassword
    ) {
      toast({
        title: t("error"),
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: t("error"),
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!registerForm.acceptTerms) {
      toast({
        title: t("error"),
        description: "Please accept the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        username: registerForm.username,
        password: registerForm.password,
      });
      setIsRegisterOpen(false);
      setRegisterForm({
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
      });
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch between login and register modals
  const switchToRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const switchToLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setIsLoginOpen(true)}
          className="items-center gap-2"
          variant="ghost"
        >
          <LogIn className="h-5 w-5" />
          {t("login")}
        </Button>
        <Button
          onClick={() => setIsRegisterOpen(true)}
          className="items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          {t("register")}
        </Button>
      </div>

      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <LogIn className="h-6 w-6" />
              {t("loginToAccount")}
            </DialogTitle>
            <DialogDescription>
              {t("enterCredentials")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">{t("username")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="login-username"
                  name="username"
                  placeholder={t("yourUsername")}
                  className="pl-10"
                  value={loginForm.username}
                  onChange={handleLoginChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">{t("password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder={t("yourPassword")}
                  className="pl-10"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="link"
                className="px-0 text-sm"
                onClick={switchToRegister}
              >
                {t("dontHaveAccount")}
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("loggingIn") : t("login")}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="gap-2"
            >
              <FcGoogle className="h-5 w-5" />
              <span>Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleGithubLogin}
              className="gap-2"
            >
              <Github className="h-5 w-5" />
              <span>Github</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <UserPlus className="h-6 w-6" />
              {t("createAccount")}
            </DialogTitle>
            <DialogDescription>
              {t("joinLearningCompass")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">{t("firstName")}</Label>
                <Input
                  id="first-name"
                  name="firstName"
                  placeholder="John"
                  value={registerForm.firstName}
                  onChange={handleRegisterChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">{t("lastName")}</Label>
                <Input
                  id="last-name"
                  name="lastName"
                  placeholder="Doe"
                  value={registerForm.lastName}
                  onChange={handleRegisterChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">{t("email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder={t("yourEmail")}
                  className="pl-10"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-username">{t("username")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="register-username"
                  name="username"
                  placeholder={t("chooseUsername")}
                  className="pl-10"
                  value={registerForm.username}
                  onChange={handleRegisterChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">{t("password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  placeholder={t("createPassword")}
                  className="pl-10"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">{t("confirmPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder={t("confirmYourPassword")}
                  className="pl-10"
                  value={registerForm.confirmPassword}
                  onChange={handleRegisterChange}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                name="acceptTerms"
                checked={registerForm.acceptTerms}
                onCheckedChange={(checked) =>
                  setRegisterForm((prev) => ({
                    ...prev,
                    acceptTerms: checked,
                  }))
                }
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("acceptTerms")}
              </label>
            </div>

            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="link"
                className="px-0 text-sm"
                onClick={switchToLogin}
              >
                {t("alreadyHaveAccount")}
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("registering") : t("createAccount")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
