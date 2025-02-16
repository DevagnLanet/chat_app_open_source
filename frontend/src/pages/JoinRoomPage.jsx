// src/pages/JoinRoomPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinRoomPage = () => {
  const [roomKey, setRoomKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const joinRoom = async () => {
    if (!roomKey) {
      setError('Please enter a room key.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/room/${roomKey}`);
      if (response.ok) {
        navigate(`/room/${roomKey}`);
      } else {
        setError('Room not found or expired.');
      }
    } catch (err) {
      console.error('Error joining room:', err);
      setError('Error joining room.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white p-6">
      <h1 className="text-3xl font-bold mb-6">Join Room</h1>
      <input
        type="text"
        placeholder="Enter Room Key"
        value={roomKey}
        onChange={(e) => setRoomKey(e.target.value)}
        className="w-full max-w-md p-2 border border-gray-300 rounded mb-4"
      />
      <button 
        onClick={joinRoom}
        className="px-6 py-3 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition"
      >
        Join Room
      </button>
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
};

export default JoinRoomPage;
