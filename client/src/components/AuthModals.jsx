import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
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
  Phone,
  Github,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FcGoogle } from "react-icons/fc";

export default function AuthModals() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);

  const {
    login,
    register,
    loginWithGoogle,
    loginWithGithub,
    sendPhoneVerification,
    verifyPhoneCode,
  } = useAuth();
  const { toast } = useToast();

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

  // Handle phone number submission
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendPhoneVerification(phoneNumber);
      setIsCodeSent(true);
    } catch (error) {
      console.error("Phone verification error:", error);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    try {
      await verifyPhoneCode(verificationCode);
      setIsPhoneModalOpen(false);
      setIsCodeSent(false);
      setPhoneNumber("");
      setVerificationCode("");
    } catch (error) {
      console.error("Code verification error:", error);
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
        title: "Error",
        description: "Please fill in all fields.",
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
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!registerForm.acceptTerms) {
      toast({
        title: "Error",
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
          variant="ghost"
          onClick={() => setIsLoginOpen(true)}
          className="text-white hover:text-white hover:bg-amber-600/80 transition-all duration-500 flex items-center gap-2"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
        <Button
          onClick={() => setIsRegisterOpen(true)}
          className="bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700 transition-all duration-500 flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Sign Up
        </Button>
      </div>

      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In
            </DialogTitle>
            <DialogDescription>
              Enter your credentials to access your account
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLoginSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    placeholder="your_username"
                    className="pl-10"
                    value={loginForm.username}
                    onChange={handleLoginChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm"
                    type="button"
                  >
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-2 text-muted-foreground text-sm">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              type="button"
              className="flex gap-2 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300"
              onClick={handleGoogleLogin}
            >
              <FcGoogle className="h-5 w-5" />
              <span>Google</span>
            </Button>
            <Button
              variant="outline"
              type="button"
              className="flex gap-2 hover:bg-gray-900 hover:text-white transition-all duration-300"
              onClick={handleGithubLogin}
            >
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </Button>
            <Button
              variant="outline"
              type="button"
              className="flex gap-2 hover:bg-green-50 hover:text-green-600 transition-all duration-300"
              onClick={() => {
                setIsLoginOpen(false);
                setIsPhoneModalOpen(true);
              }}
            >
              <Phone className="h-5 w-5" />
              <span>Phone</span>
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            <p>
              Don't have an account?{" "}
              <Button
                variant="link"
                onClick={switchToRegister}
                className="p-0 h-auto"
              >
                Sign up
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phone Authentication Modal */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Authentication
            </DialogTitle>
            <DialogDescription>
              {isCodeSent
                ? "Enter the verification code sent to your phone"
                : "Enter your phone number to receive a verification code"}
            </DialogDescription>
          </DialogHeader>

          {!isCodeSent ? (
            <form onSubmit={handlePhoneSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      className="pl-10"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div id="recaptcha-container"></div>
              </div>
              <Button type="submit" className="w-full">
                Send Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Verify Code
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create Account
            </DialogTitle>
            <DialogDescription>
              Join EduRecommend to get personalized course recommendations
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={registerForm.firstName}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={registerForm.lastName}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    placeholder="your_username"
                    className="pl-10"
                    value={registerForm.username}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="8+ characters, 1 uppercase, 1 number"
                    className="pl-10"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    className="pl-10"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={registerForm.acceptTerms}
                  onCheckedChange={(checked) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      acceptTerms: checked === true,
                    }))
                  }
                />
                <label
                  htmlFor="acceptTerms"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mt-0.5"
                >
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <p>
              Already have an account?{" "}
              <Button
                variant="link"
                onClick={switchToLogin}
                className="p-0 h-auto"
              >
                Sign in
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
