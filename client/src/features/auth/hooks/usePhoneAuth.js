import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function usePhoneAuth(onSuccess) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  
  const { sendPhoneVerification, verifyPhoneCode } = useAuth();
  const { toast } = useToast();

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
      toast({
        title: "Success",
        description: "Verification code sent to your phone",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
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
      setIsCodeSent(false);
      setPhoneNumber("");
      setVerificationCode("");
      toast({
        title: "Success",
        description: "Phone number verified successfully",
        variant: "success",
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    }
  };

  return {
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    isCodeSent,
    handlePhoneSubmit,
    handleVerifyCode
  };
}
