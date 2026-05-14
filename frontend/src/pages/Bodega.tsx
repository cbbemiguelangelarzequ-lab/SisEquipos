import { useState } from 'react';
import { api } from '../services/api';
import { getUserInfo } from '../services/auth';
import { Package, PackagePlus, AlertCircle, CheckCircle, Database, Search, Edit3, Trash2, Eye, X, UploadCloud, Banknote, FileSpreadsheet } from 'lucide-react';
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

  // Estados para Importación Excel
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Estados para Caja Chica
  const [isCajaChicaOpen, setIsCajaChicaOpen] = useState(false);
  const [cajaChicaData, setCajaChicaData] = useState({
    concepto: '', proveedor: '', tipoComponente: '', cantidad: 1, montoBs: 0
  });

  const [formData, setFormData] = useState({
    id: null as number | null,
    tipoComponente: '',
    nombre: '',
    numeroSerie: '',
    cantidad: 1,
    estado: 'Disponible',
    fechaIngreso: new Date().toISOString().slice(0, 10),
    precio: 0,
  });

  const { data: repuestos = [], isLoading, refetch } = useQuery({
    queryKey: ['repuestos', user?.centro_id],
    staleTime: 0,
    refetchOnMount: 'always',
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
      precio: r.precio || 0,
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
      // Auto-calcular estado según la cantidad
      const cantidad = Number(formData.cantidad);
      let estadoFinal = formData.estado;
      if (cantidad <= 0) {
        estadoFinal = 'Agotado';
      } else if (estadoFinal === 'Agotado') {
        // Si tenía stock agotado pero ahora hay stock, pasa a Disponible
        estadoFinal = 'Disponible';
      }

      const payload: any = {
        tipoComponente: `/api/tipo_componentes/${formData.tipoComponente}`,
        nombre: formData.nombre,
        numeroSerie: formData.numeroSerie || null,
        cantidad: cantidad,
        estado: estadoFinal,
        fechaIngreso: `${formData.fechaIngreso}T00:00:00Z`,
        precio: formData.precio ? formData.precio.toString() : '0',
        fuente: 'Almacen'
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
        precio: 0,
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

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    import('xlsx').then((XLSX) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const mapped = data.map((row: any) => ({
          nombre: row.nombre || row.Nombre || row.Descripción || row.descripcion || '',
          tipoStr: row.tipo_componente || row['Tipo Componente'] || row.categoria || 'General',
          cantidad: Number(row.cantidad || row.Cantidad || 1),
          precio: Number(row.precio_unitario || row['Precio Unitario'] || row.precio || 0),
          numeroSerie: row.numero_serie || row['Número de Serie'] || row.sn || null
        }));
        
        setExcelData(mapped.filter(m => m.nombre));
      };
      reader.readAsBinaryString(file);
    });
  };

  const handleImportExcel = async () => {
    setImporting(true);
    try {
      const defaultTipo = tiposComponente.length > 0 ? tiposComponente[0].id : null;
      if (!defaultTipo) {
        alert("Debes crear al menos un Tipo de Componente antes de importar.");
        setImporting(false);
        return;
      }
      
      for (const row of excelData) {
        const foundTipo = tiposComponente.find((t:any) => t.nombre.toLowerCase().includes(row.tipoStr.toLowerCase()));
        const tipoId = foundTipo ? foundTipo.id : defaultTipo;

        const payload: any = {
          tipoComponente: `/api/tipo_componentes/${tipoId}`,
          nombre: row.nombre,
          numeroSerie: row.numeroSerie,
          cantidad: row.cantidad,
          estado: row.cantidad > 0 ? 'Disponible' : 'Agotado',
          fechaIngreso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
          precio: row.precio.toString(),
          fuente: 'Almacen'
        };

        if (user?.centro_id) { payload.centro = `/api/centros/${user.centro_id}`; }
        await api.post('/repuesto_inventarios', payload);
      }
      
      setIsExcelOpen(false);
      setExcelData([]);
      refetch();
      alert('Importación completada con éxito');
    } catch (error) {
      alert('Error en la importación. Algunos registros pueden no haberse guardado.');
    } finally {
      setImporting(false);
    }
  };

  const handleSubmitCajaChica = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const precioUnitario = cajaChicaData.cantidad > 0 ? (cajaChicaData.montoBs / cajaChicaData.cantidad) : 0;
      const payload: any = {
        tipoComponente: `/api/tipo_componentes/${cajaChicaData.tipoComponente}`,
        nombre: `${cajaChicaData.concepto} (Prov: ${cajaChicaData.proveedor})`,
        cantidad: Number(cajaChicaData.cantidad),
        estado: Number(cajaChicaData.cantidad) > 0 ? 'Disponible' : 'Agotado',
        fechaIngreso: `${new Date().toISOString().slice(0, 10)}T00:00:00Z`,
        precio: precioUnitario.toString(),
        fuente: 'CajaChica'
      };
      
      if (user?.centro_id) { payload.centro = `/api/centros/${user.centro_id}`; }
      await api.post('/repuesto_inventarios', payload);
      setIsCajaChicaOpen(false);
      setCajaChicaData({ concepto: '', proveedor: '', tipoComponente: '', cantidad: 1, montoBs: 0 });
      refetch();
    } catch (error) {
      alert('Error al registrar caja chica');
    } finally {
      setSaving(false);
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
          <button onClick={() => setIsCajaChicaOpen(true)} className="bg-white text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all hover:bg-slate-50 hover:text-brand-600 hover:border-brand-300">
            <Banknote size={18} /> Caja Chica
          </button>
          <button onClick={() => setIsExcelOpen(true)} className="bg-white text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all hover:bg-slate-50 hover:text-brand-600 hover:border-brand-300">
            <UploadCloud size={18} /> Importar Excel
          </button>
          <button onClick={() => {
            setFormData({
              id: null,
              tipoComponente: '',
              nombre: '',
              numeroSerie: '',
              cantidad: 1,
              estado: 'Disponible',
              fechaIngreso: new Date().toISOString().slice(0, 10),
              precio: 0,
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
                      <p className="font-bold text-slate-800">
                        {r.nombre}
                        {r.fuente === 'CajaChica' && <span className="ml-2 bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase">🏷 CC</span>}
                      </p>
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
                      <div className="text-xs text-brand-600 font-bold mt-1">Bs. {r.precio || '0.00'} c/u</div>
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Precio Unitario (Bs.)</label>
                  <input required type="number" step="0.01" min="0" value={formData.precio} onChange={e=>setFormData({...formData, precio: parseFloat(e.target.value) || 0})} placeholder="Ej. 150.50" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800 transition-all font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Cantidad *</label>
                  <input required type="number" min="0" value={formData.cantidad} onChange={e => {
                    const cant = Number(e.target.value);
                    // Recalcular estado automáticamente según cantidad
                    let nuevoEstado = formData.estado;
                    if (cant <= 0) nuevoEstado = 'Agotado';
                    else if (nuevoEstado === 'Agotado') nuevoEstado = 'Disponible';
                    setFormData({...formData, cantidad: cant, estado: nuevoEstado});
                  }} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800 transition-all font-bold" />
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
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Precio Unitario</span><span className="text-slate-800 font-bold">Bs. {detalleRepuesto.precio || '0.00'}</span></div>
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

      {/* MODAL IMPORTAR EXCEL */}
      {isExcelOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-brand-50">
              <h2 className="text-lg font-bold text-brand-800 flex items-center gap-2">
                <FileSpreadsheet size={20} /> Importar Repuestos desde Excel
              </h2>
              <button onClick={() => {setIsExcelOpen(false); setExcelData([]);}} className="text-brand-400 hover:text-brand-700 bg-white p-1 shadow-sm rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="border-2 border-dashed border-brand-200 rounded-xl p-8 text-center bg-brand-50/30 hover:bg-brand-50/50 transition-colors mb-6 relative">
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <UploadCloud size={40} className="text-brand-400 mx-auto mb-3" />
                <p className="font-bold text-brand-900 mb-1">Haz clic o arrastra un archivo aquí</p>
                <p className="text-sm text-brand-600">Soporta .xlsx, .xls, .csv</p>
                <p className="text-xs text-slate-500 mt-4">Columnas esperadas: nombre, tipo_componente, cantidad, precio_unitario, numero_serie</p>
              </div>

              {excelData.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center justify-between">
                    Vista previa de datos ({excelData.length} registros)
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Nombre</th>
                          <th className="p-3">Categoría Detectada</th>
                          <th className="p-3">Cant.</th>
                          <th className="p-3">Precio</th>
                          <th className="p-3">Serie</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {excelData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-800">{row.nombre}</td>
                            <td className="p-3 text-slate-600">{row.tipoStr}</td>
                            <td className="p-3 text-brand-600 font-bold">{row.cantidad}</td>
                            <td className="p-3 text-slate-600">{row.precio}</td>
                            <td className="p-3 text-slate-500 text-xs">{row.numeroSerie || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {excelData.length > 5 && <p className="text-center text-xs text-slate-400 mt-2 italic">Mostrando los primeros 5 registros...</p>}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 mt-auto">
              <button onClick={() => {setIsExcelOpen(false); setExcelData([]);}} className="px-5 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleImportExcel} disabled={importing || excelData.length === 0} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {importing ? 'Importando...' : <><CheckCircle size={18}/> Confirmar Importación</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CAJA CHICA */}
      {isCajaChicaOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
          <form onSubmit={handleSubmitCajaChica} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-brand-50">
              <h2 className="text-lg font-bold text-brand-800 flex items-center gap-2">
                <Banknote size={20} /> Ingreso por Caja Chica
              </h2>
              <button type="button" onClick={() => setIsCajaChicaOpen(false)} className="text-brand-400 hover:text-brand-700 bg-white p-1 shadow-sm rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-brand-100/50 text-brand-800 p-3 rounded-xl border border-brand-200 text-xs flex gap-3 items-start mb-2">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <p>Usa esto para compras menores. Se sumará al stock normal pero quedará marcado como <span className="font-bold">🏷 CC</span> en los reportes de inversión.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Concepto / Repuesto Comprado *</label>
                <input required type="text" value={cajaChicaData.concepto} onChange={e=>setCajaChicaData({...cajaChicaData, concepto: e.target.value})} placeholder="Ej. Pilas AAA para termómetros" className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Proveedor / Tienda *</label>
                <input required type="text" value={cajaChicaData.proveedor} onChange={e=>setCajaChicaData({...cajaChicaData, proveedor: e.target.value})} placeholder="Ej. Ferretería El Sol" className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Componente *</label>
                <select required value={cajaChicaData.tipoComponente} onChange={e=>setCajaChicaData({...cajaChicaData, tipoComponente: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800">
                  <option value="">Seleccionar tipo...</option>
                  {tiposComponente.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Cantidad Comprada *</label>
                  <input required type="number" min="1" value={cajaChicaData.cantidad} onChange={e=>setCajaChicaData({...cajaChicaData, cantidad: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800 font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Monto Total (Bs) *</label>
                  <input required type="number" step="0.01" min="0" value={cajaChicaData.montoBs} onChange={e=>setCajaChicaData({...cajaChicaData, montoBs: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-800 font-bold" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button type="button" onClick={() => setIsCajaChicaOpen(false)} className="px-5 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button type="submit" disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50">
                {saving ? 'Registrando...' : <><CheckCircle size={18}/> Guardar Gasto</>}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
