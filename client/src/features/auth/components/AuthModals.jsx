import { useState } from "react";

import LoginModal from "./login/LoginModal";
import RegisterModal from "./register/RegisterModal";
import PhoneAuthModal from "./phone/PhoneAuthModal";
import AuthButtons from "./AuthButtons";

export default function AuthModals() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  // Switch between login and register modals
  const switchToRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const switchToLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const openPhoneAuth = () => {
    setIsPhoneModalOpen(true);
  };

  return (
    <>
      <AuthButtons 
        onLoginClick={() => setIsLoginOpen(true)}
        onRegisterClick={() => setIsRegisterOpen(true)}
      />

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        onRegisterClick={switchToRegister}
        onPhoneAuth={openPhoneAuth}
      />

      {/* Register Modal */}
      <RegisterModal 
        isOpen={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        onLoginClick={switchToLogin}
      />

      {/* Phone Authentication Modal */}
      <PhoneAuthModal 
        isOpen={isPhoneModalOpen}
        onOpenChange={setIsPhoneModalOpen}
      />
    </>
  );
}
