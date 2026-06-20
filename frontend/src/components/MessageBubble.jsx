export default function MessageBubble({ message, isOwn }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`bubble-row ${isOwn ? 'own' : ''}`}>
      <div className="bubble">
        <p>{message.content}</p>
        <span className="bubble-time">{time}</span>
      </div>
    </div>
  );
}
