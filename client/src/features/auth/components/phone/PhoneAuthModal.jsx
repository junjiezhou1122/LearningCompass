import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Phone } from "lucide-react";
import PhoneAuthForm from "./PhoneAuthForm";

export default function PhoneAuthModal({ isOpen, onOpenChange }) {
  const handleSuccess = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Authentication
          </DialogTitle>
          <DialogDescription>
            Verify your identity by authenticating with your phone number
          </DialogDescription>
        </DialogHeader>

        <PhoneAuthForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
