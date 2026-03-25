import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Archive, Plus, Search, Edit3, Trash2 } from 'lucide-react';

interface Equipo {
  id: number;
  codigoInventario: string;
  nombre: string;
  marca: string;
  modelo: string;
  vidaUtilMeses: number | null;
  fechaAdquisicion: string | null;
  porcentajeVidaUtilConsumido: number | null;
  obsoleto: boolean | null;
  seccion: any | null;
  categoria: any | null;
}

export const Inventario = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEquipos();
  }, []);

  const fetchEquipos = async () => {
    try {
      const response = await api.get('/equipos');
      // API Platform generally returns items inside hydra:member
      setEquipos(response.data['hydra:member'] || response.data || []);
    } catch (error) {
      console.error('Error fetching equipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipos = equipos.filter(e => 
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.codigoInventario.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Archive color="var(--primary)" />
            Gestión de Inventario
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Visualiza y administra todos los equipos médicos y tecnológicos.
          </p>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '12px 24px' }}>
          <Plus size={20} /> Nuevo Equipo
        </button>
      </div>

      <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por nombre, código..." 
              style={{ paddingLeft: '48px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando inventario...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <th style={{ padding: '16px 8px' }}>Código</th>
                  <th style={{ padding: '16px 8px' }}>Nombre</th>
                  <th style={{ padding: '16px 8px' }}>Marca / Modelo</th>
                  <th style={{ padding: '16px 8px' }}>Vida Útil Gastada</th>
                  <th style={{ padding: '16px 8px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipos.map((equipo) => (
                  <tr key={equipo.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '16px 8px', fontWeight: '500' }}>{equipo.codigoInventario || 'Sin Código'}</td>
                    <td style={{ padding: '16px 8px' }}>{equipo.nombre}</td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>{equipo.marca} {equipo.modelo}</td>
                    <td style={{ padding: '16px 8px' }}>
                      {equipo.porcentajeVidaUtilConsumido !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '100px', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min(equipo.porcentajeVidaUtilConsumido, 100)}%`, 
                              height: '100%', 
                              background: equipo.obsoleto ? 'var(--error)' : 'var(--success)' 
                            }} />
                          </div>
                          <span style={{ fontSize: '13px', color: equipo.obsoleto ? 'var(--error)' : 'var(--text-muted)' }}>
                            {equipo.porcentajeVidaUtilConsumido}%
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No calculable</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 8px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                        <Edit3 size={18} />
                      </button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredEquipos.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No se encontraron equipos en el inventario.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
