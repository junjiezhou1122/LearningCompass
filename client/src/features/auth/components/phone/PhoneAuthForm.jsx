import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";
import { usePhoneAuth } from "../../hooks/usePhoneAuth";

export default function PhoneAuthForm({ onSuccess }) {
  const {
    phoneNumber,
    setPhoneNumber,
    verificationCode,
    setVerificationCode,
    isCodeSent,
    handlePhoneSubmit,
    handleVerifyCode
  } = usePhoneAuth(onSuccess);

  return (
    <div className="grid gap-6 py-4">
      {!isCodeSent ? (
        <form onSubmit={handlePhoneSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="phoneNumber"
                  placeholder="Enter your phone number"
                  className="pl-10"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">Send Code</Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                placeholder="Enter the 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">
                A verification code has been sent to {phoneNumber}
              </p>
            </div>
            <Button type="submit" className="w-full">Verify</Button>
          </div>
        </form>
      )}
    </div>
  );
}
