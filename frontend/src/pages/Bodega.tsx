import { useState } from 'react';
import { api } from '../services/api';
import { getUserInfo } from '../services/auth';
import { Package, PackagePlus, AlertCircle, CheckCircle, Database, Search, Edit3, Trash2, Eye, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export const Bodega = () => {
  const user = getUserInfo();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, id: number | null, isLoading: boolean}>({
    isOpen: false, id: null, isLoading: false
  });
  
  const [detalleRepuesto, setDetalleRepuesto] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    id: null as number | null,
    tipoComponente: '',
    nombre: '',
    numeroSerie: '',
    cantidad: 1,
    estado: 'Disponible',
    fechaIngreso: new Date().toISOString().slice(0, 10),
  });

  const { data: repuestos = [], isLoading, refetch } = useQuery({
    queryKey: ['repuestos', user?.centro_id],
    queryFn: async () => {
      const currentUser = getUserInfo();
      const filter = currentUser?.centro_id ? `?centro=${currentUser.centro_id}` : '';
      const { data } = await api.get(`/repuesto_inventarios${filter}`);
      return data['hydra:member'] || data;
    }
  });

  const { data: tiposComponente = [], refetch: refetchTipos } = useQuery({
    queryKey: ['tipos_componente'],
    queryFn: async () => {
      const { data } = await api.get(`/tipo_componentes`);
      return data['hydra:member'] || data;
    }
  });

  const handleCreateTipoComponente = async () => {
    const nombre = prompt('Ingresa el nombre de la nueva categoría de repuesto (Ej: Memoria RAM, Fuente de Poder):');
    if (!nombre) return;
    try {
      const { data } = await api.post('/tipo_componentes', { nombre });
      refetchTipos();
      setFormData({ ...formData, tipoComponente: data.id.toString() });
    } catch (error) {
      alert('Error al crear el tipo de componente. Asegúrate de tener permisos.');
    }
  };

  const handleEditRepuesto = (r: any) => {
    setFormData({
      id: r.id,
      tipoComponente: r.tipoComponente?.id ? r.tipoComponente.id.toString() : '',
      nombre: r.nombre || '',
      numeroSerie: r.numeroSerie || '',
      cantidad: r.cantidad || 1,
      estado: r.estado || 'Disponible',
      fechaIngreso: r.fechaIngreso ? r.fechaIngreso.split('T')[0] : new Date().toISOString().slice(0, 10),
    });
    setIsModalOpen(true);
  };

  const handleDeleteRepuesto = (id: number) => {
    setDeleteModalState({ isOpen: true, id, isLoading: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        tipoComponente: `/api/tipo_componentes/${formData.tipoComponente}`,
        nombre: formData.nombre,
        numeroSerie: formData.numeroSerie || null,
        cantidad: Number(formData.cantidad),
        estado: formData.estado,
        fechaIngreso: `${formData.fechaIngreso}T00:00:00Z`
      };
      
      // Assign the repuesto specifically to the user's center
      if (user?.centro_id) {
        payload.centro = `/api/centros/${user.centro_id}`;
      }

      if (formData.id) {
        await api.put(`/repuesto_inventarios/${formData.id}`, payload);
      } else {
        await api.post('/repuesto_inventarios', payload);
      }
      
      setIsModalOpen(false);
      setFormData({
        id: null,
        tipoComponente: '',
        nombre: '',
        numeroSerie: '',
        cantidad: 1,
        estado: 'Disponible',
        fechaIngreso: new Date().toISOString().slice(0, 10),
      });
      refetch();
    } catch (error: any) {
      console.error("Error creating repuesto:", error);
      alert('Error al ingresar el repuesto: ' + (error.response?.data?.['hydra:description'] || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Disponible': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Reservado': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Agotado': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fade-in pb-12">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Database className="text-brand-600" size={32} /> Reporte de Repuestos
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Gestión de stock de componentes y suministros para mantenimiento.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => {
            setFormData({
              id: null,
              tipoComponente: '',
              nombre: '',
              numeroSerie: '',
              cantidad: 1,
              estado: 'Disponible',
              fechaIngreso: new Date().toISOString().slice(0, 10),
            });
            setIsModalOpen(true);
          }} className="bg-brand-600 border border-brand-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all hover:bg-brand-700">
            <PackagePlus size={20} /> Ingresar Stock
          </button>
        </div>
      </div>

        {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-brand-500" size={20} /> Inventario Actual
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar repuesto..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500 w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold border-b border-slate-100">Repuesto / Descripción</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">Categoría</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">Ubicación</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">Stock</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100">Estado</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-100 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Cargando inventario de bodega...</td></tr>
              ) : (() => {
                const q = searchTerm.toLowerCase();
                const filtered = repuestos.filter((r: any) =>
                  r.nombre?.toLowerCase().includes(q) ||
                  r.tipoComponente?.nombre?.toLowerCase().includes(q) ||
                  r.numeroSerie?.toLowerCase().includes(q)
                );
                if (filtered.length === 0) return (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    {searchTerm ? `Sin resultados para "${searchTerm}"` : 'No hay repuestos registrados en este centro.'}
                  </td></tr>
                );
                return filtered.map((r: any) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{r.nombre}</p>
                      <p className="text-xs text-slate-500 mt-1">S/N: {r.numeroSerie || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{r.tipoComponente?.nombre || 'General'}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-1.5 mt-2">
                      <span className="w-2 h-2 rounded-full bg-slate-300"></span> {r.centro?.nombre || 'Global'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-slate-700">{r.cantidad}</span>
                        <span className="text-xs text-slate-400 uppercase tracking-widest">Unid</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(r.estado)}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button onClick={() => setDetalleRepuesto(r)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Ver Detalles">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleEditRepuesto(r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => handleDeleteRepuesto(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MODO CREAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden fade-in" onSubmit={handleSubmit}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-brand-50">
              <h2 className="text-lg font-bold text-brand-800 flex items-center gap-2">
                <PackagePlus size={20} /> {formData.id ? 'Editar Repuesto' : 'Ingreso de Repuesto'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-brand-400 hover:text-brand-700 bg-white shadow-sm px-3 py-1 text-sm font-bold rounded-full">Cerrar</button>
            </div>
            
            <div className="p-6 space-y-4">
              {!formData.id && (
                <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 text-sm flex gap-3 items-start mb-2">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <p>El repuesto será ingresado físicamente al inventario de: <strong>{user?.centro_nombre || 'Centro Actual'}</strong></p>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-slate-700">Tipo de Componente *</label>
                  <button type="button" onClick={handleCreateTipoComponente} className="text-brand-600 hover:text-brand-800 text-xs font-bold leading-none">
                    + Nuevo Tipo
                  </button>
                </div>
                <select required value={formData.tipoComponente} onChange={e=>setFormData({...formData, tipoComponente: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800 transition-all">
                  <option value="">Seleccionar tipo...</option>
                  {tiposComponente.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre / Especificación Detallada *</label>
                <input required type="text" value={formData.nombre} onChange={e=>setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Memoria RAM DDR4 Kingston 16GB 3200MHz" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Número de Serie</label>
                  <input type="text" value={formData.numeroSerie} onChange={e=>setFormData({...formData, numeroSerie: e.target.value})} placeholder="Opcional" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Cantidad Inicial *</label>
                  <input required type="number" min="1" value={formData.cantidad} onChange={e=>setFormData({...formData, cantidad: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800 transition-all font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
                  <select required value={formData.estado} onChange={e=>setFormData({...formData, estado: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800 transition-all">
                    <option value="Disponible">Disponible</option>
                    <option value="Reservado">Reservado</option>
                    <option value="Agotado">Agotado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha Ingreso</label>
                  <input required type="date" value={formData.fechaIngreso} onChange={e=>setFormData({...formData, fechaIngreso: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800 transition-all" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className={`bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 ${saving ? 'opacity-70' : ''}`}>
                  {saving ? 'Registrando...' : <><CheckCircle size={18}/> Guardar Repuesto</>}
                </button>
            </div>
          </form>
        </div>
      )}

      {detalleRepuesto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-brand-50">
              <h2 className="text-xl font-bold text-brand-800 flex items-center gap-2">
                <Package size={20}/> Detalle de Repuesto
              </h2>
              <button onClick={() => setDetalleRepuesto(null)} className="text-brand-400 hover:text-brand-700 bg-white shadow-sm p-1 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Descripción</span><span className="text-slate-800 font-bold">{detalleRepuesto.nombre}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Tipo Componente</span><span className="text-slate-800">{detalleRepuesto.tipoComponente?.nombre || '-'}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Número de Serie</span><span className="text-slate-800">{detalleRepuesto.numeroSerie || 'N/A'}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Cantidad</span><span className="text-brand-600 font-bold">{detalleRepuesto.cantidad} Unid.</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Fecha de Ingreso</span><span className="text-slate-800">{detalleRepuesto.fechaIngreso ? new Date(detalleRepuesto.fechaIngreso).toLocaleDateString() : '-'}</span></div>
                <div>
                  <span className="text-slate-400 font-semibold block text-xs uppercase">Estado</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border mt-0.5 inline-block ${getStatusColor(detalleRepuesto.estado)}`}>
                    {detalleRepuesto.estado}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setDetalleRepuesto(null)} className="px-5 py-2 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal 
        isOpen={deleteModalState.isOpen}
        title="Eliminar Repuesto"
        message="¿Estás seguro de eliminar este repuesto de la bodega? Esta acción no se puede deshacer."
        isDeleting={deleteModalState.isLoading}
        onCancel={() => setDeleteModalState(prev => ({...prev, isOpen: false}))}
        onConfirm={async () => {
          setDeleteModalState(prev => ({...prev, isLoading: true}));
          try {
            await api.delete(`/repuesto_inventarios/${deleteModalState.id}`);
            refetch();
            setDeleteModalState(prev => ({...prev, isOpen: false, isLoading: false}));
          } catch {
            alert('Error al eliminar repuesto. Puede que esté en uso en el historial de algún ticket.');
            setDeleteModalState(prev => ({...prev, isLoading: false}));
          }
        }}
      />

    </div>
  );
};
