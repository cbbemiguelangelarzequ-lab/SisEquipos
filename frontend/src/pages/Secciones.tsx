import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapPin, Plus } from 'lucide-react';

interface Seccion {
  id: number;
  nombre: string;
  ubicacionFisica: string | null;
  descripcion: string | null;
}

export const Secciones = () => {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecciones();
  }, []);

  const fetchSecciones = async () => {
    try {
      const response = await api.get('/seccions'); // By default API Platform pluralizes to seccions or secciones, adjust if needed
      setSecciones(response.data['hydra:member'] || response.data || []);
    } catch (error) {
      console.error('Error fetching secciones:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin color="var(--primary)" />
            Secciones Médicas / Físicas
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
            Administra los departamentos o áreas del centro médico.
          </p>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '12px 24px' }}>
          <Plus size={20} /> Agregar Sección
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando secciones...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {secciones.map((seccion) => (
            <div key={seccion.id} style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="var(--primary)" />
                {seccion.nombre}
              </h3>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 16px 0', fontSize: '14px' }}>
                {seccion.ubicacionFisica || 'Sin ubicación específica'}
              </p>
              {seccion.descripcion && (
                <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-main)' }}>
                  {seccion.descripcion}
                </p>
              )}
            </div>
          ))}

          {secciones.length === 0 && (
            <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', padding: '40px', borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Aún no hay secciones creadas en el sistema.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
