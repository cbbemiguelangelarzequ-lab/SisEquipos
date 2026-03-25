import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PackageSearch, LogOut, MapPin } from 'lucide-react';

export const Layout = () => {
  const { isAuthenticated, logout, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout fade-in">
      <aside className="sidebar">
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)' }}>
          <img 
            src="https://cmnyrsc.aben.gob.bo/assets/img/convenios/caja%20petrolera.jpg" 
            alt="Logo Caja Petrolera" 
            style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px' }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1.2' }}>SisEquipos</span>
            <span style={{ fontSize: '11px', fontWeight: '600', opacity: 0.8, letterSpacing: '0.05em' }}>CAJA PETROLERA</span>
          </div>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>

          <NavLink 
            to="/inventario" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <PackageSearch size={20} />
            Inventario
          </NavLink>

          <NavLink 
            to="/secciones" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <MapPin size={20} />
            Secciones
          </NavLink>
          
          <div className="nav-link nav-logout" onClick={logout} style={{ marginTop: 'auto' }}>
            <LogOut size={20} />
            Cerrar Sesión
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.nombre?.charAt(0) || 'U'}
            </div>
            {user?.email || 'user@example.com'}
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
