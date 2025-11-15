import React from 'react';

const DashboardButton = ({ onClick, label = 'Go to Dashboard', variant = 'primary' }) => {
  return (
    <button 
      className={`dashboard-button dashboard-button-${variant}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default DashboardButton;

