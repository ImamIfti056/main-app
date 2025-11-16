export default function UserCard({ user }) {
  return (
      <div className="user-card">
          <img src={user.avatar} className="avatar" />
          <h3>{user.name}</h3>
          <p className="role">{user.role}</p>
          <p>new line added for testttt</p>
      </div>
  );
}
