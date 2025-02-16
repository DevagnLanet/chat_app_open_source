// src/pages/RoomPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const RoomPage = () => {
  const { roomKey } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const ws = useRef(null);
  const pc = useRef(null);
  const localStream = useRef(null);
  const remoteAudioRef = useRef(null);

  // Function to set up the WebRTC connection for voice call
  async function startCall(isInitiator = true) {
    try {
      // Get local audio stream
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Create RTCPeerConnection
      pc.current = new RTCPeerConnection(configuration);
      // Add local audio track to connection
      localStream.current.getTracks().forEach(track => {
        pc.current.addTrack(track, localStream.current);
      });
      // When remote track is received, attach to audio element
      pc.current.ontrack = (event) => {
        console.log("Received remote track");
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };
      // When ICE candidate is generated, send it via WebSocket
      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          ws.current.send(JSON.stringify({ type: "ice-candidate", data: event.candidate }));
        }
      };

      if (isInitiator) {
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        ws.current.send(JSON.stringify({ type: "offer", data: pc.current.localDescription }));
      }
    } catch (error) {
      console.error("Error starting call:", error);
    }
  }

  useEffect(() => {
    // Establish the WebSocket connection for signaling and chat
    ws.current = new WebSocket(`ws://localhost:8000/ws/${roomKey}`);
    ws.current.onopen = () => {
      console.log("WebSocket connected");
      // Start the call as initiator if desired; adjust based on your signaling logic.
      startCall(true);
    };
    ws.current.onmessage = async (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch (err) {
        // Not JSON: treat as chat message
        setMessages((prev) => [...prev, event.data]);
        return;
      }

      if (message.type === "offer") {
        console.log("Received offer", message.data);
        if (!pc.current) await startCall(false);
        await pc.current.setRemoteDescription(new RTCSessionDescription(message.data));
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
        ws.current.send(JSON.stringify({ type: "answer", data: pc.current.localDescription }));
      } else if (message.type === "answer") {
        console.log("Received answer", message.data);
        await pc.current.setRemoteDescription(new RTCSessionDescription(message.data));
      } else if (message.type === "ice-candidate") {
        console.log("Received ICE candidate", message.data);
        try {
          await pc.current.addIceCandidate(message.data);
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    };
    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    ws.current.onclose = (event) => {
      console.log("WebSocket closed:", event);
    };

    return () => {
      if (pc.current) {
        pc.current.close();
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [roomKey]);

  const sendMessage = () => {
    if (inputMessage && ws.current.readyState === WebSocket.OPEN) {
      // Send text chat message as plain text
      ws.current.send(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-center mb-4">Room: {roomKey}</h1>
      
      {/* Chat Section */}
      <div className="max-w-2xl mx-auto bg-white shadow rounded p-4 mb-4 h-60 overflow-y-scroll border">
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-2 text-gray-700">{msg}</div>
        ))}
      </div>
      <div className="max-w-2xl mx-auto flex items-center mb-4">
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
      
      {/* Audio Section */}
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-lg font-semibold mb-2">Voice Call Active</p>
        <audio ref={remoteAudioRef} autoPlay controls className="mx-auto"></audio>
      </div>
    </div>
  );
};

export default RoomPage;
