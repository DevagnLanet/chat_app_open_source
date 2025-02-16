// src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-blue-100 to-purple-100 p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Virtual Meeting Space</h1>
      <div className="space-x-4">
        <Link to="/create">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
            Create Room
          </button>
        </Link>
        <Link to="/join">
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition">
            Join Room
          </button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
