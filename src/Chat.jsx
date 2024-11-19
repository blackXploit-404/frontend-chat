import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

const ChatApp = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [partnerFound, setPartnerFound] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [typing, setTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [userTyping, setUserTyping] = useState(false);

  useEffect(() => {
    // Handle partner found
    socket.on("partnerFound", () => {
      setPartnerFound(true);
      setMessages((prev) => [
        ...prev,
        { sender: "system", text: "Partner found! Start chatting. 🎉" },
      ]);
    });

    // Handle incoming messages
    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, { sender: "partner", text: message }]);
    });

    // Handle partner disconnection
    socket.on("partnerDisconnected", () => {
      setMessages((prev) => [
        ...prev,
        { sender: "system", text: "Your partner disconnected.❌" },
      ]);
      setPartnerFound(false);
      setConnected(false);  // Ensure the connection is reset
    });

    // Update total online users
    socket.on("totalUsers", (count) => {
      setTotalUsers(count);
    });

    // Handle typing indicators
    socket.on("partnerTyping", () => {
      setTyping(true);
      clearTimeout(typingTimeout);
      setTypingTimeout(
        setTimeout(() => {
          setTyping(false);
        }, 2000) // Automatically stop typing after 2 seconds if no further updates
      );
    });

    socket.on("partnerStopTyping", () => {
      setTyping(false);
    });

    // Handle shortcut for finding a partner (Ctrl + N)
    const handleFindPartnerShortcut = (e) => {
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        findPartner();
      }
    };

    // Handle shortcut for ending chat (Ctrl + R)
    const handleEndChatShortcut = (e) => {
      if (e.ctrlKey && e.key === "r") {
        e.preventDefault();
        endChat();
      }
    };

    // Attach keydown event listeners
    window.addEventListener("keydown", handleFindPartnerShortcut);
    window.addEventListener("keydown", handleEndChatShortcut);

    return () => {
      socket.off("partnerFound");
      socket.off("receiveMessage");
      socket.off("partnerDisconnected");
      socket.off("totalUsers");
      socket.off("partnerTyping");
      socket.off("partnerStopTyping");
      window.removeEventListener("keydown", handleFindPartnerShortcut);
      window.removeEventListener("keydown", handleEndChatShortcut);
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
    setPartnerFound(false);
    socket.emit("disconnect");
    setMessages((prev) => [
      ...prev,
      { sender: "system", text: "You ended the chat. Find a new partner to chat." },
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

  const handleInputBlur = () => {
    socket.emit("stopTyping");
    setUserTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div className="logo">
        <a href="/">
          <img src="logo.png" alt="GhostChat Logo" height="50px" />
        </a>
      </div>
      <h1>Ghost.Chat</h1>
      {!connected && <button onClick={findPartner}>Find a Partner</button>}
      {connected && !partnerFound && <p>Looking for a partner...</p>}
      {connected && partnerFound && <p>You are now connected to a partner!</p>}

      {/* Display total users */}
      <p>Total Online Users: {totalUsers}</p>

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
            <strong>
              {msg.sender === "you"
                ? "You"
                : msg.sender === "partner"
                ? "Partner"
                : "System"}:
            </strong>{" "}
            {msg.text}
          </div>
        ))}
        {typing && <p>Partner is typing...</p>}
      </div>

      {partnerFound && (
        <div style={{ marginTop: "20px" }}>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyPress}
            style={{ padding: "5px", width: "80%" }}
          />
          <button onClick={sendMessage} style={{ padding: "5px 10px" }}>
            Send
          </button>
        </div>
      )}

      <footer
        style={{
          marginTop: "20px",
          textAlign: "center",
          padding: "10px 0",
          backgroundColor: "#f1f1f1",
          position: "relative",
          bottom: "0",
          width: "100%",
        }}
      >
        <p>Just do a refresh to start a new chat or press ctrl + r</p>
        <p>© 2024 Ghost.Chat | All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ChatApp;
