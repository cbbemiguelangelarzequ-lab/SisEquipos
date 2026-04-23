import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getUserInfo } from '../services/auth';
import { Wrench as Tool, Plus, CheckCircle, AlertTriangle, X, Clock, FileText, Camera, Printer, Eye, Info, Cpu, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

/* ── Sub-componente: visualizador de evidencias fotográficas de un historial ── */
const EvidenciasHistorial = ({ historialId }: { historialId: number }) => {
  const { data: evidencias = [], isLoading } = useQuery({
    queryKey: ['evidencias', historialId],
    queryFn: () => api.get(`/evidencia_mantenimientos?historial=/api/historials/${historialId}`)
      .then(r => r.data['hydra:member'] || r.data || [])
      .catch(() => []),
    enabled: !!historialId,
  });

  if (isLoading) return <div className="text-xs text-slate-400 italic py-2">Cargando evidencias...</div>;
  if (evidencias.length === 0) return (
    <div className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-3">
      Sin evidencia fotográfica registrada.
    </div>
  );

  const antes = evidencias.filter((e: any) => e.tipo === 'antes');
  const despues = evidencias.filter((e: any) => e.tipo === 'despues');

  return (
    <div>
      <span className="text-slate-400 font-semibold block text-xs uppercase mb-3 flex items-center gap-2">
        <Camera size={13} /> Evidencia Fotográfica ({evidencias.length} imagen{evidencias.length !== 1 ? 'es' : ''})
      </span>
      <div className="grid grid-cols-2 gap-3">
        {antes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase text-amber-600 mb-1.5">⚠ Antes del Trabajo</p>
            <div className="space-y-2">
              {antes.map((e: any) => (
                <img key={e.id} src={e.imagenBase64} alt="Antes" className="w-full rounded-lg border border-amber-200 object-cover max-h-40" />
              ))}
            </div>
          </div>
        )}
        {despues.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase text-emerald-600 mb-1.5">✓ Después del Trabajo</p>
            <div className="space-y-2">
              {despues.map((e: any) => (
                <img key={e.id} src={e.imagenBase64} alt="Después" className="w-full rounded-lg border border-emerald-200 object-cover max-h-40" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Mantenimiento = () => {
  const user = getUserInfo();
  const [searchParams] = useSearchParams();
  const queryCentro = searchParams.get('centro');
  
  let centroFilter = '';
  if (!user?.centro_id && queryCentro) {
    centroFilter = `?equipo.centro=${queryCentro}`;
  } else if (user?.centro_id) {
    centroFilter = `?equipo.centro=${user.centro_id}`;
  }

  const [activeTab, setActiveTab] = useState<'pendientes' | 'en_proceso' | 'historial'>('pendientes');
  const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);
  
  // Modals state
  const [isRegistrarModalOpen, setIsRegistrarModalOpen] = useState(false);
  const [isSolicitudModalOpen, setIsSolicitudModalOpen] = useState(false); // Para crear nuevas SOLICITUDES

  const [estados, setEstados] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Form for ticket closing (Mantenimiento Concluido)
  const [formData, setFormData] = useState({ accionRealizada: '', costo: '', estadoEquipoResultante: '' });
  const [selectedRepuestos, setSelectedRepuestos] = useState<any[]>([]); // { repuestoId, cantidad, motivo }
  const [evidenciaFotos, setEvidenciaFotos] = useState<{ tipo: 'antes' | 'despues'; base64: string; nombre: string }[]>([]);
  
  const [detalleHistorial, setDetalleHistorial] = useState<any>(null);
  
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, type: 'solicitud' | 'historial', id: number | null, isLoading: boolean}>({
    isOpen: false, type: 'solicitud', id: null, isLoading: false
  });
  const [componentesEquipo, setComponentesEquipo] = useState<any[]>([]);
  const [loadingComponentes, setLoadingComponentes] = useState(false);
  const [resolvedEquipo, setResolvedEquipo] = useState<any>(null);

  // Section filter for new solicitud
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [secciones, setSecciones] = useState<any[]>([]);

  // Form for new ticket (Nueva Solicitud)
  const [solicitudForm, setSolicitudForm] = useState({ equipo: '', descripcionFalla: '', prioridad: 'Media', fechaSolicitud: new Date().toISOString().slice(0,10) });

  // Queries
  const { data: solicitudes = [], refetch: refetchSolicitudes, isLoading: loadSol } = useQuery({
    queryKey: ['solicitudes', user?.centro_id, queryCentro],
    queryFn: () => api.get(`/solicitudes${centroFilter}`).then(r => r.data['hydra:member'] || r.data),
  });

  const { data: historiales = [], refetch: refetchHistoriales, isLoading: loadHis } = useQuery({
    queryKey: ['historiales', user?.centro_id, queryCentro],
    queryFn: () => api.get(`/historials${centroFilter}`).then(r => r.data['hydra:member'] || r.data),
  });

  const { data: equipos = [] } = useQuery({
    queryKey: ['equipos_list', user?.centro_id, queryCentro],
    queryFn: () => {
      const params = new URLSearchParams({ pagination: 'false' });
      if (!user?.centro_id && queryCentro) params.set('centro', queryCentro);
      else if (user?.centro_id) params.set('centro', user.centro_id.toString());
      return api.get(`/equipos?${params.toString()}`).then(r => r.data['hydra:member'] || r.data);
    },
  });

  const { data: repuestosDisponibles = [], refetch: refetchRepuestos } = useQuery({
    queryKey: ['repuestos_disponibles', user?.centro_id, queryCentro],
    queryFn: () => api.get(`/repuesto_inventarios${centroFilter}`).then(r => r.data['hydra:member'] || r.data)
  });

  useEffect(() => {
    api.get('/estado_equipos').then(r => setEstados(r.data['hydra:member'] || r.data)).catch(console.error);
    const seccionFilterParams = user?.centro_id ? `?centro=${user.centro_id}` : (queryCentro ? `?centro=${queryCentro}` : '');
    api.get(`/seccions${seccionFilterParams}`).then(r => setSecciones(r.data['hydra:member'] || r.data || [])).catch(console.error);
  }, [user?.centro_id, queryCentro]);

  // Limpiar ticket seleccionado al cambiar de centro (para el superusuario)
  useEffect(() => {
    setSelectedSolicitud(null);
  }, [queryCentro]);

  const getSeccionId = (seccion: any) => {
    if (!seccion) return null;
    if (typeof seccion === 'string') return seccion.split('/').pop();
    if (seccion['@id']) return seccion['@id'].split('/').pop();
    return seccion.id;
  };

  const equiposFiltrados = filtroSeccion
    ? equipos.filter((eq:any) => {
        const secId = getSeccionId(eq.seccion);
        return secId?.toString() === filtroSeccion?.toString();
      })
    : equipos;

  const handlePrintDiagnostico = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const eq = resolvedEquipo || selectedSolicitud?.equipo;
    const vidaUtilPct = eq?.porcentajeVidaUtilConsumido;
    printWindow.document.write(`
      <html><head><title>Diagnóstico TKT-${selectedSolicitud?.id?.toString().padStart(4,'0')}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1e293b; }
        h1 { font-size: 20px; border-bottom: 2px solid #0d47a1; padding-bottom: 8px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 16px 0; }
        .info-grid dt { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .info-grid dd { margin: 0 0 8px 0; font-size: 14px; }
        .section { margin: 20px 0; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .section h2 { font-size: 14px; color: #475569; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f1f5f9; padding: 6px 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
        td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }
        .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @media print { body { padding: 15px; } }
      </style></head><body>
      <h1>Informe de Diagnóstico Técnico</h1>
      <p style="color:#64748b;font-size:13px;">Ticket: TKT-${selectedSolicitud?.id?.toString().padStart(4,'0')} &bull; Estado: ${selectedSolicitud?.estadoSolicitud} &bull; Generado: ${new Date().toLocaleDateString()}</p>
      <div class="info-grid">
        <dt>Equipo</dt><dd>${eq?.nombre || '-'}</dd>
        <dt>Código Inventario</dt><dd>${eq?.codigoInventario || '-'}</dd>
        <dt>Marca / Modelo</dt><dd>${eq?.marca || ''} ${eq?.modelo || ''}</dd>
        <dt>Nº Serie</dt><dd>${eq?.numeroSerie || '-'}</dd>
        <dt>Sección</dt><dd>${eq?.seccion?.nombre || '-'}</dd>
        <dt>Estado Actual</dt><dd>${eq?.estado?.nombre || '-'}</dd>
        <dt>Vida Útil Consumida</dt><dd>${vidaUtilPct !== null && vidaUtilPct !== undefined ? vidaUtilPct + '%' : 'No calculable'}</dd>
        <dt>Solicitante</dt><dd>${selectedSolicitud?.solicitante?.nombre || selectedSolicitud?.solicitante?.email || 'Sistema'}</dd>
      </div>
      <div class="section">
        <h2>Problema Reportado</h2>
        <p>${selectedSolicitud?.descripcionFalla || 'Sin descripción'}</p>
      </div>
      <div class="section">
        <h2>Historial de Mantenimientos de este Equipo</h2>
        ${historialDelEquipo.length === 0 ? '<p style="color:#94a3b8;font-style:italic;">Sin registros previos.</p>' : 
          `<table><thead><tr><th>Fecha</th><th>Acción Realizada</th><th>Técnico</th><th>Costo (Bs)</th></tr></thead><tbody>${
            historialDelEquipo.map((h:any) => `<tr><td>${h.fechaMantenimiento ? new Date(h.fechaMantenimiento).toLocaleDateString() : '-'}</td><td>${h.accionRealizada}</td><td>${h.tecnico?.nombre||'-'}</td><td>${h.costo||'0.00'}</td></tr>`).join('')
          }</tbody></table>`
        }
      </div>
      <div class="footer">SisEquipos &mdash; Caja Petrolera de Salud &mdash; Impreso el ${new Date().toLocaleString()}</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const pendingSolicitudes = [...solicitudes]
    .filter((s: any) => s.estadoSolicitud === 'Pendiente')
    .sort((a: any, b: any) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());

  const enProceso = [...solicitudes]
    .filter((s: any) => s.estadoSolicitud === 'En Proceso')
    .sort((a: any, b: any) => {
      const dateA = new Date(a.fechaSolicitud || 0).getTime();
      const dateB = new Date(b.fechaSolicitud || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return b.id - a.id; // Más reciente primero cuando fechas son iguales
    });

  const handleValidar = async (solicitudId: number, nuevoEstado: string) => {
    try {
      await api.patch(`/solicitudes/${solicitudId}`, 
        { estadoSolicitud: nuevoEstado },
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
      const result = await refetchSolicitudes();
      // After refetch, find the refreshed ticket and keep it selected
      const refreshed = (result?.data as any[])?.find?.((s: any) => s.id === solicitudId)
        || { ...selectedSolicitud, estadoSolicitud: nuevoEstado };
      setSelectedSolicitud(refreshed);
      if (nuevoEstado === 'En Proceso') setActiveTab('en_proceso');
    } catch {
      alert('Error actualizando la solicitud');
    }
  };

  const getEquipoIri = (equipo: any) => {
    if (typeof equipo === 'string') return equipo;
    if (equipo?.['@id']) return equipo['@id'];
    return `/api/equipos/${equipo?.id}`;
  };
  const getEquipoIdStr = (equipo: any) => {
    if (typeof equipo === 'string') return equipo.split('/').pop();
    if (equipo?.['@id']) return equipo['@id'].split('/').pop();
    return equipo?.id;
  };

  const openRegistrarTrabajo = (solicitud: any) => {
    setSelectedSolicitud(solicitud);
    setFormData({ accionRealizada: '', costo: '', estadoEquipoResultante: '' });
    setSelectedRepuestos([]);
    setEvidenciaFotos([]);
    refetchRepuestos(); // Refresh stock before showing the modal
    setIsRegistrarModalOpen(true);
  };

  const handleConcluirMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSolicitud) return;

    const equipoIri = getEquipoIri(selectedSolicitud.equipo);
    const equipoId = getEquipoIdStr(selectedSolicitud.equipo);

    if (!equipoId) {
      alert("Error crítico: ID del equipo no encontrado. Cancela el cierre.");
      return;
    }

    setSaving(true);
    try {
      // ── Prevenir duplicados: reusar historial si ya existe para esta solicitud ──
      const existingCheck = await api.get(`/historials?solicitud=/api/solicitudes/${selectedSolicitud.id}`)
        .catch(() => ({ data: { 'hydra:member': [] } }));
      const existingList = existingCheck.data['hydra:member'] || existingCheck.data || [];

      let isNewHistorial = false;
      let historialId: number;
      if (existingList.length > 0) {
        historialId = existingList[0].id;
        await api.patch(`/historials/${historialId}`,
          {
            accionRealizada: formData.accionRealizada,
            costo: formData.costo || '0',
            estadoEquipoResultante: `/api/estado_equipos/${formData.estadoEquipoResultante}`,
            fechaMantenimiento: new Date().toISOString(),
          },
          { headers: { 'Content-Type': 'application/merge-patch+json' } }
        );
        // Borrar evidencias anteriores de este historial para no duplicar al reintentar
        const oldEvidencias = await api.get(`/evidencia_mantenimientos?historial=/api/historials/${historialId}`)
          .then(r => r.data['hydra:member'] || []).catch(() => []);
        for (const ev of oldEvidencias) {
          await api.delete(`/evidencia_mantenimientos/${ev.id}`).catch(() => {});
        }
      } else {
        isNewHistorial = true;
        const historialRes = await api.post('/historials', {
          equipo: equipoIri,
          solicitud: `/api/solicitudes/${selectedSolicitud.id}`,
          tecnico: `/api/usuarios/${user.id}`,
          accionRealizada: formData.accionRealizada,
          costo: formData.costo || '0',
          fechaMantenimiento: new Date().toISOString(),
          estadoEquipoResultante: `/api/estado_equipos/${formData.estadoEquipoResultante}`
        });
        historialId = historialRes.data.id;
      }

      // Procesar repuestos: en historial nuevo SIEMPRE procesar.
      // En historial reutilizado (reintento del mismo ticket), verificar si ya tienes
      // reemplazos registrados para evitar doble descuento.
      let yaHayReemplazos = false;
      if (!isNewHistorial) {
        const reemplazosExistentes = await api.get(`/reemplazo_componentes?historialMantenimiento=/api/historials/${historialId}`)
          .then(r => (r.data['hydra:member'] || r.data || []))
          .catch(() => []);
        yaHayReemplazos = reemplazosExistentes.length > 0;
      }

      if (isNewHistorial || !yaHayReemplazos) {
        for (const repuesto of selectedRepuestos) {
          // Obtener stock actualizado directamente de la API para evitar usar cache desactualizado
          const repuestoFresh = await api.get(`/repuesto_inventarios/${repuesto.repuestoId}`)
            .then(r => r.data).catch(() => null);
          if (repuestoFresh && repuestoFresh.cantidad >= repuesto.cantidad) {
            const nuevaCantidad = repuestoFresh.cantidad - repuesto.cantidad;
            const nuevoEstado = nuevaCantidad <= 0 ? 'Agotado' : 'Disponible';
            await api.patch(`/repuesto_inventarios/${repuestoFresh.id}`,
              { cantidad: nuevaCantidad, estado: nuevoEstado },
              { headers: { 'Content-Type': 'application/merge-patch+json' } }
            );
          } else if (repuestoFresh && repuestoFresh.cantidad < repuesto.cantidad) {
            alert(`Stock insuficiente para "${repuestoFresh.nombre}": disponible ${repuestoFresh.cantidad}, solicitado ${repuesto.cantidad}`);
            setSaving(false);
            return;
          }
          for (let i = 0; i < repuesto.cantidad; i++) {
            await api.post('/reemplazo_componentes', {
              historialMantenimiento: `/api/historials/${historialId}`,
              repuestoUtilizado: `/api/repuesto_inventarios/${repuesto.repuestoId}`,
              motivoCambio: repuesto.motivo
            });
          }
        }
      }

      // 3. Subir evidencias fotográficas (siempre reemplaza las anteriores)
      for (const foto of evidenciaFotos) {
        await api.post('/evidencia_mantenimientos', {
          historial: `/api/historials/${historialId}`,
          tipo: foto.tipo,
          imagenBase64: foto.base64,
          descripcion: foto.nombre,
        });
      }

      await api.patch(`/equipos/${equipoId}`, 
        { estado: `/api/estado_equipos/${formData.estadoEquipoResultante}` },
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
      
      await api.patch(`/solicitudes/${selectedSolicitud.id}`, 
        { estadoSolicitud: 'Finalizado', fechaResolucion: new Date().toISOString() },
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );

      setIsRegistrarModalOpen(false);
      setSelectedSolicitud(null);
      setEvidenciaFotos([]);
      refetchSolicitudes();
      refetchHistoriales();
      refetchRepuestos();
    } catch (error: any) {
      const msg = error?.response?.data?.['hydra:description'] || error?.response?.data?.detail || error?.message || 'Error desconocido';
      console.error('Error al registrar trabajo:', error?.response?.data || error);
      alert(`Hubo un error registrando el trabajo: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleProcesarNuevaSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Registrar "Ticket / Solicitud"
      await api.post('/solicitudes', {
        equipo: `/api/equipos/${solicitudForm.equipo}`,
        solicitante: `/api/usuarios/${user.id}`,
        descripcionFalla: solicitudForm.descripcionFalla,
        prioridad: solicitudForm.prioridad,
        fechaSolicitud: `${solicitudForm.fechaSolicitud}T00:00:00`,
        estadoSolicitud: 'Pendiente'
      });

      setIsSolicitudModalOpen(false);
      setSolicitudForm({ equipo: '', descripcionFalla: '', prioridad: 'Media', fechaSolicitud: new Date().toISOString().slice(0,10) });
      
      refetchSolicitudes();
      setActiveTab('pendientes');
      
    } catch (error: any) {
      const msg = error?.response?.data?.['hydra:description'] || error?.response?.data?.detail || error?.message || 'Error desconocido';
      console.error('Error al levantar solicitud:', error?.response?.data || error);
      alert(`Error al levantar el ticket: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const resolverEquipo = (solicitud: any) => {
    if (!solicitud?.equipo) return null;
    if (typeof solicitud.equipo === 'object') return solicitud.equipo;
    const eqId = solicitud.equipo.split('/').pop();
    return equipos.find((e: any) => e.id?.toString() === eqId) || null;
  };

  const resolverSolicitante = (solicitud: any) => {
    if (!solicitud?.solicitante) return null;
    if (typeof solicitud.solicitante === 'object') return solicitud.solicitante;
    return null;
  };

  // Resolve equipment: first from local list, then fetch directly if not found
  useEffect(() => {
    if (!selectedSolicitud) { setResolvedEquipo(null); setComponentesEquipo([]); return; }

    const fetchComponentes = (equipoId: any) => {
      setLoadingComponentes(true);
      api.get(`/componente_equipos?equipo=/api/equipos/${equipoId}`)
        .then(r => setComponentesEquipo(r.data['hydra:member'] || r.data || []))
        .catch(() => setComponentesEquipo([]))
        .finally(() => setLoadingComponentes(false));
    };

    // 1. Try from preloaded list first (fast path)
    const eq = resolverEquipo(selectedSolicitud);
    if (eq) {
      setResolvedEquipo(eq);
      fetchComponentes(eq.id);
      return;
    }

    // 2. Fallback: fetch equipment directly from API
    const equipoId = getEquipoIdStr(selectedSolicitud.equipo);
    if (!equipoId) {
      setResolvedEquipo(null);
      setComponentesEquipo([]);
      return;
    }

    api.get(`/equipos/${equipoId}`)
      .then(r => {
        setResolvedEquipo(r.data);   // Set equipment regardless of componentes
        fetchComponentes(r.data.id); // Fetch componentes independently
      })
      .catch(err => {
        console.warn('No se pudo cargar el equipo del ticket:', err);
        setResolvedEquipo(null);
        setComponentesEquipo([]);
      });
  }, [selectedSolicitud?.id, equipos.length]);

  const equipoIdSeleccionado = selectedSolicitud ? getEquipoIdStr(selectedSolicitud.equipo) : null;
  const historialDelEquipo = historiales.filter((h: any) => {
    const hEqId = getEquipoIdStr(h.equipo);
    return hEqId && equipoIdSeleccionado && hEqId == equipoIdSeleccionado;
  });

  return (
    <div className="fade-in pb-12">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Tool className="text-brand-600" size={32} /> Mesa de Ayuda y Mantenimiento
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Gestión y solicitud de tickets por fallo técnico de equipos.</p>
          {user?.centro_nombre && (
            <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full">
              Centro: {user.centro_nombre}
            </span>
          )}
          {!user?.centro_id && queryCentro && (() => {
            const nombreCentro = secciones.find((s: any) => s.centro?.id?.toString() === queryCentro)?.centro?.nombre;
            return nombreCentro ? (
              <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                Centro: {nombreCentro}
              </span>
            ) : null;
          })()}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsSolicitudModalOpen(true)} className="bg-brand-600 border border-brand-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all hover:bg-brand-700">
            <Plus size={20} /> Nueva Solicitud
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Columna Izquierda: Lista de Tickets */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => { setActiveTab('pendientes'); setSelectedSolicitud(null); }}
              className={`flex-1 py-2 font-bold text-xs rounded-lg transition-colors ${activeTab === 'pendientes' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Pendientes ({pendingSolicitudes.length})
            </button>
            <button
              onClick={() => { setActiveTab('en_proceso'); setSelectedSolicitud(null); }}
              className={`flex-1 py-2 font-bold text-xs rounded-lg transition-colors ${activeTab === 'en_proceso' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              En Proceso ({enProceso.length})
            </button>
            <button
              onClick={() => { setActiveTab('historial'); setSelectedSolicitud(null); }}
              className={`flex-1 py-2 font-bold text-xs rounded-lg transition-colors ${activeTab === 'historial' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Cerradas
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-[600px] overflow-y-auto">
            {activeTab === 'pendientes' && (
              <>
                {loadSol
                  ? <div className="p-8 text-center text-slate-400">Cargando tickets...</div>
                  : pendingSolicitudes.length === 0
                    ? <div className="p-8 text-center text-slate-400 italic">No hay solicitudes pendientes.</div>
                    : null
                }
                {pendingSolicitudes.map((s: any) => {
                  const fecha = s.fechaSolicitud || s.createdAt || s.fechaCreacion;
                  return (
                    <div key={s.id} onClick={() => setSelectedSolicitud(s)} className={`p-4 border-b border-slate-100 cursor-pointer transition-colors border-l-4 ${selectedSolicitud?.id === s.id ? 'bg-brand-50 border-l-brand-600' : 'hover:bg-slate-50 border-l-transparent'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-400">TKT-{s.id.toString().padStart(4, '0')}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-amber-100 text-amber-700">{s.prioridad}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm mb-1">{s.equipo?.nombre || `Equipo #${s.id}`}</h3>
                      <p className="text-slate-500 text-xs line-clamp-2">{s.descripcionFalla || 'Sin descripción'}</p>
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={11}/>
                        <span>{fecha ? new Date(fecha).toLocaleDateString('es-BO') : `TKT #${s.id}`}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === 'en_proceso' && (
              <>
                {loadSol
                  ? <div className="p-8 text-center text-slate-400">Cargando...</div>
                  : enProceso.length === 0
                    ? <div className="p-8 text-center text-slate-400 italic">No hay tickets en proceso.</div>
                    : null
                }
                {enProceso.map((s: any) => {
                  const fecha = s.fechaSolicitud || s.createdAt || s.fechaCreacion;
                  return (
                    <div key={s.id} onClick={() => setSelectedSolicitud(s)} className={`p-4 border-b border-slate-100 cursor-pointer transition-colors border-l-4 ${selectedSolicitud?.id === s.id ? 'bg-blue-50 border-l-blue-500' : 'hover:bg-blue-50/40 border-l-blue-200'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-400">TKT-{s.id.toString().padStart(4, '0')}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-700">En Proceso</span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm mb-1">{s.equipo?.nombre || `Equipo #${s.id}`}</h3>
                      <p className="text-slate-500 text-xs line-clamp-2">{s.descripcionFalla || 'Sin descripción'}</p>
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={11}/>
                        <span>{fecha ? new Date(fecha).toLocaleDateString('es-BO') : `TKT #${s.id}`}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {activeTab === 'historial' && (
              <>
                {loadHis
                  ? <div className="p-8 text-center text-slate-400">Cargando historial...</div>
                  : historiales.length === 0
                    ? <div className="p-8 text-center text-slate-400 italic">No hay registros históricos.</div>
                    : null
                }
                {[...historiales].sort((a,b) => new Date(b.fechaMantenimiento).getTime() - new Date(a.fechaMantenimiento).getTime()).map((h: any) => (
                  <div key={h.id} className="p-4 border-b border-slate-100 transition-colors hover:bg-slate-50 border-l-4 border-l-transparent">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-400">{h.fechaMantenimiento ? new Date(h.fechaMantenimiento).toLocaleDateString('es-BO') : 'Sin Fecha'}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${h.solicitud ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                        {h.solicitud ? 'Resolución TKT' : 'Directo'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{h.equipo?.nombre}</h3>
                    <p className="text-emerald-700 font-bold mb-1 text-xs">Acción: <span className="text-slate-600 font-normal line-clamp-2">{h.accionRealizada}</span></p>
                    <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-2">
                      <button type="button" onClick={() => setDetalleHistorial(h)} className="text-brand-600 hover:text-brand-800 text-xs font-bold flex items-center gap-1"><Eye size={14}/> Ver Detalle</button>
                      <span className="text-brand-600 font-bold text-xs">Bs. {h.costo}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Columna Derecha: Detalle y Validación (Oculto en Pestaña Historial si no seleccionan) */}
        <div className="w-full lg:w-2/3">
          {selectedSolicitud ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col fade-in">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Diagnóstico: {resolvedEquipo?.nombre || `TKT-${selectedSolicitud.id?.toString().padStart(4,'0')}`}</h2>
                  <p className="text-sm text-slate-500 mb-1">
                    Ticket {selectedSolicitud.id ? `TKT-${selectedSolicitud.id.toString().padStart(4, '0')}` : 'Sin ID'} &nbsp;
                    {(() => {
                      const sol = resolverSolicitante(selectedSolicitud);
                      const nombre = sol?.nombre || sol?.email || (typeof selectedSolicitud.solicitante === 'string' ? '' : null);
                      return <span>Solicitante: <strong>{nombre || 'Sistema (Automático)'}</strong></span>;
                    })()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrintDiagnostico} className="text-slate-500 hover:text-brand-700 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"><Printer size={14}/> Imprimir</button>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${
                    selectedSolicitud.estadoSolicitud === 'Pendiente' ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                    selectedSolicitud.estadoSolicitud === 'Finalizado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    'bg-blue-50 text-blue-600 border-blue-200'
                  }`}>{selectedSolicitud.estadoSolicitud}</span>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-6">
                {resolvedEquipo && (() => {
                  const eq = resolvedEquipo;
                  return (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                      <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3 flex items-center gap-2"><Info size={14}/> Ficha Técnica del Equipo</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div><span className="text-slate-400 font-semibold block">Código</span><span className="text-slate-700 font-bold">{eq.codigoInventario || '-'}</span></div>
                        <div><span className="text-slate-400 font-semibold block">Marca</span><span className="text-slate-700">{eq.marca || '-'}</span></div>
                        <div><span className="text-slate-400 font-semibold block">Modelo</span><span className="text-slate-700">{eq.modelo || '-'}</span></div>
                        <div><span className="text-slate-400 font-semibold block">Nº Serie</span><span className="text-slate-700">{eq.numeroSerie || '-'}</span></div>
                        <div><span className="text-slate-400 font-semibold block">Sección</span><span className="text-slate-700">{eq.seccion?.nombre || '-'}</span></div>
                        <div><span className="text-slate-400 font-semibold block">Estado</span><span className="text-slate-700">{eq.estado?.nombre || '-'}</span></div>
                      <div className="col-span-2">
                        <span className="text-slate-400 font-semibold block">Vida Útil Consumida</span>
                        {eq.porcentajeVidaUtilConsumido !== null && eq.porcentajeVidaUtilConsumido !== undefined ? (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full ${eq.obsoleto ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(eq.porcentajeVidaUtilConsumido, 100)}%` }} />
                            </div>
                            <span className={`text-xs font-bold ${eq.obsoleto ? 'text-red-600' : 'text-slate-600'}`}>{eq.porcentajeVidaUtilConsumido}%</span>
                          </div>
                        ) : <span className="text-slate-400 italic">No calculable</span>}
                      </div>
                    </div>

                    {/* Componentes instalados */}
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Cpu size={12}/> Componentes Instalados</p>
                      {loadingComponentes ? (
                        <p className="text-xs text-slate-400 italic">Cargando componentes...</p>
                      ) : componentesEquipo.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No hay componentes registrados para este equipo.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {componentesEquipo.map((c: any) => (
                            <span key={c.id} className="text-[11px] bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg font-medium shadow-sm">
                              {c.tipoComponente?.nombre || 'Pieza'}{c.descripcion ? ` — ${c.descripcion}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })()}

                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-yellow-500" /> Descripción del Problema Reportado
                  </h3>
                  <p className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200">
                    {selectedSolicitud.descripcionFalla || <span className="text-yellow-600/60 italic">Sin descripción proporcionada al levantar el ticket.</span>}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><FileText size={16} className="text-brand-500"/> Mantenimientos Previos de este Equipo</h3>
                  {loadHis ? <p className="text-xs text-slate-400 italic">Cargando...</p> : 
                   historialDelEquipo.length === 0 ? <p className="text-xs text-slate-400 italic">No hay registros de mantenimientos anteriores para este equipo.</p> :
                   (
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr><th className="px-4 py-2">Fecha</th><th className="px-4 py-2">Acción</th><th className="px-4 py-2">Técnico</th><th className="px-4 py-2">Costo (Bs)</th><th className="px-4 py-2 text-center">Detalle</th></tr>
                        </thead>
                        <tbody>
                          {historialDelEquipo.map((h:any) => (
                            <tr key={h.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                              <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{h.fechaMantenimiento ? new Date(h.fechaMantenimiento).toLocaleDateString() : '-'}</td>
                              <td className="px-4 py-2 text-slate-700 font-medium">{h.accionRealizada}</td>
                              <td className="px-4 py-2 text-slate-500">{h.tecnico?.nombre||'-'}</td>
                              <td className="px-4 py-2 text-brand-600 font-bold">{h.costo||'0.00'}</td>
                              <td className="px-4 py-2 text-center">
                                <button type="button" onClick={() => setDetalleHistorial(h)} className="text-brand-600 hover:text-brand-800 text-xs font-bold flex items-center gap-1 mx-auto"><Eye size={14}/> Ver</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                {!user?.centro_id ? (
                  <button 
                    onClick={() => setDeleteModalState({ isOpen: true, type: 'solicitud', id: selectedSolicitud.id, isLoading: false })}
                    className="text-red-500 hover:text-red-700 font-bold text-sm px-4 py-2 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2"
                  >
                    <Trash2 size={16}/> Eliminar Ticket
                  </button>
                ) : <div></div>}
                <div className="flex gap-3">
                  {selectedSolicitud.estadoSolicitud === 'Pendiente' && (
                    <button onClick={() => handleValidar(selectedSolicitud.id, 'En Proceso')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm">
                      Validar y Pasar a "En Proceso"
                    </button>
                  )}
                  {selectedSolicitud.estadoSolicitud === 'En Proceso' && (
                    <button onClick={() => openRegistrarTrabajo(selectedSolicitud)} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm">
                      <CheckCircle size={18} /> Concluir y Registrar Mantenimiento
                    </button>
                  )}
                  {selectedSolicitud.estadoSolicitud === 'Finalizado' && (
                    <p className="text-emerald-600 font-bold flex items-center gap-2 px-4 py-2"><CheckCircle size={18}/> Mantenimiento Concluido</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl h-[600px] flex flex-col items-center justify-center text-slate-400">
              <Tool size={48} className="mb-4 opacity-30" />
              <p className="font-medium">Selecciona un ticket pendiente para ver detalles</p>
            </div>
          )}
        </div>
      </div>


      {/* MODAL 1: Cierre de Mantenimiento (Ticket Activo) */}
      {isRegistrarModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden fade-in" onSubmit={handleConcluirMantenimiento}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-800">Cierre de Mantenimiento</h2>
              <button type="button" onClick={() => setIsRegistrarModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm p-1 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 text-sm font-medium mb-4">
                Estás cerrando el ticket del equipo "{selectedSolicitud?.equipo?.nombre}".
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Acción Realizada / Solución</label>
                <textarea required rows={3} value={formData.accionRealizada} onChange={e=>setFormData({...formData, accionRealizada: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800 resize-none" placeholder="Ej. Cambio de fuente de poder, limpieza profunda..." />
              </div>

              {/* Repuestos Selector */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-slate-700">Repuestos Utilizados</label>
                  <button type="button" onClick={() => setSelectedRepuestos([...selectedRepuestos, { repuestoId: '', cantidad: 1, motivo: '' }])} className="text-brand-600 bg-brand-50 hover:bg-brand-100 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                    <Plus size={14}/> Añadir Pieza
                  </button>
                </div>
                
                {selectedRepuestos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No se reemplazaron partes en este mantenimiento.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedRepuestos.map((sr, index) => (
                      <div key={index} className="flex gap-2 items-start bg-white p-2 rounded-lg border border-slate-200">
                        <div className="flex-1 space-y-2">
                          <select required value={sr.repuestoId} onChange={(e) => {
                            const newR = [...selectedRepuestos]; newR[index].repuestoId = e.target.value; setSelectedRepuestos(newR);
                          }} className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-brand-500">
                            <option value="">Seleccionar repuesto de bodega...</option>
                            {repuestosDisponibles.filter((r:any) => r.cantidad > 0 && r.estado !== 'Agotado').map((r:any) => (
                              <option key={r.id} value={r.id}>{r.nombre} (Stock: {r.cantidad})</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <input type="number" min="1" required value={sr.cantidad} onChange={(e) => {
                              const newR = [...selectedRepuestos]; newR[index].cantidad = parseInt(e.target.value)||1; setSelectedRepuestos(newR);
                            }} className="w-20 px-2 py-1.5 border border-slate-200 rounded-md text-xs outline-none" placeholder="Cant." />
                            <input type="text" value={sr.motivo} onChange={(e) => {
                              const newR = [...selectedRepuestos]; newR[index].motivo = e.target.value; setSelectedRepuestos(newR);
                            }} className="flex-1 px-2 py-1.5 border border-slate-200 rounded-md text-xs outline-none" placeholder="Lugar o motivo del reemplazo (e.g., Quemado)" />
                          </div>
                        </div>
                        <button type="button" onClick={() => setSelectedRepuestos(selectedRepuestos.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-md"><X size={16}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Evidencia Fotográfica - ACTIVA */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Camera size={16} className="text-brand-600" />
                    Evidencia Fotográfica
                  </p>
                  <div className="flex gap-2">
                    <label className="cursor-pointer bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-600 hover:text-amber-700 px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all">
                      <Camera size={13} /> Antes
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          setEvidenciaFotos(prev => [...prev, { tipo: 'antes', base64: reader.result as string, nombre: file.name }]);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }} />
                    </label>
                    <label className="cursor-pointer bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all">
                      <Camera size={13} /> Después
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          setEvidenciaFotos(prev => [...prev, { tipo: 'despues', base64: reader.result as string, nombre: file.name }]);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }} />
                    </label>
                  </div>
                </div>

                {evidenciaFotos.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-3">Añade fotos del componente viejo (Antes) y el nuevo (Después) como evidencia del trabajo.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {evidenciaFotos.map((foto, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border-2 border-slate-200">
                        <img src={foto.base64} alt={foto.tipo} className="w-full h-28 object-cover" />
                        <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          foto.tipo === 'antes' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                          {foto.tipo === 'antes' ? '⚠ Antes' : '✓ Después'}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEvidenciaFotos(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Costo de Reparación (Bs)</label>
                  <input required type="number" step="0.01" min="0" value={formData.costo} onChange={e=>setFormData({...formData, costo: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nuevo Estado del Equipo</label>
                  <select required value={formData.estadoEquipoResultante} onChange={e=>setFormData({...formData, estadoEquipoResultante: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800">
                    <option value="">Seleccionar</option>
                    {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button type="button" onClick={() => setIsRegistrarModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className={`bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 ${saving ? 'opacity-70' : 'hover:bg-brand-700'}`}>
                  {saving ? 'Procesando...' : <><CheckCircle size={18}/> Finalizar Ticket</>}
                </button>
            </div>
          </form>
        </div>
      )}


      {/* MODAL 2: Nueva Solicitud (Ticket de falla) */}
      {isSolicitudModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden fade-in" onSubmit={handleProcesarNuevaSolicitud}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-brand-50">
              <h2 className="text-lg font-bold text-brand-800">Nueva Solicitud de Mantenimiento</h2>
              <button type="button" onClick={() => setIsSolicitudModalOpen(false)} className="text-brand-400 hover:text-brand-700 bg-white shadow-sm p-1 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Filtrar por Sección</label>
                <select value={filtroSeccion} onChange={e=>{setFiltroSeccion(e.target.value); setSolicitudForm({...solicitudForm, equipo: ''});}} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800">
                  <option value="">Todas las Secciones</option>
                  {
                    !user?.centro_id ? (
                      Object.entries(secciones.reduce((acc: any, s: any) => {
                        const cName = s.centro?.nombre || 'General';
                        if (!acc[cName]) acc[cName] = [];
                        acc[cName].push(s);
                        return acc;
                      }, {})).map(([cName, secs]) => (
                        <optgroup key={cName} label={`[ ${cName} ]`}>
                          {(secs as any[]).map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </optgroup>
                      ))
                    ) : (
                      secciones.map((s:any) => <option key={s.id} value={s.id}>{s.nombre}</option>)
                    )
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Equipo Averiado *</label>
                <select required value={solicitudForm.equipo} onChange={e=>setSolicitudForm({...solicitudForm, equipo: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800">
                  <option value="">-- Seleccionar Equipo --</option>
                  {equiposFiltrados?.map((eq:any) => <option key={eq.id} value={eq.id}>{eq.nombre}{eq.codigoInventario ? ` [${eq.codigoInventario}]` : ''} — {eq.seccion?.nombre || ''}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción de la falla (Síntoma) *</label>
                <textarea required rows={4} value={solicitudForm.descripcionFalla} onChange={e=>setSolicitudForm({...solicitudForm, descripcionFalla: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800 resize-none" placeholder="El equipo no enciende a pesar de estar conectado, hace un ruido extraño..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha de Solicitud *</label>
                  <input required type="date" value={solicitudForm.fechaSolicitud} onChange={e=>setSolicitudForm({...solicitudForm, fechaSolicitud: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nivel de Prioridad *</label>
                  <select required value={solicitudForm.prioridad} onChange={e=>setSolicitudForm({...solicitudForm, prioridad: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800">
                    <option value="Baja">Baja (Mantenimiento Rutina)</option>
                    <option value="Media">Media (Fallo Parcial)</option>
                    <option value="Alta">Alta (Inoperativo)</option>
                    <option value="Crítica">Crítica (Riesgo Inminente)</option>
                  </select>
                </div>
              </div>

            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button type="button" onClick={() => setIsSolicitudModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className={`bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 ${saving ? 'opacity-70' : 'hover:bg-brand-700'}`}>
                  {saving ? 'Procesando...' : <><AlertTriangle size={18}/> Levantar Solicitud</>}
                </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Detalle de Historial */}
      {detalleHistorial && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-brand-50">
              <h2 className="text-lg font-bold text-brand-800 flex items-center gap-2"><FileText size={20}/> Detalle de Mantenimiento</h2>
              <button onClick={() => setDetalleHistorial(null)} className="text-brand-400 hover:text-brand-700 bg-white shadow-sm p-1 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Equipo</span><span className="text-slate-800 font-bold">{detalleHistorial.equipo?.nombre || '-'}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Fecha</span><span className="text-slate-800">{detalleHistorial.fechaMantenimiento ? new Date(detalleHistorial.fechaMantenimiento).toLocaleDateString() : '-'}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Técnico</span><span className="text-slate-800">{detalleHistorial.tecnico?.nombre || detalleHistorial.tecnico?.email || '-'}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Costo</span><span className="text-brand-600 font-bold">Bs. {detalleHistorial.costo || '0.00'}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Estado Resultante</span><span className="text-slate-800">{detalleHistorial.estadoEquipoResultante?.nombre || '-'}</span></div>
                {detalleHistorial.solicitud && <div><span className="text-slate-400 font-semibold block text-xs uppercase">Ticket</span><span className="text-slate-800">TKT-{detalleHistorial.solicitud?.id?.toString().padStart(4,'0')}</span></div>}
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-xs uppercase mb-1">Acción Realizada</span>
                <p className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-sm">{detalleHistorial.accionRealizada}</p>
              </div>
              {/* Evidencia fotográfica del historial */}
              <EvidenciasHistorial historialId={detalleHistorial.id} />
            </div>
            <div className="flex justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
              {!user?.centro_id ? (
                <button onClick={() => setDeleteModalState({ isOpen: true, type: 'historial', id: detalleHistorial.id, isLoading: false })} className="text-red-500 hover:text-red-700 font-bold px-4 py-2 hover:bg-red-50 rounded-xl flex items-center gap-2 text-sm"><Trash2 size={16}/> Eliminar Registro</button>
              ) : <div></div>}
              <button onClick={() => setDetalleHistorial(null)} className="px-5 py-2 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal 
        isOpen={deleteModalState.isOpen}
        title={`Eliminar ${deleteModalState.type === 'solicitud' ? 'Ticket' : 'Registro'}`}
        message={`¿Estás seguro de que deseas eliminar este ${deleteModalState.type === 'solicitud' ? 'ticket' : 'registro histórico'} permanentemente? Esta acción NO se puede deshacer.`}
        isDeleting={deleteModalState.isLoading}
        onCancel={() => setDeleteModalState(prev => ({...prev, isOpen: false}))}
        onConfirm={async () => {
          setDeleteModalState(prev => ({...prev, isLoading: true}));
          try {
            if (deleteModalState.type === 'solicitud') {
              await api.delete(`/solicitudes/${deleteModalState.id}`);
              setSelectedSolicitud(null);
              refetchSolicitudes();
            } else {
              await api.delete(`/historials/${deleteModalState.id}`);
              setDetalleHistorial(null);
              refetchHistoriales();
            }
            setDeleteModalState(prev => ({...prev, isOpen: false, isLoading: false}));
          } catch {
            alert("Error al intentar eliminar el registro.");
            setDeleteModalState(prev => ({...prev, isLoading: false}));
          }
        }}
      />

    </div>
  );
};
