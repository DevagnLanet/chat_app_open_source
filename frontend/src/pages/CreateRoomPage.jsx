// src/pages/CreateRoomPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateRoomPage = () => {
  const [roomLink, setRoomLink] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createRoom = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/create_room', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.room_link) {
        setRoomLink(data.room_link);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
    setLoading(false);
  };

  const enterRoom = () => {
    // Extract the room key from the link (assumes format: http://localhost:8000/room/<roomKey>)
    const parts = roomLink.split('/room/');
    if (parts.length === 2) {
      navigate(`/room/${parts[1]}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white p-6">
      <h1 className="text-3xl font-bold mb-6">Create Room</h1>
      <button 
        onClick={createRoom} 
        disabled={loading}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
      >
        {loading ? 'Creating...' : 'Create Room'}
      </button>
      {roomLink && (
        <div className="mt-8 w-full max-w-md text-center">
          <p className="mb-2 text-gray-700">Your room is ready! Share this link:</p>
          <input 
            type="text" 
            readOnly 
            value={roomLink} 
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
          <button 
            onClick={enterRoom} 
            className="px-6 py-3 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
          >
            Enter Room
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateRoomPage;
