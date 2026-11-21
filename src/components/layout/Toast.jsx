export default function Toast({ message, on }) {
  return (
    <div className={`toast${on ? ' on' : ''}`} id="toast" role="status">
      {message}
    </div>
  );
}
