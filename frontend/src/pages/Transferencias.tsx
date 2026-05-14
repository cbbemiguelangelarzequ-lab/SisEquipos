import { useState } from 'react';
import { api } from '../services/api';
import { 
  ArrowRightLeft, Plus, Search, Filter, CheckCircle, 
  XCircle, FileText, Printer, Building2, Eye, Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getUserInfo } from '../services/auth';

export default function Transferencias() {
  const { user } = useAuth();
  const userInfo = getUserInfo(); // Contiene centro_id, id, etc. del JWT completo
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('lista'); // 'lista' | 'nueva'
  
  // Estado para nueva transferencia
  const [formData, setFormData] = useState({
    centroOrigen: '',
    centroDestino: '',
    seccionOrigen: '',
    seccionDestino: '',
    motivo: '',
  });
  const [selectedEquipos, setSelectedEquipos] = useState<any[]>([]);
  const [equipoSearch, setEquipoSearch] = useState('');
  
  // Modals
  const [detalleTransf, setDetalleTransf] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{isOpen: boolean, id: number | null, action: 'approve'|'reject'}>({isOpen: false, id: null, action: 'approve'});
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });

  // Queries base
  const { data: centros = [] } = useQuery({
    queryKey: ['centros'],
    queryFn: () => api.get('/centros?pagination=false').then(res => res.data['hydra:member'] || res.data)
  });

  const { data: secciones = [] } = useQuery({
    queryKey: ['secciones'],
    queryFn: () => api.get('/seccions?pagination=false').then(res => res.data['hydra:member'] || res.data)
  });

  // Equipos del centro origen para seleccionar
  const { data: equiposOrigen = [] } = useQuery({
    queryKey: ['equipos', formData.centroOrigen],
    enabled: !!formData.centroOrigen,
    queryFn: () => api.get(`/equipos?centro=${formData.centroOrigen}&itemsPerPage=1000`).then(res => res.data['hydra:member'] || res.data)
  });

  // Transferencias List — filtra por centro usando getUserInfo() que si tiene centro_id
  const { data: transferencias = [], isLoading: isLoadingTransf } = useQuery({
    queryKey: ['transferencias', userInfo?.centro_id],
    queryFn: async () => {
      if (!userInfo?.centro_id) {
        // Super usuario: ve todas las transferencias de todos los centros
        const res = await api.get('/transferencia_activos?order[fechaSolicitud]=DESC&pagination=false');
        return res.data['hydra:member'] || res.data;
      } else {
        // Usuario normal: ve solo las transferencias donde su centro es origen O destino
        const [resOrigen, resDestino] = await Promise.all([
          api.get(`/transferencia_activos?centroOrigen=${userInfo.centro_id}&order[fechaSolicitud]=DESC&pagination=false`),
          api.get(`/transferencia_activos?centroDestino=${userInfo.centro_id}&order[fechaSolicitud]=DESC&pagination=false`)
        ]);
        const origen: any[] = resOrigen.data['hydra:member'] || resOrigen.data || [];
        const destino: any[] = resDestino.data['hydra:member'] || resDestino.data || [];
        // Fusionar eliminando duplicados por ID
        const mapa = new Map<number, any>();
        [...origen, ...destino].forEach((t: any) => mapa.set(t.id, t));
        return Array.from(mapa.values()).sort((a: any, b: any) =>
          new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
        );
      }
    }
  });

  // Mutations
  const createTransferencia = useMutation({
    mutationFn: async (data: any) => {
      // 1. Create TransferenciaActivo
      const userInfo = getUserInfo();
      const res = await api.post('/transferencia_activos', {
        centroOrigen: `/api/centros/${data.centroOrigen}`,
        centroDestino: `/api/centros/${data.centroDestino}`,
        seccionOrigen: data.seccionOrigen ? `/api/seccions/${data.seccionOrigen}` : undefined,
        seccionDestino: data.seccionDestino ? `/api/seccions/${data.seccionDestino}` : undefined,
        motivo: data.motivo,
        solicitadoPor: userInfo?.id ? `/api/usuarios/${userInfo.id}` : undefined
      });
      const transfId = res.data.id;
      
      // 2. Add Items
      for (const eq of data.equipos) {
        await api.post('/transferencia_items', {
          transferencia: `/api/transferencia_activos/${transfId}`,
          equipo: `/api/equipos/${eq.id}`,
          estadoActivo: eq.estadoActivo || '2 - Bueno'
        });
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
      setActiveTab('lista');
      setFormData({ centroOrigen: '', centroDestino: '', seccionOrigen: '', seccionDestino: '', motivo: '' });
      setSelectedEquipos([]);
      setMessageModal({
        isOpen: true,
        type: 'success',
        title: '¡Éxito!',
        message: 'Transferencia registrada exitosamente.'
      });
    },
    onError: (error: any) => {
      console.error(error);
      setMessageModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Registro',
        message: "Error al registrar la transferencia: " + (error.response?.data?.['hydra:description'] || error.message)
      });
    }
  });

  const approveTransferencia = useMutation({
    mutationFn: async (id: number) => {
      // Marcar completada
      const userInfo = getUserInfo();
      await api.patch(`/transferencia_activos/${id}`, 
        { estado: 'Completada', fechaTransferencia: new Date().toISOString(), autorizadoPor: userInfo?.id ? `/api/usuarios/${userInfo.id}` : undefined },
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
      
      // Obtener items para cambiar equipos
      const items = await api.get(`/transferencia_items?transferencia=/api/transferencia_activos/${id}`).then(r => r.data['hydra:member'] || r.data);
      
      // La transferencia tiene el destino
      const transf = transferencias.find((t: any) => t.id === id);
      const centroDestinoId = transf?.centroDestino?.id;
      const seccionDestinoId = transf?.seccionDestino?.id;
      
      if (centroDestinoId) {
        for(const item of items) {
          const equipoId = item.equipo?.id || item.equipo?.['@id']?.split('/').pop();
          const patchData: any = { centro: `/api/centros/${centroDestinoId}` };
          if (seccionDestinoId) {
            patchData.seccion = `/api/seccions/${seccionDestinoId}`;
          }
          await api.patch(`/equipos/${equipoId}`, patchData, { headers: { 'Content-Type': 'application/merge-patch+json' } });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      setMessageModal({
        isOpen: true,
        type: 'success',
        title: 'Transferencia Aprobada',
        message: 'La transferencia ha sido aprobada y los equipos han sido movidos exitosamente.'
      });
    }
  });

  const rejectTransferencia = useMutation({
    mutationFn: async (id: number) => {
      const userInfo = getUserInfo();
      await api.patch(`/transferencia_activos/${id}`, 
        { estado: 'Rechazada', autorizadoPor: userInfo?.id ? `/api/usuarios/${userInfo.id}` : undefined },
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
      setMessageModal({
        isOpen: true,
        type: 'success',
        title: 'Transferencia Rechazada',
        message: 'La solicitud de transferencia ha sido denegada y cancelada correctamente.'
      });
    }
  });

  const deleteTransferencia = useMutation({
    mutationFn: (id: number) => api.delete(`/transferencia_activos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
      setDetalleTransf(null);
    }
  });


  // Helpers
  const addEquipo = (eq: any) => {
    if (!selectedEquipos.find(e => e.id === eq.id)) {
      setSelectedEquipos([...selectedEquipos, { ...eq, estadoActivo: '2 - Bueno' }]);
    }
  };
  const removeEquipo = (id: number) => {
    setSelectedEquipos(selectedEquipos.filter(e => e.id !== id));
  };

  const handlePrintPDF = async (transf: any) => {
    try {
      const response = await api.get(`/reportes/transferencia/${transf.id}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `transferencia_${transf.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.detail
        || error.response?.data?.['hydra:description']
        || error.response?.data?.message
        || (error.response ? `Error ${error.response.status}` : error.message);
      setMessageModal({
        isOpen: true,
        type: 'error',
        title: 'Error al Generar PDF',
        message: `No se pudo generar el documento PDF. ${errorMsg}`
      });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <ArrowRightLeft className="text-brand-600" size={32} /> Transferencias de Activos
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Gestiona el movimiento de equipos entre centros y secciones.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('lista')} className={`px-4 py-2 font-bold rounded-xl transition-all ${activeTab === 'lista' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>Lista</button>
          <button onClick={() => setActiveTab('nueva')} className={`px-4 py-2 font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'nueva' ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-brand-600 border border-brand-200 hover:bg-brand-50'}`}><Plus size={18}/> Nueva Transferencia</button>
        </div>
      </div>

      {activeTab === 'lista' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden fade-in">
          {isLoadingTransf ? <div className="p-8 text-center text-slate-500">Cargando transferencias...</div> : 
           transferencias.length === 0 ? <div className="p-8 text-center text-slate-500">No hay transferencias registradas.</div> :
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-sm uppercase tracking-wider">
                 <tr>
                   <th className="px-6 py-4">ID</th>
                   <th className="px-6 py-4">Fecha</th>
                   <th className="px-6 py-4">Origen</th>
                   <th className="px-6 py-4">Destino</th>
                   <th className="px-6 py-4">Estado</th>
                   <th className="px-6 py-4 text-center">Acciones</th>
                 </tr>
               </thead>
               <tbody className="text-sm">
                 {transferencias.map((t:any) => (
                   <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                     <td className="px-6 py-4 font-bold text-slate-700">TRF-{t.id.toString().padStart(4,'0')}</td>
                     <td className="px-6 py-4 text-slate-500">{new Date(t.fechaSolicitud).toLocaleDateString()}</td>
                     <td className="px-6 py-4">
                       <div className="font-bold text-slate-800">{t.centroOrigen?.nombre}</div>
                       <div className="text-xs text-slate-500">{t.seccionOrigen?.nombre}</div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="font-bold text-brand-700">{t.centroDestino?.nombre}</div>
                       <div className="text-xs text-brand-500">{t.seccionDestino?.nombre}</div>
                     </td>
                     <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.estado === 'Completada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                         {t.estado}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex justify-center gap-2">
                         <button onClick={() => setDetalleTransf(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Detalles"><Eye size={18}/></button>
                         <button onClick={() => handlePrintPDF(t)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Imprimir Formulario"><Printer size={18}/></button>
                         {t.estado === 'Pendiente' && !user?.centro_id && (
                           <>
                             <button onClick={() => setConfirmAction({isOpen: true, id: t.id, action: 'approve'})} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Aprobar Transferencia"><CheckCircle size={18}/></button>
                             <button onClick={() => setConfirmAction({isOpen: true, id: t.id, action: 'reject'})} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Rechazar Transferencia"><XCircle size={18}/></button>
                           </>
                         )}
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
          }
        </div>
      )}

      {activeTab === 'nueva' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
          {/* Formulario Izquierda */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 p-4 font-bold text-slate-700 flex items-center gap-2">
                <Building2 size={18}/> Datos de Transferencia
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Centro Origen *</label>
                  <select required value={formData.centroOrigen} onChange={e => setFormData({...formData, centroOrigen: e.target.value, seccionOrigen: ''})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500">
                    <option value="">-- Seleccionar --</option>
                    {centros.map((c:any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sección Origen</label>
                  <select value={formData.seccionOrigen} onChange={e => setFormData({...formData, seccionOrigen: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500">
                    <option value="">Todas las secciones</option>
                    {secciones.filter((s:any) => {
                      const cId = typeof s.centro === 'object' ? s.centro?.id?.toString() : String(s.centro).split('/').pop();
                      return cId === formData.centroOrigen;
                    }).map((s:any) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div className="border-t border-slate-100 my-4"></div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Centro Destino *</label>
                  <select required value={formData.centroDestino} onChange={e => setFormData({...formData, centroDestino: e.target.value, seccionDestino: ''})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500">
                    <option value="">-- Seleccionar --</option>
                    {centros.map((c:any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sección Destino</label>
                  <select value={formData.seccionDestino} onChange={e => setFormData({...formData, seccionDestino: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500">
                    <option value="">Por definir / Ninguna</option>
                    {secciones.filter((s:any) => {
                      const cId = typeof s.centro === 'object' ? s.centro?.id?.toString() : String(s.centro).split('/').pop();
                      return cId === formData.centroDestino;
                    }).map((s:any) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div className="border-t border-slate-100 my-4"></div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Motivo (Opcional)</label>
                  <textarea rows={2} value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 resize-none" placeholder="Motivo de la transferencia..."></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Seleccion de Equipos Derecha */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="bg-slate-50 border-b border-slate-100 p-4 font-bold text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2"><Filter size={18}/> Equipos a Transferir</div>
                <span className="bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs">{selectedEquipos.length} seleccionados</span>
              </div>
              
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Buscar por código o nombre..." value={equipoSearch} onChange={e=>setEquipoSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-sm" disabled={!formData.centroOrigen}/>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex gap-4">
                {/* Available List */}
                <div className="flex-1 border border-slate-200 rounded-xl overflow-y-auto">
                  <div className="sticky top-0 bg-slate-100 p-2 font-bold text-xs text-slate-600 text-center border-b border-slate-200">Disponibles en Origen</div>
                  {!formData.centroOrigen ? <div className="p-4 text-center text-xs text-slate-400">Selecciona centro origen primero</div> :
                   equiposOrigen.filter((eq:any) => (!formData.seccionOrigen || eq.seccion?.id?.toString() === formData.seccionOrigen) && (!equipoSearch || eq.nombre.toLowerCase().includes(equipoSearch.toLowerCase()) || eq.codigoInventario?.toLowerCase().includes(equipoSearch.toLowerCase())) && !selectedEquipos.find(se => se.id === eq.id)).map((eq:any) => (
                    <div key={eq.id} onClick={() => addEquipo(eq)} className="p-3 border-b border-slate-100 hover:bg-brand-50 cursor-pointer flex justify-between items-center group transition-colors">
                      <div>
                        <div className="font-bold text-xs text-slate-700">{eq.nombre}</div>
                        <div className="text-[10px] text-slate-500">{eq.codigoInventario || 'Sin Código'}</div>
                      </div>
                      <Plus size={16} className="text-brand-500 opacity-0 group-hover:opacity-100"/>
                    </div>
                  ))}
                </div>
                
                {/* Selected List */}
                <div className="flex-1 border border-brand-200 bg-brand-50/30 rounded-xl overflow-y-auto flex flex-col">
                  <div className="sticky top-0 bg-brand-100 p-2 font-bold text-xs text-brand-800 text-center border-b border-brand-200">Equipos Seleccionados</div>
                  {selectedEquipos.length === 0 ? <div className="p-4 text-center text-xs text-brand-400/70 flex-1 flex items-center justify-center">Lista vacía</div> :
                   selectedEquipos.map((eq:any) => (
                    <div key={eq.id} className="p-3 border-b border-brand-100 bg-white m-2 rounded-lg shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-xs text-brand-900">{eq.nombre}</div>
                          <div className="text-[10px] text-brand-600">{eq.codigoInventario || 'Sin Código'}</div>
                        </div>
                        <button onClick={() => removeEquipo(eq.id)} className="text-red-400 hover:text-red-600"><XCircle size={16}/></button>
                      </div>
                      <div>
                        <select value={eq.estadoActivo} onChange={e => setSelectedEquipos(selectedEquipos.map(se => se.id === eq.id ? {...se, estadoActivo: e.target.value} : se))} className="w-full text-[11px] p-1 border border-slate-200 rounded outline-none text-slate-600">
                          <option value="1 - Nuevo">1 - Nuevo</option>
                          <option value="2 - Bueno">2 - Bueno</option>
                          <option value="3+ - Regular">3+ - Regular</option>
                          <option value="3- - Deteriorado">3- - Deteriorado</option>
                          <option value="4 - Malo">4 - Malo</option>
                          <option value="5 - Obsoleto">5 - Obsoleto</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => createTransferencia.mutate({ ...formData, equipos: selectedEquipos })}
                  disabled={!formData.centroOrigen || !formData.centroDestino || selectedEquipos.length === 0 || createTransferencia.isPending}
                  className="bg-brand-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createTransferencia.isPending ? 'Guardando...' : <><ArrowRightLeft size={18}/> Registrar Transferencia</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Detalle Modal */}
      {detalleTransf && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-brand-600"/> Detalle de Transferencia TRF-{detalleTransf.id.toString().padStart(4,'0')}</h2>
              <button onClick={() => setDetalleTransf(null)} className="text-slate-400 hover:text-slate-600"><XCircle size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="block text-xs font-bold text-slate-400 uppercase">Origen</span>{detalleTransf.centroOrigen?.nombre} {detalleTransf.seccionOrigen ? '- '+detalleTransf.seccionOrigen.nombre : ''}</div>
                <div><span className="block text-xs font-bold text-brand-500 uppercase">Destino</span><strong className="text-brand-700">{detalleTransf.centroDestino?.nombre}</strong> {detalleTransf.seccionDestino ? '- '+detalleTransf.seccionDestino.nombre : ''}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="block text-xs font-bold text-slate-400 uppercase">Fecha</span>{new Date(detalleTransf.fechaSolicitud).toLocaleDateString()}</div>
                <div><span className="block text-xs font-bold text-slate-400 uppercase">Estado</span>{detalleTransf.estado}</div>
              </div>
              <div><span className="block text-xs font-bold text-slate-400 uppercase">Solicitado Por</span>{detalleTransf.solicitadoPor?.nombre || '-'}</div>
              <div><span className="block text-xs font-bold text-slate-400 uppercase">Motivo</span>{detalleTransf.motivo || <i className="text-slate-400">Sin motivo especificado</i>}</div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-3">
              <button onClick={() => deleteTransferencia.mutate(detalleTransf.id)} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2"><Trash2 size={16}/> Eliminar</button>
              <button onClick={() => handlePrintPDF(detalleTransf)} className="bg-brand-600 text-white hover:bg-brand-700 px-6 py-2 rounded-xl font-bold transition-colors flex items-center gap-2"><Printer size={16}/> Imprimir PDF</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Message Modal */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative">
            <button 
              onClick={() => setMessageModal({ ...messageModal, isOpen: false })} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 transition-colors"
            >
              <XCircle size={20} />
            </button>
            <div className="p-6 pt-8 text-center">
              {messageModal.type === 'error' ? (
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
                  <XCircle size={32} />
                </div>
              ) : (
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
                  <CheckCircle size={32} />
                </div>
              )}
              <h2 className="text-xl font-bold text-slate-800 mb-2">{messageModal.title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">{messageModal.message}</p>
              <button 
                onClick={() => setMessageModal({ ...messageModal, isOpen: false })} 
                className={`w-full px-4 py-2.5 font-bold text-white rounded-xl transition-colors shadow-sm ${messageModal.type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-600 hover:bg-brand-700'}`}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative">
            <button 
              onClick={() => setConfirmAction({ isOpen: false, id: null, action: 'approve' })} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 transition-colors"
            >
              <XCircle size={20} />
            </button>
            <div className="p-6 pt-8 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-4 ${confirmAction.action === 'approve' ? 'bg-emerald-100 text-emerald-600 border-emerald-50' : 'bg-red-100 text-red-600 border-red-50'}`}>
                {confirmAction.action === 'approve' ? <CheckCircle size={32} /> : <XCircle size={32} />}
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                {confirmAction.action === 'approve' ? 'Aprobar Transferencia' : 'Rechazar Transferencia'}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                {confirmAction.action === 'approve' 
                  ? '¿Está seguro de aprobar esta transferencia? Confirme que ya cuenta con el formulario impreso y debidamente firmado por los responsables. Al aprobar, los equipos cambiarán de ubicación físicamente en el sistema.'
                  : '¿Está seguro de rechazar esta transferencia? La solicitud será cancelada y los equipos permanecerán en su ubicación actual.'}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmAction({ isOpen: false, id: null, action: 'approve' })} 
                  className="flex-1 px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  disabled={approveTransferencia.isPending || rejectTransferencia.isPending}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (confirmAction.id) {
                      if (confirmAction.action === 'approve') approveTransferencia.mutate(confirmAction.id);
                      else rejectTransferencia.mutate(confirmAction.id);
                    }
                    setConfirmAction({ isOpen: false, id: null, action: 'approve' });
                  }} 
                  disabled={approveTransferencia.isPending || rejectTransferencia.isPending}
                  className={`flex-1 px-4 py-2.5 font-bold text-white rounded-xl transition-colors shadow-sm ${confirmAction.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {confirmAction.action === 'approve' ? 'Aprobar' : 'Rechazar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
