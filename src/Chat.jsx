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

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Ghost.Chat</h1>
      {!connected && <button onClick={findPartner}>Find a Partner</button>}
      {connected && !partnerFound && <p>Looking for a partner...</p>}
      {connected && partnerFound && <p>You are now connected to a partner!</p>}
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
          <div key={index}>
            <strong>{msg.sender === "you" ? "You" : msg.sender}:</strong>{" "}
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
            onKeyPress={handleKeyPress}
            style={{ padding: "5px", width: "80%" }}
          />
          <button onClick={sendMessage} style={{ padding: "5px 10px" }}>
            Send
          </button>
        </div>
      )}

      <footer style={{ marginTop: "20px" }}>
        <p>Press ESC to end the chat and find a new partner.</p>
      </footer>
    </div>
  );
};

export default ChatApp;
