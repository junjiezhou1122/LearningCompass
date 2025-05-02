import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import RegisterForm from "./RegisterForm";

export default function RegisterModal({ isOpen, onOpenChange }) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create an Account
          </DialogTitle>
          <DialogDescription>
            Sign up to access all features and personalize your experience
          </DialogDescription>
        </DialogHeader>

        <RegisterForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
