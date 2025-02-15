// src/pages/RoomPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

const RoomPage = () => {
  const { roomKey } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8000/ws/${roomKey}`);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket');
    };
    ws.current.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.current.close();
    };
  }, [roomKey]);

  const sendMessage = () => {
    if (inputMessage && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-center mb-4">Room: {roomKey}</h1>
      <div className="max-w-2xl mx-auto bg-white shadow rounded p-4 mb-4 h-80 overflow-y-scroll border">
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-2 text-gray-700">{msg}</div>
        ))}
      </div>
      <div className="max-w-2xl mx-auto flex items-center">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-grow p-3 border border-gray-300 rounded-l"
        />
        <button 
          onClick={sendMessage}
          className="px-6 py-3 bg-blue-500 text-white rounded-r shadow hover:bg-blue-600 transition"
        >
          Send
        </button>
      </div>
      {/* Future integration: Add WebRTC-based audio/video components here */}
    </div>
  );
};

export default RoomPage;
