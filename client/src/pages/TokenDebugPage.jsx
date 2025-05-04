import React from 'react';
import TokenHelper from '@/components/TokenHelper';
import { useTitle } from '@/hooks/use-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export default function TokenDebugPage() {
  useTitle('Token Debugger');

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-3xl font-bold mb-8 text-orange-700">Authentication Token Debugger</h1>
      
      <Alert className="mb-8">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>About This Tool</AlertTitle>
        <AlertDescription>
          <p className="text-sm mb-2">
            This page helps you diagnose authentication issues by testing your JWT token's validity and checking
            the entire authentication flow.
          </p>
          <p className="text-sm">
            If you're experiencing "Invalid or expired token" errors or 401 Unauthorized responses,
            use this tool to identify the source of the problem.
          </p>
        </AlertDescription>
      </Alert>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Authentication Flow</CardTitle>
          <CardDescription>
            How JWT authentication works in this application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 text-sm">
            <div className="flex items-start">
              <div className="bg-orange-100 text-orange-700 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 mt-0.5">1</div>
              <div>
                <strong>Login:</strong> When you log in, the server generates a JWT token containing your user data
                and signs it with a secret key.
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-orange-100 text-orange-700 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 mt-0.5">2</div>
              <div>
                <strong>Token Storage:</strong> The token is stored in your browser's localStorage with the key "token".
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-orange-100 text-orange-700 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 mt-0.5">3</div>
              <div>
                <strong>API Requests:</strong> For authenticated requests, the token is sent in the Authorization header
                as "Bearer [token]".
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-orange-100 text-orange-700 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 mt-0.5">4</div>
              <div>
                <strong>Server Validation:</strong> The server verifies the token's signature and checks if it has expired
                (tokens expire after 24 hours).
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-orange-100 text-orange-700 rounded-full w-6 h-6 flex items-center justify-center font-bold mr-3 mt-0.5">5</div>
              <div>
                <strong>Access Control:</strong> If the token is valid, access is granted to the protected resource.
                Otherwise, a 401 Unauthorized response is returned.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TokenHelper />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Common Issues</CardTitle>
          <CardDescription>
            Troubleshooting authentication problems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Token Expired</h3>
              <p>JWT tokens expire after 24 hours. If your token has expired, you need to log out and log back in.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Invalid Token Format</h3>
              <p>
                Tokens must be in the correct JWT format. If your token is corrupted or modified,
                it will be rejected by the server.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Missing Authorization Header</h3>
              <p>
                API requests to protected routes must include the token in the Authorization header.
                This page can help diagnose if the token is properly being sent.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Server Secret Key Changed</h3>
              <p>
                If the server's JWT secret key was changed, all previously issued tokens become invalid.
                Contact your administrator if you suspect this is the case.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
