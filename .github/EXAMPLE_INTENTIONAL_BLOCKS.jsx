/**
 * Example Component with INTENTIONAL Blocks
 * 
 * This file demonstrates how to use INTENTIONAL-START/END markers
 * to preserve demo-specific code during automated sync.
 * 
 * INTENTIONAL blocks should be used in demo-app (not main-app) to mark
 * sections that should never be overwritten by sync workflow.
 */

import React, { useState } from 'react';

// INTENTIONAL-START
// Demo-specific imports that won't exist in main-app
import { DEMO_USERS } from '../config/demo-config';
import DemoNotice from './DemoNotice';
// INTENTIONAL-END

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // INTENTIONAL-START
  // Demo version: Load mock data instead of API call
  const loadUsers = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setUsers(DEMO_USERS);
    setLoading(false);
  };
  // INTENTIONAL-END

  /* MAIN-APP VERSION (this code exists in main-app, will be synced)
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };
  */

  const handleCreateUser = () => {
    // INTENTIONAL-START
    // Demo: Show notice instead of allowing creation
    alert('User creation is disabled in demo mode');
    // INTENTIONAL-END
    
    /* MAIN-APP VERSION
    // Navigate to create user page
    navigate('/users/create');
    */
  };

  const handleDeleteUser = (userId) => {
    // INTENTIONAL-START
    // Demo: Prevent deletion
    alert('User deletion is disabled in demo mode');
    return;
    // INTENTIONAL-END

    /* MAIN-APP VERSION
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId);
    }
    */
  };

  return (
    <div className="user-management">
      {/* INTENTIONAL-START */}
      <DemoNotice>
        This is a demo environment. Create, edit, and delete functions are disabled.
      </DemoNotice>
      {/* INTENTIONAL-END */}

      <div className="header">
        <h1>User Management</h1>
        
        {/* INTENTIONAL-START */}
        <button 
          onClick={handleCreateUser}
          disabled={true}
          className="btn btn-primary"
          title="Disabled in demo mode"
        >
          Create User (Demo)
        </button>
        {/* INTENTIONAL-END */}

        {/* MAIN-APP VERSION
        <button 
          onClick={handleCreateUser}
          className="btn btn-primary"
        >
          Create User
        </button>
        */}
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  {/* INTENTIONAL-START */}
                  <button disabled={true} className="btn-sm">Edit (Demo)</button>
                  <button disabled={true} className="btn-sm btn-danger">Delete (Demo)</button>
                  {/* INTENTIONAL-END */}

                  {/* MAIN-APP VERSION
                  <button onClick={() => handleEditUser(user.id)} className="btn-sm">Edit</button>
                  <button onClick={() => handleDeleteUser(user.id)} className="btn-sm btn-danger">Delete</button>
                  */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Regular code that will sync normally */}
      <div className="user-stats">
        <p>Total Users: {users.length}</p>
        {/* INTENTIONAL-START */}
        <p className="demo-badge">Demo Mode - Showing Sample Data</p>
        {/* INTENTIONAL-END */}
      </div>
    </div>
  );
}

/**
 * SYNC BEHAVIOR FOR THIS FILE:
 * 
 * When main-app updates this component:
 * 1. ✅ Regular code is updated from main-app
 * 2. ✅ INTENTIONAL blocks are preserved from demo-app
 * 3. ✅ Result: Latest UI with demo restrictions intact
 * 
 * BEST PRACTICES:
 * 
 * ✅ DO use INTENTIONAL blocks for:
 *    - Disabled buttons and form fields
 *    - Mock data loading
 *    - Demo-specific notices/warnings
 *    - Conditional demo behavior
 * 
 * ❌ DON'T use INTENTIONAL blocks for:
 *    - Entire components (use ignore pattern instead)
 *    - Temporary changes (use feature flags)
 *    - Code that should be in both versions
 */
