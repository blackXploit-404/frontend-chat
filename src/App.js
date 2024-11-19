import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

const ChatApp = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [partnerFound, setPartnerFound] = useState(false);

  useEffect(() => {
    // Listen for partner connection
    socket.on("partnerFound", () => {
      setPartnerFound(true);
      setMessages((prev) => [...prev, { sender: "system", text: "Partner found!" }]);
    });

    // Listen for incoming messages
    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, { sender: "partner", text: message }]);
    });

    // Handle partner disconnection
    socket.on("partnerDisconnected", () => {
      setMessages((prev) => [...prev, { sender: "system", text: "Your partner disconnected." }]);
      setPartnerFound(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const findPartner = () => {
    socket.emit("findPartner");
    setConnected(true);
  };

  const sendMessage = () => {
    if (input.trim() && partnerFound) {
      socket.emit("sendMessage", input);
      setMessages((prev) => [...prev, { sender: "you", text: input }]);
      setInput("");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Omegle-Like Chat</h1>
      {!connected && <button onClick={findPartner}>Find a Partner</button>}
      {connected && partnerFound && <p>You are now connected to a partner!</p>}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          height: "300px",
          overflowY: "scroll",
          marginTop: "20px",
        }}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ margin: "5px 0" }}>
            <strong>{msg.sender === "you" ? "You" : msg.sender === "partner" ? "Partner" : "System"}:</strong>{" "}
            {msg.text}
          </div>
        ))}
      </div>
      {partnerFound && (
        <div style={{ marginTop: "20px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ padding: "5px", width: "80%" }}
          />
          <button onClick={sendMessage} style={{ padding: "5px 10px" }}>
            Send
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
