import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  FileBarChart,
  Building2,
  Users,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  User,
  Shield,
  GitCompare,
  Activity,
  ClipboardCheck,
  MessageSquare,
  Brain,
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsAPI.getAll();
      const data = res.data?.data || res.data;
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  // Fetch on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle notification dropdown and refresh when opening
  const toggleNotification = () => {
    const opening = !notificationOpen;
    setNotificationOpen(opening);
    if (opening) fetchNotifications();
  };

  // Mark a single notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Click a notification: mark read + navigate if it has a link
  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
    if (notif.link) {
      navigate(notif.link);
      setNotificationOpen(false);
    }
  };

  // Format relative time
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const navItems = [
    { path: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard'        },
    { path: '/budgets',          icon: Wallet,          label: 'Budgets'          },
    { path: '/transactions',     icon: ArrowRightLeft,  label: 'Transactions'     },
    { path: '/budget-approvals', icon: ClipboardCheck,  label: 'Budget Approvals' },
    { path: '/reports',          icon: FileBarChart,    label: 'Reports'          },
    { path: '/comparison',       icon: GitCompare,      label: 'Comparison'       },
    { path: '/departments',      icon: Building2,       label: 'Departments'      },
    { path: '/messages',          icon: MessageSquare,   label: 'Messages'         },
    { path: '/analytics',         icon: Brain,           label: 'AI Analytics'     },
  ];

  const adminNavItems = isAdmin ? [
    { path: '/admin',               icon: Shield,   label: 'Admin Panel'    },
    { path: '/admin/users',         icon: Users,    label: 'Manage Users'   },
    { path: '/admin/activity-logs', icon: Activity, label: 'Activity Logs'  },
  ] : [];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon"><Wallet size={24} color="white" /></div>
            <span className="logo-text">BudMap</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}

          {adminNavItems.length > 0 && (
            <>
              <div className="nav-divider"></div>
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  <item.icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}

          <div className="nav-divider"></div>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Settings size={20} />
            {sidebarOpen && <span>Settings</span>}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Top Bar */}
        <header className="top-bar">
          <button className="menu-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="top-bar-actions">
            {/* Notifications */}
            <div className="notification-wrapper" ref={notifRef}>
              <button className="icon-button" onClick={toggleNotification}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {notificationOpen && (
                <div className="notification-dropdown">
                  <div className="dropdown-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button className="mark-read" onClick={handleMarkAllAsRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">No notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="notification-content">
                            <p className="notification-title">{notif.title}</p>
                            <p>{notif.message}</p>
                            <span className="notification-time">
                              {timeAgo(notif.createdAt)}
                            </span>
                          </div>
                          {!notif.isRead && <div className="unread-dot"></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="user-menu-wrapper" ref={userMenuRef}>
              <button className="user-menu-toggle" onClick={toggleUserMenu}>
                <div className="user-avatar">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className="user-info">
                  <span className="user-name">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="user-role">{user?.role?.replace('_', ' ')}</span>
                </div>
                <ChevronDown size={16} />
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-user-info">
                    <div className="user-avatar large">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                    <div>
                      <p className="dropdown-user-name">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="dropdown-user-email">{user?.email}</p>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate('/profile');
                      setUserMenuOpen(false);
                    }}
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate('/settings');
                      setUserMenuOpen(false);
                    }}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default Layout;
