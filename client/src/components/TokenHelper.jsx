import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// This component is used to debug token issues by validating tokens against the server
export default function TokenHelper() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isTestingRequest, setIsTestingRequest] = useState(false);
  const [requestResult, setRequestResult] = useState(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const validateToken = async () => {
    if (!token) {
      toast({
        title: "Error",
        description: "No token provided",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      setValidationResult(data);
      
      toast({
        title: data.valid ? "Token is valid" : "Token is invalid",
        description: data.valid ? "Your token is valid and working correctly" : `Error: ${data.error}`,
        variant: data.valid ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error validating token:', error);
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to validate token",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const refreshToken = async () => {
    // Get current localStorage token
    const currentToken = localStorage.getItem('token');
    setToken(currentToken || '');
    
    toast({
      title: "Token Refreshed",
      description: currentToken ? "Current token loaded from localStorage" : "No token found in localStorage",
      variant: currentToken ? "default" : "destructive",
    });
  };

  // Test a request with the token to verify the entire auth flow
  const testAuthenticatedRequest = async () => {
    if (!token) {
      toast({
        title: "Error",
        description: "No token provided",
        variant: "destructive",
      });
      return;
    }

    setIsTestingRequest(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const status = response.status;
      const statusText = response.statusText;
      
      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        // If response is not JSON
      }

      const result = {
        url: '/api/profile',
        status,
        statusText,
        success: response.ok,
        data,
        headers: {
          'Authorization': `Bearer ${token.substring(0, 10)}...`,
        }
      };

      setRequestResult(result);
      
      toast({
        title: response.ok ? "Request Successful" : `Request Failed (${status})`,
        description: response.ok ? "The authenticated request was successful" : data?.message || statusText,
        variant: response.ok ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error testing authenticated request:', error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to make authenticated request",
        variant: "destructive",
      });
    } finally {
      setIsTestingRequest(false);
    }
  };

  // Watch for auth state changes
  useEffect(() => {
    // If user logs in/out, refresh token
    refreshToken();
  }, [isAuthenticated]);

  return (
    <Card className="w-full max-w-3xl mx-auto my-8 border-orange-200">
      <CardHeader>
        <CardTitle className="text-orange-700">Token Validation Tool</CardTitle>
        <CardDescription>
          Use this tool to validate JWT tokens and debug authentication issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Auth State Information */}
        <Alert>
          <AlertTitle>Authentication State</AlertTitle>
          <AlertDescription>
            {isAuthenticated ? (
              <div className="text-xs mt-1">
                <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded">Authenticated</span> - 
                User: {user?.username} (ID: {user?.id})
              </div>
            ) : (
              <div className="text-xs mt-1">
                <span className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded">Not Authenticated</span> - 
                No user is currently logged in
              </div>
            )}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="text-sm font-medium">Current Token</div>
          <Textarea 
            value={token} 
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your JWT token here"
            className="font-mono text-xs"
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4">
          <Button onClick={validateToken} disabled={isValidating || !token}>
            {isValidating ? 'Validating...' : 'Validate Token'}
          </Button>
          <Button variant="outline" onClick={refreshToken}>
            Refresh from localStorage
          </Button>
          <Button 
            variant="secondary" 
            onClick={testAuthenticatedRequest} 
            disabled={isTestingRequest || !token}
          >
            {isTestingRequest ? 'Testing...' : 'Test API Request'}
          </Button>
        </div>

        {validationResult && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4">
              <Alert variant={validationResult.valid ? "default" : "destructive"}>
                <AlertTitle>{validationResult.valid ? "Token is Valid" : "Token is Invalid"}</AlertTitle>
                <AlertDescription>
                  {validationResult.valid 
                    ? "Your token is valid and working correctly" 
                    : `Error: ${validationResult.error}`
                  }
                </AlertDescription>
              </Alert>
              
              {validationResult.valid && validationResult.payload && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Token Payload</div>
                  <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(validationResult.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}

        {requestResult && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4">
              <Alert variant={requestResult.success ? "default" : "destructive"}>
                <AlertTitle>
                  {requestResult.success 
                    ? "API Request Successful" 
                    : `API Request Failed (${requestResult.status})`}
                </AlertTitle>
                <AlertDescription>
                  Endpoint: <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{requestResult.url}</code>
                  <div className="text-xs mt-1">
                    {requestResult.success 
                      ? "The authenticated request was processed successfully" 
                      : requestResult.data?.message || requestResult.statusText
                    }
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Request Details</div>
                <div className="bg-slate-100 p-3 rounded">
                  <div className="text-xs mb-2"><strong>Headers:</strong></div>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(requestResult.headers, null, 2)}
                  </pre>
                  
                  <div className="text-xs mb-2 mt-3"><strong>Response:</strong></div>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(requestResult.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        This tool is for debugging purposes only. Do not share your tokens with anyone.
      </CardFooter>
    </Card>
  );
}
