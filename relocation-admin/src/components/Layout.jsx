import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  if (!user) {
    return <Outlet />;
  }

  // Detail page and Audit Log: suppress the shared nav shell (they have their own full layouts)
  const isDetailPage = location.pathname !== '/decisions' && location.pathname.startsWith('/decisions/');
  const isAuditLogPage = location.pathname === '/audit-logs';
  if (isDetailPage || isAuditLogPage) {
    return (
      <div style={{ backgroundColor: '#f9f9fd', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
        <Outlet />
      </div>
    );
  }

  const isDashboardActive = location.pathname === '/dashboard';
  const isRelocationsActive = location.pathname.startsWith('/decisions');
  const isResourcesActive = location.pathname === '/resources';
  const isAuditActive = location.pathname === '/audit-logs';

  return (
    <div style={{ backgroundColor: '#f9f9fd', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      {/* TopNavBar */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #c2c7d0',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '64px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 32px', maxWidth: '1440px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontFamily: 'Inter', fontWeight: '700', fontSize: '20px', letterSpacing: '-0.01em', color: '#054471' }}>
              🛡️ NDMA Relocation Governance Portal
            </span>
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: 'Inter',
                fontSize: '12px',
                fontWeight: '600',
                color: '#2563eb',
                backgroundColor: '#eff6ff',
                padding: '4px 10px',
                borderRadius: '6px',
                textDecoration: 'none',
                border: '1px solid #bfdbfe'
              }}
            >
              🗺️ Public GIS Map ↗
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '14px', color: '#1a1c1f' }}>{user.name}</span>
              <span style={{ fontFamily: 'Inter', fontWeight: '400', fontSize: '12px', color: '#42474f' }}>Relocation Authority</span>
            </div>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              backgroundColor: '#d0e4ff', border: '1px solid #c2c7d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '700', color: '#054471'
            }}>
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <a
              onClick={handleLogout}
              href="#"
              style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '14px', color: '#054471', textDecoration: 'none' }}
            >
              Sign Out
            </a>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', paddingTop: '64px' }}>
        {/* SideNavBar */}
        <aside style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #c2c7d0',
          position: 'fixed',
          left: 0,
          top: '64px',
          height: 'calc(100vh - 64px)',
          width: '240px',
          zIndex: 40,
          paddingTop: '24px',
          paddingBottom: '24px',
        }}>
          {/* Sidebar header */}
          <div style={{ padding: '0 16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: '#ededf2', border: '1px solid #c2c7d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: '700', color: '#054471'
              }}>
                {user.role === 'ADMIN' ? 'A' : 'V'}
              </div>
              <div>
                <div style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '14px', color: '#1a1c1f' }}>Admin Panel</div>
                <div style={{ fontFamily: 'Inter', fontWeight: '400', fontSize: '12px', color: '#42474f' }}>Relocation Authority</div>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 8px' }}>
            <NavItem to="/dashboard" icon="dashboard" label="Dashboard" active={isDashboardActive} filled={isDashboardActive} />
            <NavItem to="/decisions" icon="swap_horiz" label="Relocations" active={isRelocationsActive} filled={isRelocationsActive} />
            <NavItem to="/resources" icon="inventory_2" label="Resources" active={isResourcesActive} filled={isResourcesActive} />
            <NavItem to="/audit-logs" icon="analytics" label="Reports" active={isAuditActive} filled={isAuditActive} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1,
          marginLeft: '240px',
          overflowY: 'auto',
          backgroundColor: '#f9f9fd',
          padding: '24px',
          minHeight: 'calc(100vh - 64px)',
        }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, label, active, filled }) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '2px',
        textDecoration: 'none',
        fontFamily: 'Inter',
        fontSize: '14px',
        lineHeight: '20px',
        fontWeight: active ? '600' : '400',
        color: active ? '#054471' : '#42474f',
        backgroundColor: active ? '#ededf2' : 'transparent',
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#f3f3f8'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '20px', fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}