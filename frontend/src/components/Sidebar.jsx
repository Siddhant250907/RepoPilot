/**
 * Sidebar Component.
 *
 * Professional AI Developer Workspace Sidebar:
 * - Brand: RepoPilot logo + name
 * - + New Task CTA
 * - Navigation Group 1: Workspace, Runs, Projects
 * - Divider line
 * - Navigation Group 2: Documentation, Settings
 * - Divider line
 * - User Profile: User details with popup menu & working logout
 * - Responsive collapse toggle
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../services/authContext.jsx';
import { useToast } from '../services/ToastContext.jsx';
import {
  Plus,
  LayoutDashboard,
  History,
  FolderGit2,
  BookOpen,
  Settings,
  LogOut,
  ChevronDown,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
} from 'lucide-react';

export default function Sidebar({
  activeView,
  setActiveView,
  onNewTask,
  onOpenDocs,
  onOpenSettings,
  onOpenLogin,
  onLogout,
  isCollapsed,
  setIsCollapsed,
  recentRunsCount = 0,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    toast.info('Signed out of session');
    if (onLogout) {
      onLogout();
    } else {
      setActiveView('landing');
    }
  };

  // Nav Group 1: Workspace, Runs, Projects
  const primaryNavItems = [
    {
      id: 'workspace',
      label: 'Workspace',
      icon: <LayoutDashboard size={17} />,
      onClick: () => setActiveView('workspace'),
    },
    {
      id: 'runs',
      label: 'Runs',
      icon: <History size={17} />,
      badge: recentRunsCount > 0 ? recentRunsCount : null,
      onClick: () => {
        setActiveView('workspace');
        // Smooth scroll to recent runs if on workspace
        const runsElem = document.getElementById('recent-runs-section');
        if (runsElem) runsElem.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <FolderGit2 size={17} />,
      onClick: () => {
        toast.info('Viewing active demo repository workspaces');
        setActiveView('workspace');
      },
    },
  ];

  // Nav Group 2: Documentation, Settings
  const secondaryNavItems = [
    {
      id: 'docs',
      label: 'Documentation',
      icon: <BookOpen size={17} />,
      onClick: onOpenDocs,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={17} />,
      onClick: onOpenSettings,
    },
  ];

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div
          className="brand-logo-button"
          onClick={() => setActiveView('landing')}
          title="Return to RepoPilot Landing"
        >
          <div className="brand-logo-icon">
            <Bot size={20} className="robot-icon" />
            <span className="logo-pulse-ring"></span>
          </div>
          {!isCollapsed && (
            <div className="brand-text-col">
              <span className="brand-name">RepoPilot</span>
              <span className="brand-badge-pill">AI</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="collapse-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar collapse"
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* New Task Action */}
      <div className="sidebar-action-wrap">
        <button
          type="button"
          className="new-task-btn"
          onClick={onNewTask}
          title="Create New Debugging Task"
        >
          <Plus size={18} className="plus-icon" />
          {!isCollapsed && <span>New Task</span>}
        </button>
      </div>

      {/* Navigation Group 1: Workspace, Runs, Projects */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {primaryNavItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <li key={item.id} className="nav-list-item">
                <button
                  type="button"
                  className={`nav-btn ${isActive ? 'active' : ''}`}
                  onClick={item.onClick}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      {item.badge && <span className="nav-counter-badge">{item.badge}</span>}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Divider 1 */}
        <div className="sidebar-divider" />

        {/* Navigation Group 2: Documentation, Settings */}
        <ul className="nav-list">
          {secondaryNavItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <li key={item.id} className="nav-list-item">
                <button
                  type="button"
                  className={`nav-btn ${isActive ? 'active' : ''}`}
                  onClick={item.onClick}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Cognitive Status Hint (when expanded) */}
        {!isCollapsed && (
          <div className="sidebar-status-box">
            <div className="status-box-header">
              <span className="live-status-dot"></span>
              <span className="status-box-title">Agent Core Online</span>
            </div>
            <p className="status-box-desc">
              Autonomous failure recovery & OODA loop ready.
            </p>
          </div>
        )}
      </nav>

      {/* Divider 2 */}
      <div className="sidebar-divider" />

      {/* User Profile Section at Bottom */}
      <div className="sidebar-footer" ref={userMenuRef}>
        {isAuthenticated && user ? (
          <div className="user-profile-card">
            <button
              type="button"
              className="user-profile-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User profile options"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="user-avatar-img"
              />
              {!isCollapsed && (
                <div className="user-details">
                  <span className="user-display-name">{user.name}</span>
                  <span className="user-role-label">{user.role || 'Staff Engineer'}</span>
                </div>
              )}
              {!isCollapsed && (
                <ChevronDown size={14} className={`user-chevron ${showUserMenu ? 'open' : ''}`} />
              )}
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="user-dropdown-menu">
                <div className="menu-header">
                  <strong>{user.name}</strong>
                  <span className="menu-email">{user.email}</span>
                </div>
                <div className="menu-divider"></div>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenSettings();
                  }}
                >
                  <Settings size={15} />
                  <span>Preferences</span>
                </button>
                <button
                  type="button"
                  className="menu-item"
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenDocs();
                  }}
                >
                  <BookOpen size={15} />
                  <span>Architecture Docs</span>
                </button>
                <div className="menu-divider"></div>
                <button
                  type="button"
                  className="menu-item logout-item"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="sidebar-login-btn"
            onClick={onOpenLogin}
            title="Sign in to session"
          >
            <User size={18} />
            {!isCollapsed && <span>Sign In</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
