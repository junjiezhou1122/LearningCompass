import fetch from 'node-fetch';

// If fetch is not available, install it using packager_tool

async function testAvailableUsersApi() {
  // Get JWT token from first command line argument
  const token = process.argv[2];
  
  if (!token) {
    console.error('Please provide a JWT token as the first argument');
    process.exit(1);
  }
  
  try {
    console.log('Testing /api/users/available endpoint...');
    const response = await fetch('http://localhost:5000/api/users/available', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Successfully retrieved', data.length, 'users');
      console.log('First few users:', data.slice(0, 2));
    } else {
      const errorText = await response.text();
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAvailableUsersApi();
