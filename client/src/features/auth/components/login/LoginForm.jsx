import { useLoginForm } from "../../hooks/useLoginForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AtSign, Lock } from "lucide-react";

export default function LoginForm({ onSuccess }) {
  const { loginForm, isSubmitting, handleLoginChange, handleLoginSubmit } = useLoginForm(onSuccess);

  return (
    <form onSubmit={handleLoginSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="username">Username or Email</Label>
          <div className="relative">
            <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username or email"
              className="pl-10"
              value={loginForm.username}
              onChange={handleLoginChange}
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
              placeholder="Enter your password"
              className="pl-10"
              value={loginForm.password}
              onChange={handleLoginChange}
              required
            />
          </div>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}
