import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://ghost-chat-backend-8iwu.onrender.com/");

const ChatApp = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [partnerFound, setPartnerFound] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [typing, setTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [userTyping, setUserTyping] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    socket.on("partnerFound", () => {
      setPartnerFound(true);
      setMessages((prev) => [
        ...prev,
        { sender: "system", text: "Partner found! Start chatting. 🎉" },
      ]);
    });

    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, { sender: "partner", text: message }]);
    });

    socket.on("partnerDisconnected", () => {
      setMessages((prev) => [
        ...prev,
        { sender: "system", text: "Your partner disconnected.❌" },
      ]);
      setPartnerFound(false);
    });

    socket.on("totalUsers", (count) => {
      setTotalUsers(count);
    });

    socket.on("partnerTyping", () => {
      setTyping(true);
      clearTimeout(typingTimeout);
      setTypingTimeout(
        setTimeout(() => {
          setTyping(false);
        }, 2000)
      );
    });

    socket.on("partnerStopTyping", () => {
      setTyping(false);
    });

    const handleShortcuts = (e) => {
      if (e.key === "Escape") {
        endChat();
        findPartner();
      }
    };

    window.addEventListener("keydown", handleShortcuts);

    return () => {
      socket.off("partnerFound");
      socket.off("receiveMessage");
      socket.off("partnerDisconnected");
      socket.off("totalUsers");
      socket.off("partnerTyping");
      socket.off("partnerStopTyping");
      window.removeEventListener("keydown", handleShortcuts);
    };
  }, [typingTimeout]);

  const findPartner = () => {
    socket.emit("findPartner");
    setConnected(true);
    setMessages((prev) => [
      ...prev,
      { sender: "system", text: "Looking for a partner..." },
    ]);
  };

  const endChat = () => {
    socket.emit("endChat");
    setPartnerFound(false);
    setMessages((prev) => [
      ...prev,
      { sender: "system", text: "You ended the chat. Finding a new partner..." },
    ]);
  };

  const sendMessage = () => {
    if (input.trim() && partnerFound) {
      socket.emit("sendMessage", input);
      setMessages((prev) => [...prev, { sender: "you", text: input }]);
      setInput("");
      socket.emit("stopTyping");
      setUserTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    if (!userTyping) {
      socket.emit("typing");
      setUserTyping(true);
    }

    clearTimeout(typingTimeout);
    setTypingTimeout(
      setTimeout(() => {
        socket.emit("stopTyping");
        setUserTyping(false);
      }, 1000)
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const appStyle = {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: darkMode ? "#121212" : "#f9f9f9",
    color: darkMode ? "#ffffff" : "#000000",
    minHeight: "100vh",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  const chatStyle = {
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "15px",
    height: "300px",
    overflowY: "scroll",
    marginTop: "20px",
    width: "80%",
    backgroundColor: darkMode ? "#222" : "#fff",
    color: darkMode ? "#ddd" : "#000",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
  };

  const messageStyle = {
    margin: "10px 0",
    padding: "10px",
    borderRadius: "10px",
    maxWidth: "70%",
  };

  return (
    <div style={appStyle}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "50%",
          padding: "10px 20px",
          backgroundColor: darkMode ? "#333" : "#007bff",
          color: "#fff",
          borderRadius: "5px",
        }}
      >
        <h1>AnonSphere</h1>
        <button
          onClick={toggleDarkMode}
          style={{
            padding: "10px",
            backgroundColor: darkMode ? "#444" : "#fff",
            color: darkMode ? "#fff" : "#007bff",
            borderRadius: "5px",
          }}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </header>
      <p style={{ marginTop: "20px", fontSize: "18px" }}>
        Total Online Users: {totalUsers}
      </p>

      <div style={chatStyle}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...messageStyle,
              backgroundColor: msg.sender === "you" ? "#007bff" : "#ccc",
              alignSelf: msg.sender === "you" ? "flex-end" : "flex-start",
              color: msg.sender === "you" ? "#fff" : "#000",
            }}
          >
            <strong>{msg.sender === "you" ? "You" : msg.sender}:</strong>{" "}
            {msg.text}
          </div>
        ))}
        {typing && <p>Partner is typing...</p>}
      </div>

      {partnerFound && (
        <div style={{ marginTop: "20px", width: "80%", display: "flex" }}>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            style={{
              flexGrow: 1,
              padding: "10px",
              borderRadius: "10px 0 0 10px",
              border: "1px solid #ccc",
              backgroundColor: darkMode ? "#333" : "#fff",
              color: darkMode ? "#fff" : "#000",
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              padding: "10px 20px",
              borderRadius: "0 10px 10px 0",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
            }}
          >
            Send
          </button>
        </div>
      )}

      {!connected && (
        <button
          onClick={findPartner}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            borderRadius: "10px",
            backgroundColor: "#007bff",
            color: "#fff",
          }}
        >
          Find a Partner
        </button>
      )}

      <footer style={{ marginTop: "50px", textAlign: "center" }}>
        <p>Press ESC to end the chat and find a new partner.</p>
        <p>
          If you are on mobile, refresh to end the chat and find a new user.
        </p>
        <p>
          <strong>Note:</strong> Chats are not saved. Refreshing deletes chats.
        </p>
        <img
          src="https://cdn.worldvectorlogo.com/logos/socket-io.svg"
          alt="Socket.IO Logo"
          style={{ height: "50px", marginTop: "10px" }}
        />
        <p>Powered by Socket.IO</p>
      </footer>
    </div>
  );
};

export default ChatApp;
