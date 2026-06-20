import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../api/axios.js';
import { getSocket, connectSocket } from '../api/socket.js';
import { useAuth } from '../context/AuthContext.jsx';
import UserList from '../components/UserList.jsx';
import MessageBubble from '../components/MessageBubble.jsx';
import SecurityBadge from '../components/SecurityBadge.jsx';

export default function Chat() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [connected, setConnected] = useState(false);
  const [typingUserId, setTypingUserId] = useState(null);
  const bottomRef = useRef(null);

  // Keep a ref in sync so the socket listener below always knows the *current* active chat
  const activeUserRef = useRef(null);
  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  // Make sure the socket exists (covers a page refresh, where login() already ran once before).
  useEffect(() => {
    let socket = getSocket();
    if (!socket) {
      const token = localStorage.getItem('token');
      if (token) socket = connectSocket(token);
    }
    if (!socket) return;

    function handleConnect() { setConnected(true); }
    function handleDisconnect() { setConnected(false); }
    function handlePresence({ userId, online }) {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        online ? next.add(userId) : next.delete(userId);
        return next;
      });
    }
    function handleTyping({ userId }) {
      setTypingUserId(userId);
      setTimeout(() => setTypingUserId((current) => (current === userId ? null : current)), 2000);
    }
    function handleNewMessage(message) {
      setMessages((prev) => {
        const relevant =
          activeUserRef.current &&
          (message.senderId === activeUserRef.current.id || message.receiverId === activeUserRef.current.id);
        return relevant ? [...prev, message] : prev;
      });
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('presence:update', handlePresence);
    socket.on('typing', handleTyping);
    socket.on('message:new', handleNewMessage);
    setConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('presence:update', handlePresence);
      socket.off('typing', handleTyping);
      socket.off('message:new', handleNewMessage);
    };
  }, []);

  useEffect(() => {
    api.get('/api/users').then(({ data }) => setUsers(data));
  }, []);

  useEffect(() => {
    if (!activeUser) return;
    api.get(`/api/messages/${activeUser.id}`).then(({ data }) => setMessages(data));
  }, [activeUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(
    (e) => {
      e.preventDefault();
      if (!draft.trim() || !activeUser) return;

      const socket = getSocket();
      socket.emit('message:send', { receiverId: activeUser.id, content: draft }, (response) => {
        if (response?.message) {
          setMessages((prev) => [...prev, response.message]);
        }
      });
      setDraft('');
    },
    [draft, activeUser]
  );

  function handleTypingInput(value) {
    setDraft(value);
    if (activeUser) {
      getSocket()?.emit('typing', { receiverId: activeUser.id });
    }
  }

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="me">{user.username}</span>
          <button className="link-btn" onClick={logout}>Sign out</button>
        </div>
        <UserList users={users} activeUserId={activeUser?.id} onSelect={setActiveUser} onlineUserIds={onlineUserIds} />
      </aside>

      <main className="conversation">
        {activeUser ? (
          <>
            <header className="conversation-header">
              <div>
                <h2>{activeUser.username}</h2>
                <span className="presence-text">
                  {onlineUserIds.has(activeUser.id) ? 'Online' : 'Offline'}
                  {typingUserId === activeUser.id && ' · typing…'}
                </span>
              </div>
              <SecurityBadge connected={connected} />
            </header>

            <div className="message-list">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} isOwn={m.senderId === user.id} />
              ))}
              <div ref={bottomRef} />
            </div>

            <form className="composer" onSubmit={sendMessage}>
              <input
                value={draft}
                onChange={(e) => handleTypingInput(e.target.value)}
                placeholder="Type a message"
                autoComplete="off"
              />
              <button type="submit" className="btn-primary" disabled={!draft.trim()}>Send</button>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
}
