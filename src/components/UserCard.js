import React from 'react';

const UserCard = ({ user }) => {
  return (
    <div className="user-card">
      <div className="user-card-header">
        <img 
          src={user?.avatar || '/default-avatar.png'} 
          alt={user?.name || 'User'} 
          className="user-avatar"
        />
      </div>
      <div className="user-card-body">
        <h3 className="user-name">{user?.name || 'Unknown User'}</h3>
        <p className="user-email">{user?.email || 'No email provided'}</p>
        <p className="user-role">{user?.role || 'User'}</p>
      </div>
    </div>
  );
};

export default UserCard;

