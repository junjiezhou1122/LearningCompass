/**
 * authToken.js
 * Utility functions for JWT token validation and error handling
 */

/**
 * Check if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} True if token is expired or invalid
 */
export function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    // Split the token and get the payload part
    const payload = token.split('.')[1];
    if (!payload) return true;
    
    // Decode the base64 payload
    const decodedPayload = atob(payload);
    const payloadData = JSON.parse(decodedPayload);
    
    // Check if token has an expiration date
    if (!payloadData.exp) return false; // No expiration = not expired
    
    // Compare expiration timestamp with current time
    const expirationTime = payloadData.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    return currentTime >= expirationTime;
  } catch (error) {
    console.error('Error validating token:', error);
    return true; // If we can't validate it, consider it expired
  }
}

/**
 * Get detailed error message for token validation issues
 * @param {string} token - The JWT token to check
 * @returns {string} Error message describing the problem
 */
export function getTokenErrorMessage(token) {
  if (!token) {
    return 'Authentication token is missing. Please log in.';
  }
  
  try {
    // Split the token
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return 'Invalid token format. Please log in again.';
    }
    
    // Decode payload
    const payload = parts[1];
    const decodedPayload = atob(payload);
    const payloadData = JSON.parse(decodedPayload);
    
    // Check for expiration
    if (payloadData.exp) {
      const expirationTime = payloadData.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      if (currentTime >= expirationTime) {
        // Calculate how long ago it expired
        const expiredAgo = Math.floor((currentTime - expirationTime) / 1000 / 60); // minutes
        
        if (expiredAgo < 60) {
          return `Your session expired ${expiredAgo} minute${expiredAgo !== 1 ? 's' : ''} ago. Please log in again.`;
        } else {
          const hours = Math.floor(expiredAgo / 60);
          return `Your session expired ${hours} hour${hours !== 1 ? 's' : ''} ago. Please log in again.`;
        }
      }
    }
    
    // If we reach here with a token, it's valid but there might be other issues
    return 'Your session is valid, but there may be a server issue. Please try again.';
    
  } catch (error) {
    console.error('Error parsing token:', error);
    return 'Your authentication token is corrupted. Please log in again.';
  }
}

/**
 * Get user ID from JWT token
 * @param {string} token - The JWT token
 * @returns {number|null} User ID or null if token is invalid
 */
export function getUserIdFromToken(token) {
  if (!token || isTokenExpired(token)) return null;
  
  try {
    // Split and decode the token payload
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    const payloadData = JSON.parse(decodedPayload);
    
    return payloadData.id || null;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
}

/**
 * Refresh the token (placeholder for future implementation)
 * @returns {Promise<string|null>} New token or null if refresh fails
 */
export async function refreshToken() {
  try {
    // This would be implemented with a call to a token refresh endpoint
    // For now, just return null
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}
