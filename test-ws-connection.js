import WebSocket from 'ws';

// Get the protocol (ws for HTTP, wss for HTTPS)
const protocol = 'ws';
const host = 'localhost:5000';
const token = '1'; // Using a numeric user ID which may exist in the database

// Construct the WebSocket URL
const wsUrl = `${protocol}://${host}/ws?token=${token}`;
console.log('Attempting to connect to:', wsUrl);

// Create WebSocket connection
const socket = new WebSocket(wsUrl);

// Connection opened
socket.addEventListener('open', (event) => {
  console.log('WebSocket connection established!');
  
  // Send an authentication message
  socket.send(JSON.stringify({
    type: 'auth',
    data: { token },
    token
  }));
  
  console.log('Auth message sent');
});

// Listen for messages
socket.addEventListener('message', (event) => {
  console.log('Message from server:', event.data);
  try {
    const data = JSON.parse(event.data);
    console.log('Parsed message type:', data.type);
  } catch (e) {
    console.error('Error parsing message:', e);
  }
});

// Listen for errors
socket.addEventListener('error', (event) => {
  console.error('WebSocket error:', event);
});

// Listen for close
socket.addEventListener('close', (event) => {
  console.log(`WebSocket connection closed: Code ${event.code}, Reason: ${event.reason}`);
});

// Keep the process running for a bit
setTimeout(() => {
  console.log('Test complete, closing connection...');
  socket.close();
  process.exit(0);
}, 10000); // Run for 10 seconds
