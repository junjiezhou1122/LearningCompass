import { useRegisterForm } from "../../hooks/useRegisterForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AtSign, User, Lock } from "lucide-react";

export default function RegisterForm({ onSuccess }) {
  const { registerForm, isSubmitting, handleRegisterChange, handleRegisterSubmit } = useRegisterForm(onSuccess);

  const handleCheckboxChange = (checked) => {
    const event = {
      target: {
        name: "acceptTerms",
        type: "checkbox",
        checked
      }
    };
    handleRegisterChange(event);
  };

  return (
    <form onSubmit={handleRegisterSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                className="pl-10"
                value={registerForm.firstName}
                onChange={handleRegisterChange}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Doe"
              value={registerForm.lastName}
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
              type="text"
              placeholder="johndoe"
              className="pl-10"
              value={registerForm.username}
              onChange={handleRegisterChange}
              required
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@example.com"
              className="pl-10"
              value={registerForm.email}
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
              placeholder="Create a password"
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
              placeholder="Confirm your password"
              className="pl-10"
              value={registerForm.confirmPassword}
              onChange={handleRegisterChange}
              required
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox 
            id="acceptTerms" 
            checked={registerForm.acceptTerms} 
            onCheckedChange={handleCheckboxChange}
          />
          <label
            htmlFor="acceptTerms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I accept the Terms of Service and Privacy Policy
          </label>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  );
}
