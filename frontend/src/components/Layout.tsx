import { useState, useEffect } from 'react';
import { Outlet, Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PackageSearch, LogOut, Settings, Wrench, Database, ChevronDown, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { getUserInfo } from '../services/auth';

export const Layout = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const userInfo = getUserInfo();
  const isSuperUser = !userInfo?.centro_id;
  
  const [centros, setCentros] = useState<any[]>([]);
  const [isMantenimientoOpen, setIsMantenimientoOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isSuperUser) {
      api.get('/centros').then(r => setCentros(r.data['hydra:member'] || r.data)).catch(console.error);
    }
  }, [isSuperUser]);

  useEffect(() => {
    if (location.pathname.startsWith('/mantenimiento')) {
      setIsMantenimientoOpen(true);
    }
  }, [location.pathname]);

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
            end
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
            Gestión de Equipos
          </NavLink>

          {!userInfo?.centro_id ? (
            <div className="flex flex-col">
              <NavLink 
                to="/mantenimiento"
                className={`nav-link cursor-pointer ${location.pathname.startsWith('/mantenimiento') ? 'active' : ''}`}
                onClick={() => setIsMantenimientoOpen(!isMantenimientoOpen)}
              >
                <Wrench size={20} />
                Mantenimiento
                <ChevronDown size={16} className={`ml-auto transition-transform ${isMantenimientoOpen ? 'rotate-180' : ''}`} />
              </NavLink>
              {isMantenimientoOpen && (
                <div className="pl-4 pr-2 flex flex-col gap-1 mt-1 mb-2">
                  {centros.map(c => (
                    <NavLink
                      key={c.id}
                      to={`/mantenimiento?centro=${c.id}`}
                      className={() => `nav-link !py-2 !text-[13px] flex items-center gap-2 group transition-colors ${location.search === `?centro=${c.id}` ? '!bg-brand-50 !text-brand-700 font-bold' : ''}`}
                    >
                      <Building2 size={16} className={`transition-colors ${location.search === `?centro=${c.id}` ? 'text-brand-500' : 'text-slate-400 group-hover:text-brand-500'}`} />
                      {c.nombre}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink 
              to="/mantenimiento" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Wrench size={20} />
              Mantenimiento
            </NavLink>
          )}

          <NavLink 
            to="/bodega" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Database size={20} />
            Repuestos
          </NavLink>

          <NavLink 
            to="/administracion" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Settings size={20} />
            Administración
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
              {user?.email?.charAt(0)?.toUpperCase() || 'U'}
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

