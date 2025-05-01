import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Get the API base URL with the correct port
function getServerBaseUrl() {
  // In production, use the origin (same domain as client)
  if (process.env.NODE_ENV === "production") {
    return window.location.origin;
  }

  // In development, read port from env variable or use default (5000)
  const devPort = import.meta.env.VITE_API_PORT || "5000";
  return `http://localhost:${devPort}`;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  token?: string | null
): Promise<Response> {
  // Get token from localStorage if not provided
  const authToken = token || localStorage.getItem("token");

  const headers: Record<string, string> = {};

  // Add Content-Type header if we have data
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Add Authorization header if we have a token
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const apiBaseUrl = getServerBaseUrl();

  // Ensure the URL has the proper base URL if it's a relative path
  const fullUrl = url.startsWith("http") ? url : `${apiBaseUrl}${url}`;

  console.log("Making API request:", {
    method,
    url: fullUrl,
    hasToken: !!authToken,
    hasData: !!data,
  });

  try {
    // First check if the server is available with a simple ping
    try {
      // Timeout after 5 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Just check if the server base URL is reachable before making the actual request
      await fetch(apiBaseUrl, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (pingError) {
      console.error("Server connectivity check failed:", pingError);
      // Create a fake response to simulate a service unavailable error
      return new Response(
        JSON.stringify({
          message: "Server is currently unavailable. Please try again later.",
        }),
        {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Proceed with the actual request if server ping was successful
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      console.error("API request failed:", {
        status: res.status,
        statusText: res.statusText,
        url: fullUrl,
      });

      try {
        const errorData = await res.json();
        console.error("Error details:", errorData);
      } catch (e) {
        // If not JSON, just log the text
        try {
          const errorText = await res.text();
          console.error("Error response:", errorText);
        } catch (textError) {
          console.error("Could not read error response body:", textError);
        }
      }
    }

    return res; // Return the response without throwing, let caller handle it
  } catch (error) {
    console.error("Network error during API request:", error);

    // Create a fake response instead of throwing to allow the caller to handle it gracefully
    return new Response(
      JSON.stringify({
        message:
          "Network error. Please check your internet connection or try again later.",
        originalError: error.message,
      }),
      {
        status: 500,
        statusText: "Network Error",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get the token from localStorage for authenticated requests
    const token = localStorage.getItem("token");

    const headers: Record<string, string> = {};

    // Add Authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const apiBaseUrl = getServerBaseUrl();

    // Ensure the URL has the proper base URL if it's a relative path
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith("http") ? url : `${apiBaseUrl}${url}`;

    console.log("Making query request:", {
      url: fullUrl,
      hasToken: !!token,
    });

    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.warn("Unauthorized access to:", fullUrl);
      return null;
    }

    if (!res.ok) {
      console.error("Query request failed:", {
        status: res.status,
        statusText: res.statusText,
        url: fullUrl,
      });

      try {
        const errorData = await res.json();
        console.error("Error details:", errorData);
      } catch (e) {
        // If not JSON, just log the text
        const errorText = await res.text();
        console.error("Error response:", errorText);
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
