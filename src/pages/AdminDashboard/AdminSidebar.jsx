// src/pages/Admin/AdminSidebar.jsx

import React from "react";
import { NavLink } from "react-router-dom";
import "./AdminSidebar.css";

const AdminSidebar = () => {
  return (
    <div className="admin-sidebar">
      <h2>Admin Panel</h2>

      <ul>
        <li>
          <NavLink to="/admin/dashboard">📦 Orders</NavLink>
        </li>
        <li>
          <NavLink to="/admin/analytics">📊 Analytics</NavLink>
        </li>
        <li>
          <NavLink to="/admin/menu">🍔 Manage Menu</NavLink>
        </li>
        <li>
          <NavLink to="/admin/reviews">⭐ Reviews</NavLink>
        </li>
        <li>
          <NavLink to="/admin/settings">⚙ Settings</NavLink>
        </li>
      </ul>
    </div>
  );
};

export default AdminSidebar;
