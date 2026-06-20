export default function UserList({ users, activeUserId, onSelect, onlineUserIds }) {
  return (
    <div className="user-list">
      <h2 className="user-list-title">Conversations</h2>
      {users.length === 0 && <p className="user-list-empty">No other users yet</p>}
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            <button
              className={`user-item ${u.id === activeUserId ? 'active' : ''}`}
              onClick={() => onSelect(u)}
            >
              <span className={`status-dot ${onlineUserIds.has(u.id) ? 'online' : ''}`} />
              <span>{u.username}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
