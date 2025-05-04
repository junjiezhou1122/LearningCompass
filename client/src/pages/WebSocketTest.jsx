import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { getApiBaseUrl } from '../lib/utils';

export function WebSocketTest() {
  const { user, token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [recipientId, setRecipientId] = useState('2'); // Default to user ID 2 for testing
  const [logs, setLogs] = useState([]);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to WebSocket server
  useEffect(() => {
    if (!user || !token) {
      setStatus('Not authenticated');
      return;
    }

    const connect = () => {
      try {
        // Get the protocol (ws for HTTP, wss for HTTPS)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const baseUrl = getApiBaseUrl();
        const host = baseUrl.replace(/^https?:\/\//, '');
        
        // Construct the WebSocket URL with token as a query parameter
        const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;
        addLog(`Connecting to WebSocket: ${wsUrl}`);

        // Create WebSocket connection
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        // Connection opened
        socket.addEventListener('open', (event) => {
          setConnected(true);
          setStatus('Connected');
          addLog('WebSocket connection established!');
          
          // Send authentication message
          sendAuthMessage();
        });

        // Listen for messages
        socket.addEventListener('message', (event) => {
          const data = JSON.parse(event.data);
          addLog(`Message received: ${event.data}`);
          
          // Handle different message types
          if (data.type === 'direct_message') {
            setMessages((prevMessages) => [...prevMessages, data.data]);
          } else if (data.type === 'error') {
            setStatus(`Error: ${data.data.message}`);
          } else if (data.type === 'chat_history') {
            setMessages(data.data.messages);
          }
        });

        // Connection closed
        socket.addEventListener('close', (event) => {
          setConnected(false);
          setStatus(`Disconnected: ${event.reason || 'No reason provided'}`);
          addLog(`WebSocket connection closed: ${event.code} ${event.reason || 'No reason provided'}`);
          socketRef.current = null;
          
          // Try to reconnect after a delay
          setTimeout(() => {
            if (!socketRef.current) {
              addLog('Attempting to reconnect...');
              connect();
            }
          }, 5000);
        });

        // Connection error
        socket.addEventListener('error', (event) => {
          addLog(`WebSocket error: ${event}`);
          setStatus('Connection error');
        });

        return () => {
          socket.close();
        };
      } catch (error) {
        addLog(`Connection error: ${error.message}`);
        setStatus(`Connection error: ${error.message}`);
      }
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user, token]);

  // Send authentication message
  const sendAuthMessage = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const authMessage = {
        type: 'auth',
        data: { token },
        timestamp: new Date().toISOString()
      };
      socketRef.current.send(JSON.stringify(authMessage));
      addLog('Auth message sent');
    }
  };

  // Send a direct message
  const sendMessage = () => {
    if (!input.trim() || !recipientId) return;
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'direct_message',
        data: {
          recipientId: parseInt(recipientId),
          content: input.trim()
        },
        timestamp: new Date().toISOString()
      };
      
      socketRef.current.send(JSON.stringify(message));
      addLog(`Message sent to ${recipientId}: ${input}`);
      setInput('');
    } else {
      setStatus('Not connected');
    }
  };

  // Request chat history
  const requestHistory = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const historyRequest = {
        type: 'get_chat_history',
        data: {
          userId: parseInt(recipientId),
          limit: 20,
          offset: 0
        },
        timestamp: new Date().toISOString()
      };
      
      socketRef.current.send(JSON.stringify(historyRequest));
      addLog(`Requested chat history with user ${recipientId}`);
    } else {
      setStatus('Not connected');
    }
  };

  // Add a log message
  const addLog = (message) => {
    setLogs((prevLogs) => [
      ...prevLogs,
      `${new Date().toLocaleTimeString()} - ${message}`
    ]);
  };

  return (
    <div className="container mx-auto py-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>WebSocket Test</CardTitle>
          <CardDescription>
            Status: <span className={connected ? 'text-green-500' : 'text-red-500'}>{status}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2">User ID: {user?.id}</div>
            <div className="mb-4 flex gap-2">
              <Input 
                value={recipientId} 
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder="Recipient ID" 
                className="w-[150px]"
              />
              <Button onClick={requestHistory}>Load History</Button>
            </div>
          </div>
          
          <div className="border rounded-md p-3 h-[350px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 h-full flex items-center justify-center">
                No messages yet
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded-lg max-w-[80%] ${msg.senderId === user?.id ? 'ml-auto bg-blue-100' : 'bg-gray-100'}`}
                  >
                    <div className="text-xs text-gray-500">
                      {msg.senderId === user?.id ? 'You' : `User ${msg.senderId}`}
                    </div>
                    <div>{msg.content}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message" 
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Connection Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            readOnly 
            className="h-[450px] font-mono text-xs" 
            value={logs.join('\n')}
          />
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => setLogs([])}
            className="ml-auto"
          >
            Clear Logs
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default WebSocketTest;
