import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getUserInfo } from '../services/auth';
import { Wrench as Tool, Plus, CheckCircle, AlertTriangle, X, Clock, FileText, Camera, Printer, Eye, Info, Cpu, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const queryCentro = searchParams.get('centro');
  
  let centroFilter = '';
  if (!user?.centro_id && queryCentro) {
    centroFilter = `?equipo.centro=${queryCentro}`;
  } else if (user?.centro_id) {
    centroFilter = `?equipo.centro=${user.centro_id}`;
  }

  const [activeTab, setActiveTab] = useState<'pendientes' | 'en_proceso' | 'historial' | 'preventivo'>('pendientes');
  const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedHistorial, setSelectedHistorial] = useState<any>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ equipo: '', descripcionTareas: '', frecuencia: 'trimestral', intervaloDias: 90, fechaProximoMantenimiento: new Date(new Date().setDate(new Date().getDate() + 90)).toISOString().slice(0, 10), prioridad: 'Media', tecnicoAsignado: '' });
  
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
  
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, type: 'solicitud' | 'historial' | 'plan', id: number | null, isLoading: boolean}>({
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

  const { data: planesPreventivos = [], refetch: refetchPlanes, isLoading: loadPlanes } = useQuery({
    queryKey: ['planes_preventivos', user?.centro_id, queryCentro],
    queryFn: () => api.get(`/planes_preventivos${centroFilter}`).then(r => r.data['hydra:member'] || r.data),
  });

  const planesVencidos = planesPreventivos.filter((p: any) => p.isVencido && p.estado === 'Activo');
  const planesProximos = planesPreventivos.filter((p: any) => p.isProximoAVencer && !p.isVencido && p.estado === 'Activo');
  const planesActivos = planesPreventivos.filter((p: any) => !p.isVencido && !p.isProximoAVencer && p.estado === 'Activo');

  const { data: equipos = [], refetch: refetchEquipos } = useQuery({
    queryKey: ['equipos_list', user?.centro_id, queryCentro],
    staleTime: 0,
    queryFn: () => {
      const params = new URLSearchParams({ itemsPerPage: '1000', pagination: 'false' });
      if (!user?.centro_id && queryCentro) params.set('centro', queryCentro);
      else if (user?.centro_id) params.set('centro', user.centro_id.toString());
      return api.get(`/equipos?${params.toString()}`).then(r => r.data['hydra:member'] || r.data || []);
    },
  });

  // Equipos filtrados por sección (server-side cuando hay filtro seleccionado)
  const { data: equiposDeSección = null } = useQuery({
    queryKey: ['equipos_seccion', filtroSeccion, user?.centro_id, queryCentro],
    enabled: !!filtroSeccion,
    staleTime: 0,
    queryFn: () => {
      const params = new URLSearchParams({ itemsPerPage: '1000', pagination: 'false', seccion: filtroSeccion });
      if (!user?.centro_id && queryCentro) params.set('centro', queryCentro);
      else if (user?.centro_id) params.set('centro', user.centro_id.toString());
      return api.get(`/equipos?${params.toString()}`).then(r => r.data['hydra:member'] || r.data || []);
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
    setSelectedPlan(null);
    setSelectedHistorial(null);
  }, [queryCentro]);


  const estadosOrdenados = [...estados].sort((a, b) => a.nombre.localeCompare(b.nombre));

  const equiposFiltrados = filtroSeccion
    ? (equiposDeSección ?? [])
    : equipos;



  /* ── Imprimir informe completo del historial cerrado ── */
  const handlePrintDetalle = async (h: any) => {
    try {
      const response = await api.get(`/reportes/mantenimiento/${h.id}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe_mantenimiento_${h.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail
        || error.response?.data?.['hydra:description']
        || error.response?.data?.message
        || (error.response ? `Error ${error.response.status}` : error.message);
      alert(`Error al generar el informe: ${msg}`);
    }
  };

  const pendingSolicitudes = [...solicitudes]
    .filter((s: any) => s.estadoSolicitud === 'Pendiente')
    .sort((a: any, b: any) => b.id - a.id); // ID mayor = más reciente siempre primero

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

  const openRegistrarTrabajo = (solicitud: any, plan: any = null) => {
    setSelectedSolicitud(solicitud);
    setSelectedPlan(plan);
    setFormData({ accionRealizada: '', costo: '', estadoEquipoResultante: '' });
    setSelectedRepuestos([]);
    setEvidenciaFotos([]);
    refetchRepuestos(); // Refresh stock before showing the modal
    setIsRegistrarModalOpen(true);
  };

  const handleConcluirMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSolicitud && !selectedPlan) return;

    const equipoIri = getEquipoIri(selectedSolicitud ? selectedSolicitud.equipo : selectedPlan.equipo);
    const equipoId = getEquipoIdStr(selectedSolicitud ? selectedSolicitud.equipo : selectedPlan.equipo);

    if (!equipoId) {
      alert("Error crítico: ID del equipo no encontrado. Cancela el cierre.");
      return;
    }

    setSaving(true);
    try {
      // ── Prevenir duplicados: reusar historial si ya existe para esta solicitud ──
      const existingCheck = selectedSolicitud ? await api.get(`/historials?solicitud=/api/solicitudes/${selectedSolicitud.id}`).catch(() => ({ data: { 'hydra:member': [] } })) : { data: { 'hydra:member': [] } };
      const existingList = existingCheck.data['hydra:member'] || existingCheck.data || [];

      let isNewHistorial = false;
      let historialId: number;
      if (existingList.length > 0) {
        const totalCosto = selectedRepuestos.reduce((acc, sr) => {
          const r = repuestosDisponibles.find((rep: any) => rep.id?.toString() === sr.repuestoId);
          return acc + (parseFloat(r?.precio || '0') * sr.cantidad);
        }, 0).toFixed(2);

        historialId = existingList[0].id;
        await api.patch(`/historials/${historialId}`,
          {
            accionRealizada: formData.accionRealizada,
            costo: totalCosto,
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
        const totalCosto = selectedRepuestos.reduce((acc, sr) => {
          const r = repuestosDisponibles.find((rep: any) => rep.id?.toString() === sr.repuestoId);
          return acc + (parseFloat(r?.precio || '0') * sr.cantidad);
        }, 0).toFixed(2);

        isNewHistorial = true;
        const historialRes = await api.post('/historials', {
          equipo: equipoIri,
          solicitud: selectedSolicitud ? `/api/solicitudes/${selectedSolicitud.id}` : undefined,
          planPreventivo: selectedPlan ? `/api/planes_preventivos/${selectedPlan.id}` : undefined,
          tipo: selectedPlan ? 'Preventivo' : 'Correctivo',
          tecnico: `/api/usuarios/${user.id}`,
          accionRealizada: formData.accionRealizada,
          costo: totalCosto,
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
      
      if (selectedSolicitud) {
        await api.patch(`/solicitudes/${selectedSolicitud.id}`, 
          { estadoSolicitud: 'Finalizado', fechaResolucion: new Date().toISOString() },
          { headers: { 'Content-Type': 'application/merge-patch+json' } }
        );
      }
      if (selectedPlan) {
        const calcularProximaFecha = (_frecuencia: string, intervaloDias: number) => {
          const hoy = new Date();
          hoy.setDate(hoy.getDate() + (intervaloDias || 90));
          return hoy.toISOString().slice(0, 10) + 'T00:00:00Z';
        };
        await api.patch(`/planes_preventivos/${selectedPlan.id}`, {
          estado: 'Completado',
          fechaUltimoMantenimiento: new Date().toISOString().slice(0, 10) + 'T00:00:00Z',
          fechaProximoMantenimiento: calcularProximaFecha(selectedPlan.frecuencia, selectedPlan.intervaloDias),
        }, { headers: { 'Content-Type': 'application/merge-patch+json' } });
        refetchPlanes();
      }

      setIsRegistrarModalOpen(false);
      setSelectedSolicitud(null);
      setSelectedPlan(null);
      setEvidenciaFotos([]);
      refetchSolicitudes();
      refetchHistoriales();
      refetchRepuestos();
      // Invalidar la caché de Bodega para que actualice sin refrescar página
      queryClient.invalidateQueries({ queryKey: ['repuestos'] });
    } catch (error: any) {
      const msg = error?.response?.data?.['hydra:description'] || error?.response?.data?.detail || error?.message || 'Error desconocido';
      console.error('Error al registrar trabajo:', error?.response?.data || error);
      alert(`Hubo un error registrando el trabajo: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  
  const handleCrearPlanPreventivo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/planes_preventivos', {
        equipo: `/api/equipos/${planForm.equipo}`,
        descripcionTareas: planForm.descripcionTareas,
        frecuencia: planForm.frecuencia,
        intervaloDias: planForm.intervaloDias,
        fechaProximoMantenimiento: planForm.fechaProximoMantenimiento + 'T00:00:00Z',
        prioridad: planForm.prioridad,
        estado: 'Activo'
      });
      setIsPlanModalOpen(false);
      refetchPlanes();
      setActiveTab('preventivo');
    } catch (error: any) {
      alert('Error al crear plan preventivo');
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
        // Combinar la fecha elegida con la hora local actual → convertir a UTC ISO para evitar desfase de zona horaria
        fechaSolicitud: (() => {
          const now = new Date();
          const combined = new Date(`${solicitudForm.fechaSolicitud}T${now.toTimeString().slice(0, 8)}`);
          return combined.toISOString(); // envía en UTC → PHP devuelve con Z → JS muestra hora local correcta
        })(),
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
    const eqId = typeof solicitud.equipo === 'object' 
      ? (solicitud.equipo.id || solicitud.equipo['@id']?.split('/').pop()) 
      : solicitud.equipo.split('/').pop();
    const found = equipos.find((e: any) => e.id?.toString() === eqId?.toString());
    return found || (typeof solicitud.equipo === 'object' ? solicitud.equipo : null);
  };

  const resolverSolicitante = (solicitud: any) => {
    if (!solicitud?.solicitante) return null;
    if (typeof solicitud.solicitante === 'object') return solicitud.solicitante;
    return null;
  };

  // Resolve equipment: first from local list, then fetch directly if not found
  useEffect(() => {
    if (!selectedSolicitud && !selectedPlan && !selectedHistorial) { setResolvedEquipo(null); setComponentesEquipo([]); return; }

    const fetchComponentes = (equipoId: any) => {
      setLoadingComponentes(true);
      api.get(`/componente_equipos?equipo=/api/equipos/${equipoId}`)
        .then(r => setComponentesEquipo(r.data['hydra:member'] || r.data || []))
        .catch(() => setComponentesEquipo([]))
        .finally(() => setLoadingComponentes(false));
    };

    // 1. Try from preloaded list first (fast path)
    const eq = resolverEquipo(selectedSolicitud || selectedPlan || selectedHistorial);
    if (eq) {
      setResolvedEquipo(eq);
      fetchComponentes(eq.id);
      return;
    }

    // 2. Fallback: fetch equipment directly from API
    const equipoId = getEquipoIdStr(selectedSolicitud ? selectedSolicitud.equipo : selectedPlan ? selectedPlan.equipo : selectedHistorial?.equipo);
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
  }, [selectedSolicitud?.id, selectedPlan?.id, selectedHistorial?.id, equipos.length]);

  const equipoIdSeleccionado = (selectedSolicitud || selectedPlan || selectedHistorial) ? getEquipoIdStr((selectedSolicitud || selectedPlan || selectedHistorial).equipo) : null;
  const historialDelEquipo = historiales.filter((h: any) => {
    const hEqId = getEquipoIdStr(h.equipo);
    return hEqId && equipoIdSeleccionado && hEqId == equipoIdSeleccionado;
  });

  return (
    <div className="fade-in pb-12 lg:pb-0 lg:h-[calc(100vh-100px)] flex flex-col">
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
          <button onClick={() => { setIsPlanModalOpen(true); setFiltroSeccion(''); refetchEquipos(); }} className="bg-white border-2 border-brand-200 text-brand-700 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all hover:bg-brand-50 hover:border-brand-300">
            <Plus size={20} /> Crear Plan Preventivo
          </button>
          <button onClick={() => { setIsSolicitudModalOpen(true); setFiltroSeccion(''); refetchEquipos(); }} className="bg-brand-600 border border-brand-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all hover:bg-brand-700">
            <Plus size={20} /> Nueva Solicitud
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch lg:flex-1 lg:min-h-0">
        {/* Columna Izquierda: Lista de Tickets */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 lg:h-full">
                    <div className="flex gap-1 mb-2">
            <button
              onClick={() => { setActiveTab('pendientes'); setSelectedSolicitud(null); setSelectedPlan(null); setSelectedHistorial(null); }}
              className={`flex-1 py-2 font-bold text-xs rounded-lg transition-colors ${activeTab === 'pendientes' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Pendientes ({pendingSolicitudes.length})
            </button>
            <button
              onClick={() => { setActiveTab('en_proceso'); setSelectedSolicitud(null); setSelectedPlan(null); setSelectedHistorial(null); }}
              className={`flex-1 py-2 font-bold text-xs rounded-lg transition-colors ${activeTab === 'en_proceso' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              En Proceso ({enProceso.length})
            </button>
            <button
              onClick={() => { setActiveTab('preventivo'); setSelectedSolicitud(null); setSelectedPlan(null); setSelectedHistorial(null); }}
              className={`flex-1 py-2 font-bold text-xs rounded-lg transition-colors ${activeTab === 'preventivo' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Preventivo ({planesVencidos.length + planesProximos.length})
            </button>
            <button
              onClick={() => { setActiveTab('historial'); setSelectedSolicitud(null); setSelectedPlan(null); setSelectedHistorial(null); }}
              className={`flex-1 py-2 font-bold text-xs rounded-lg transition-colors ${activeTab === 'historial' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Cerradas
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-[500px] lg:h-auto lg:flex-1 overflow-y-auto">
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
                        <span>{fecha ? new Date(fecha).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : `TKT #${s.id}`}</span>
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
                        <span>{fecha ? new Date(fecha).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : `TKT #${s.id}`}</span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            

            {activeTab === 'preventivo' && (
              <>
                {loadPlanes ? <div className="p-8 text-center text-slate-400">Cargando planes...</div> : null}
                
                {planesVencidos.length > 0 && (
                  <div className="bg-red-50 border-b border-red-100 px-4 py-2 font-bold text-xs text-red-700 flex justify-between">
                    <span>⚠️ VENCIDOS ({planesVencidos.length})</span>
                  </div>
                )}
                {planesVencidos.map((plan: any) => (
                  <div key={plan.id} onClick={() => setSelectedPlan(plan)} className={`p-4 border-b border-slate-100 cursor-pointer transition-colors border-l-4 ${selectedPlan?.id === plan.id ? 'bg-red-50 border-l-red-500' : 'hover:bg-red-50/40 border-l-red-300'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-400">PLAN-{plan.id.toString().padStart(4, '0')}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-red-100 text-red-700">Vencido</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{plan.equipo?.nombre || `Equipo #${plan.equipo?.id}`}</h3>
                    <p className="text-slate-500 text-xs line-clamp-2">{plan.descripcionTareas || 'Mantenimiento Preventivo'}</p>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-red-500 font-bold">
                      <Clock size={11}/>
                      <span>Venció: {new Date(plan.fechaProximoMantenimiento).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}

                {planesProximos.length > 0 && (
                  <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 font-bold text-xs text-amber-700 flex justify-between">
                    <span>🔔 PRÓXIMOS ({planesProximos.length})</span>
                  </div>
                )}
                {planesProximos.map((plan: any) => (
                  <div key={plan.id} onClick={() => setSelectedPlan(plan)} className={`p-4 border-b border-slate-100 cursor-pointer transition-colors border-l-4 ${selectedPlan?.id === plan.id ? 'bg-amber-50 border-l-amber-500' : 'hover:bg-amber-50/40 border-l-amber-300'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-400">PLAN-{plan.id.toString().padStart(4, '0')}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-amber-100 text-amber-700">Próximo</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{resolverEquipo(plan)?.nombre || `Equipo`}</h3>
                    <p className="text-slate-500 text-xs line-clamp-2">{plan.descripcionTareas}</p>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                      <Clock size={11}/>
                      <span>Vence: {new Date(plan.fechaProximoMantenimiento).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}


                {planesActivos.map((plan: any) => (
                  <div key={plan.id} onClick={() => setSelectedPlan(plan)} className={`p-4 border-b border-slate-100 cursor-pointer transition-colors border-l-4 ${selectedPlan?.id === plan.id ? 'bg-brand-50 border-l-brand-500' : 'hover:bg-slate-50 border-l-transparent'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-400">PLAN-{plan.id.toString().padStart(4, '0')}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-100 text-emerald-700">{plan.frecuencia}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{resolverEquipo(plan)?.nombre || `Equipo`}</h3>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={11}/>
                      <span>Prox: {new Date(plan.fechaProximoMantenimiento).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}

                {/* Planes Finalizados/Completados */}
                {planesPreventivos.filter((p: any) => p.estado === 'Completado' || p.estado === 'Finalizado').length > 0 && (
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 font-bold text-xs text-slate-500 flex justify-between mt-4">
                    <span>✔ FINALIZADOS ({planesPreventivos.filter((p: any) => p.estado === 'Completado' || p.estado === 'Finalizado').length})</span>
                  </div>
                )}
                {planesPreventivos.filter((p: any) => p.estado === 'Completado' || p.estado === 'Finalizado').map((plan: any) => (
                  <div key={plan.id} onClick={() => setSelectedPlan(plan)} className={`p-4 border-b border-slate-100 cursor-pointer transition-colors border-l-4 ${selectedPlan?.id === plan.id ? 'bg-emerald-50 border-l-emerald-500' : 'hover:bg-slate-50 border-l-transparent'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-400">PLAN-{plan.id.toString().padStart(4, '0')}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">✔ {plan.frecuencia}</span>
                    </div>
                    <h3 className="font-bold text-slate-600 text-sm mb-1">{resolverEquipo(plan)?.nombre || `Equipo`}</h3>
                    {plan.fechaUltimoMantenimiento && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                        <Clock size={11}/>
                        <span>Realizado: {new Date(plan.fechaUltimoMantenimiento).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}


              </>
            )}

            {activeTab === 'historial' && (
              <>
                {loadHis
                  ? <div className="p-8 text-center text-slate-400">Cargando historial...</div>
                  : historiales.filter((h: any) => h.tipo !== 'Preventivo' && !h.planPreventivo).length === 0
                    ? <div className="p-8 text-center text-slate-400 italic">No hay registros de correctivos cerrados.</div>
                    : null
                }
                {[...historiales].filter((h: any) => h.tipo !== 'Preventivo' && !h.planPreventivo).sort((a,b) => new Date(b.fechaMantenimiento).getTime() - new Date(a.fechaMantenimiento).getTime()).map((h: any) => (
                  <div key={h.id} onClick={() => { setSelectedHistorial(h); setSelectedSolicitud(null); setSelectedPlan(null); }} className={`p-4 border-b border-slate-100 cursor-pointer transition-colors border-l-4 ${selectedHistorial?.id === h.id ? 'bg-emerald-50 border-l-emerald-600' : 'hover:bg-slate-50 border-l-transparent'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-400">{h.fechaMantenimiento ? new Date(h.fechaMantenimiento).toLocaleDateString('es-BO') : 'Sin Fecha'}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        h.tipo === 'Preventivo' || h.planPreventivo ? 'bg-blue-100 text-blue-700' : 
                        h.solicitud ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {h.tipo === 'Preventivo' || h.planPreventivo ? 'Preventivo' : h.solicitud ? 'Resolución TKT' : 'Directo'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{h.equipo?.nombre}</h3>
                    <p className="text-emerald-700 font-bold mb-1 text-xs">Acción: <span className="text-slate-600 font-normal line-clamp-2">{h.accionRealizada}</span></p>
                    <div className="flex justify-end items-center mt-2 border-t border-slate-100 pt-2">
                      <span className="text-brand-600 font-bold text-xs">Bs. {h.costo}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Columna Derecha: Detalle y Validación */}
        <div className="w-full lg:w-2/3 lg:h-full">
          {(selectedSolicitud || selectedPlan || selectedHistorial) ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col fade-in h-full">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Diagnóstico: {resolvedEquipo?.nombre || (selectedSolicitud ? `TKT-${selectedSolicitud.id?.toString().padStart(4,'0')}` : selectedPlan ? `PLAN-${selectedPlan.id?.toString().padStart(4,'0')}` : `MANT-${selectedHistorial.id?.toString().padStart(4,'0')}`)}</h2>
                  <p className="text-sm text-slate-500 mb-1">
                    {selectedSolicitud ? `Ticket TKT-${selectedSolicitud.id.toString().padStart(4, '0')}` : selectedPlan ? `Plan Preventivo PLAN-${selectedPlan.id.toString().padStart(4, '0')}` : 'Mantenimiento Cerrado'} &nbsp;
                    {(() => {
                      if (selectedHistorial) return <span>Técnico: <strong>{selectedHistorial.tecnico?.email || 'Desconocido'}</strong></span>;
                      const sol = resolverSolicitante(selectedSolicitud || selectedPlan);
                      const nombre = sol?.nombre || sol?.email || (selectedSolicitud && typeof selectedSolicitud.solicitante === 'string' ? '' : null);
                      return <span>Solicitante: <strong>{nombre || 'Sistema (Automático)'}</strong></span>;
                    })()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${
                    selectedHistorial ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    (selectedSolicitud ? selectedSolicitud.estadoSolicitud : selectedPlan.estado) === 'Pendiente' ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                    (selectedSolicitud ? selectedSolicitud.estadoSolicitud : selectedPlan.estado) === 'Finalizado' || (selectedPlan && selectedPlan.estado === 'Activo') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    'bg-blue-50 text-blue-600 border-blue-200'
                  }`}>{selectedHistorial ? 'Finalizado' : (selectedSolicitud ? selectedSolicitud.estadoSolicitud : selectedPlan.estado)}</span>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto">
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
                        <div><span className="text-slate-400 font-semibold block">Categoría</span><span className="text-slate-700">{eq.categoria?.nombre || '-'}</span></div>
                        <div><span className="text-slate-400 font-semibold block">Sección</span><span className="text-slate-700">{eq.seccion?.nombre || '-'}</span></div>
                        <div><span className="text-slate-400 font-semibold block">Estado</span><span className="text-slate-700">{eq.estado?.nombre || '-'}</span></div>
                      <div className="col-span-2 md:col-span-1">
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
                    <AlertTriangle size={16} className={selectedHistorial ? "text-emerald-500" : "text-yellow-500"} /> 
                    {selectedHistorial ? 'Acción Realizada / Solución' : 'Descripción del Problema Reportado'}
                  </h3>
                  <p className={`p-4 rounded-xl border ${selectedHistorial ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
                    {selectedHistorial ? selectedHistorial.accionRealizada : (selectedSolicitud ? (selectedSolicitud.descripcionFalla || <span className="text-yellow-600/60 italic">Sin descripción proporcionada al levantar el ticket.</span>) : (selectedPlan?.descripcionTareas || <span className="text-yellow-600/60 italic">Mantenimiento preventivo programado.</span>))}
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
                              <td className="px-4 py-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase mr-2 ${
                                  (h.tipo === 'Preventivo' || h.planPreventivo) ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {(h.tipo === 'Preventivo' || h.planPreventivo) ? 'Preventivo' : 'Correctivo'}
                                </span>
                                <span className="text-slate-700 font-medium text-xs">{h.accionRealizada}</span>
                              </td>
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

                {/* Evidencias fotográficas si está cerrado (Solo Correctivos) */}
                {selectedHistorial && (() => {
                  return (
                    <div className="mt-2 pt-4 border-t border-slate-200">
                      <EvidenciasHistorial historialId={selectedHistorial.id} />
                    </div>
                  );
                })()}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
                {selectedSolicitud ? (
                  <button 
                    onClick={() => setDeleteModalState({ isOpen: true, type: 'solicitud', id: selectedSolicitud.id, isLoading: false })}
                    className="text-red-500 hover:text-red-700 font-bold text-sm px-4 py-2 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2"
                  >
                    <Trash2 size={16}/> Eliminar Ticket
                  </button>
                ) : selectedPlan && selectedPlan.estado !== 'Finalizado' && selectedPlan.estado !== 'Completado' ? (
                  <button 
                    onClick={() => setDeleteModalState({ isOpen: true, type: 'plan', id: selectedPlan.id, isLoading: false })}
                    className="text-red-500 hover:text-red-700 font-bold text-sm px-4 py-2 hover:bg-red-50 rounded-xl transition-all flex items-center gap-2"
                  >
                    <Trash2 size={16}/> Eliminar Plan
                  </button>
                ) : <div></div>}
                <div className="flex gap-3">
                  
                {selectedSolicitud && selectedSolicitud.estadoSolicitud === 'Pendiente' && (
                  <button onClick={() => handleValidar(selectedSolicitud.id, 'En Proceso')} className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 shadow-sm transition-all"><CheckCircle size={18}/> Validar a 'En Proceso'</button>
                )}
                {((selectedSolicitud && selectedSolicitud.estadoSolicitud === 'En Proceso') ||
                  (selectedPlan && selectedPlan.estado === 'Activo')) && (
                  <button onClick={() => {
                    openRegistrarTrabajo(selectedSolicitud, selectedPlan);
                    if (selectedPlan) {
                      setFormData(prev => ({...prev, accionRealizada: selectedPlan.descripcionTareas || ''}));
                    }
                  }} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-sm transition-all"><Tool size={18}/> Registrar y Finalizar {selectedPlan ? 'Preventivo' : 'Mantenimiento'}</button>
                )}

                  {(selectedSolicitud?.estadoSolicitud === 'Finalizado') && (
                    <p className="text-emerald-600 font-bold flex items-center gap-2 px-4 py-2"><CheckCircle size={18}/> Mantenimiento Concluido</p>
                  )}
                  {(selectedPlan?.estado === 'Completado' || selectedPlan?.estado === 'Finalizado') && (() => {
                    const histPlan = historiales.find((h: any) => {
                      const planIri = h.planPreventivo;
                      if (!planIri) return false;
                      const pid = typeof planIri === 'object' ? planIri?.id : String(planIri).split('/').pop();
                      return String(pid) === String(selectedPlan.id);
                    });
                    return (
                      <div className="flex flex-col gap-2 w-full">
                        <p className="text-emerald-600 font-bold flex items-center gap-2"><CheckCircle size={18}/> Preventivo Finalizado</p>
                        {histPlan && (
                          <div className="flex gap-2 flex-wrap">
                            <button type="button" onClick={() => handlePrintDetalle(histPlan)} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"><Printer size={15}/> Imprimir</button>
                            <button type="button" onClick={() => setDeleteModalState({ isOpen: true, type: 'historial', id: histPlan.id, isLoading: false })} className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"><Trash2 size={15}/> Eliminar</button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {selectedHistorial && (
                    <div className="flex gap-2 ml-auto">
                      <button type="button" onClick={() => handlePrintDetalle(selectedHistorial)} className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"><Printer size={15}/> Imprimir Informe</button>
                      <button type="button" onClick={() => setDeleteModalState({ isOpen: true, type: 'historial', id: selectedHistorial.id, isLoading: false })} className="flex items-center gap-1.5 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"><Trash2 size={15}/> Eliminar Registro</button>
                    </div>
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
                Estás cerrando el {selectedPlan ? 'plan preventivo' : 'ticket'} del equipo "{resolvedEquipo?.nombre || 'Desconocido'}".
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{selectedPlan ? 'Tareas Realizadas (Limpieza, chequeo, optimización, etc.)' : 'Acción Realizada / Solución'}</label>
                <textarea required rows={3} value={formData.accionRealizada} onChange={e=>setFormData({...formData, accionRealizada: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800 resize-none" placeholder={selectedPlan ? "Describe qué tareas preventivas se ejecutaron..." : "Ej. Cambio de fuente de poder, limpieza profunda..."} />
              </div>

              {/* Repuestos Selector */}
              {!selectedPlan && (
              <div className="p-4 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-700">Repuestos Utilizados</h3>
                  <button type="button" onClick={() => setSelectedRepuestos([...selectedRepuestos, { repuestoId: '', cantidad: 1, motivo: '' }])} className="text-brand-600 bg-brand-50 hover:bg-brand-100 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                    <Plus size={14}/> Añadir Pieza
                  </button>
                </div>
                {selectedPlan && selectedRepuestos.length === 0 && (
                  <p className="text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <em>Nota:</em> El mantenimiento preventivo (limpieza, optimización, chequeo) rara vez requiere piezas, pero puedes añadirlas si fue necesario un reemplazo menor.
                  </p>
                )}
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
              )}

              {/* Evidencia Fotográfica */}
              {!selectedPlan && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Camera size={16} className="text-emerald-600"/> Evidencia Fotográfica</h3>
                    <div className="flex gap-2">
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors">
                        <Camera size={14}/> {selectedPlan ? 'Foto 1' : 'Antes'}
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
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors">
                        <Camera size={14}/> {selectedPlan ? 'Foto 2' : 'Después'}
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
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      {selectedPlan ? 
                        'Añade fotos de las tareas de prevención (limpieza, chequeo, optimización) como evidencia del trabajo.' : 
                        'Añade fotos del componente viejo (Antes) y el nuevo (Después) como evidencia del trabajo.'}
                    </p>
                  ) : (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {evidenciaFotos.map((foto, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border-2 border-slate-200">
                        <img src={foto.base64} alt={foto.tipo} className="w-full h-28 object-cover" />
                        <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          foto.tipo === 'antes' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                          {foto.tipo === 'antes' ? (selectedPlan ? 'Foto 1' : '⚠ Antes') : (selectedPlan ? 'Foto 2' : '✓ Después')}
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
              )}

              <div className={selectedPlan ? "grid grid-cols-1" : "grid grid-cols-2 gap-4"}>
                {!selectedPlan && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Costo Total Autocalculado (Bs)</label>
                  <input readOnly type="text" value={selectedRepuestos.reduce((acc, sr) => {
                    const r = repuestosDisponibles.find((rep: any) => rep.id?.toString() === sr.repuestoId);
                    return acc + (parseFloat(r?.precio || '0') * sr.cantidad);
                  }, 0).toFixed(2)} className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500 font-bold cursor-not-allowed" />
                </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nuevo Estado del Equipo</label>
                  <select required value={formData.estadoEquipoResultante} onChange={e=>setFormData({...formData, estadoEquipoResultante: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800">
                    <option value="">Seleccionar</option>
                    {estadosOrdenados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-6 border-t border-slate-100 bg-slate-50">
                <button type="button" onClick={() => setIsRegistrarModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={saving || !formData.accionRealizada || !formData.estadoEquipoResultante} className={`bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${saving || !formData.accionRealizada || !formData.estadoEquipoResultante ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'}`}>
                  <CheckCircle size={18}/> {saving ? 'Guardando...' : (selectedPlan ? 'Finalizar Preventivo' : 'Finalizar Ticket')}
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
                      Object.entries(
                        [...secciones]
                          .sort((a: any, b: any) => (a.centro?.nombre || '').localeCompare(b.centro?.nombre || '') || a.nombre.localeCompare(b.nombre))
                          .reduce((acc: any, s: any) => {
                            const cName = s.centro?.nombre || 'General';
                            if (!acc[cName]) acc[cName] = [];
                            acc[cName].push(s);
                            return acc;
                          }, {})
                      )
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([cName, secs]) => (
                        <optgroup key={cName} label={`[ ${cName} ]`}>
                          {(secs as any[]).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </optgroup>
                      ))
                    ) : (
                      [...secciones].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre)).map((s: any) => <option key={s.id} value={s.id}>{s.nombre}</option>)
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
              <div className="flex items-center gap-2">
                <button onClick={() => handlePrintDetalle(detalleHistorial)} className="text-slate-500 hover:text-brand-700 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"><Printer size={14}/> Imprimir Informe</button>
                <button onClick={() => setDetalleHistorial(null)} className="px-5 py-2 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Nuevo Plan Preventivo */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden fade-in" onSubmit={handleCrearPlanPreventivo}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-brand-50">
              <h2 className="text-lg font-bold text-brand-800">Nuevo Plan de Mantenimiento Preventivo</h2>
              <button type="button" onClick={() => setIsPlanModalOpen(false)} className="text-brand-400 hover:text-brand-700 bg-white shadow-sm p-1 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Filtrar por Sección (Opcional)</label>
                <select value={filtroSeccion} onChange={e=>{setFiltroSeccion(e.target.value); setPlanForm({...planForm, equipo: ''});}} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-slate-800">
                  <option value="">Todas las Secciones</option>
                  {
                    !user?.centro_id ? (
                      Object.entries(
                        [...secciones]
                          .sort((a: any, b: any) => (a.centro?.nombre || '').localeCompare(b.centro?.nombre || '') || a.nombre.localeCompare(b.nombre))
                          .reduce((acc: any, s: any) => {
                            const cName = s.centro?.nombre || 'General';
                            if (!acc[cName]) acc[cName] = [];
                            acc[cName].push(s);
                            return acc;
                          }, {})
                      )
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([cName, secs]) => (
                        <optgroup key={cName} label={`[ ${cName} ]`}>
                          {(secs as any[]).sort((a, b) => a.nombre.localeCompare(b.nombre)).map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </optgroup>
                      ))
                    ) : (
                      [...secciones].sort((a: any, b: any) => a.nombre.localeCompare(b.nombre)).map((s: any) => <option key={s.id} value={s.id}>{s.nombre}</option>)
                    )
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Equipo *</label>
                <select required value={planForm.equipo} onChange={e=>setPlanForm({...planForm, equipo: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-slate-800">
                  <option value="">-- Seleccionar Equipo --</option>
                  {equiposFiltrados?.map((eq:any) => <option key={eq.id} value={eq.id}>{eq.nombre}{eq.codigoInventario ? ` [${eq.codigoInventario}]` : ''} — {eq.seccion?.nombre || ''}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Checklist de Tareas / Descripción</label>
                <textarea required rows={3} value={planForm.descripcionTareas} onChange={e=>setPlanForm({...planForm, descripcionTareas: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-slate-800 resize-none" placeholder="Limpieza general, cambio de filtros, verificación de conexiones..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Frecuencia *</label>
                  <select required value={planForm.frecuencia} onChange={e=>{
                    const v = e.target.value;
                    const d = v==='mensual'?30 : v==='trimestral'?90 : v==='semestral'?180 : v==='anual'?365 : 0;
                    const nuevaFecha = new Date();
                    nuevaFecha.setDate(nuevaFecha.getDate() + d);
                    setPlanForm({
                      ...planForm, 
                      frecuencia: v, 
                      intervaloDias: d,
                      fechaProximoMantenimiento: nuevaFecha.toISOString().slice(0, 10)
                    });
                  }} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-slate-800">
                    <option value="mensual">Mensual (30 días)</option>
                    <option value="trimestral">Trimestral (90 días)</option>
                    <option value="semestral">Semestral (180 días)</option>
                    <option value="anual">Anual (365 días)</option>
                    <option value="unico">Unico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha Programada *</label>
                  <input required type="date" value={planForm.fechaProximoMantenimiento} onChange={e=>setPlanForm({...planForm, fechaProximoMantenimiento: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-500 text-slate-800" />
                </div>
              </div>

            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className={`bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 ${saving ? 'opacity-70' : 'hover:bg-brand-700'}`}>
                  {saving ? 'Guardando...' : <><CheckCircle size={18}/> Crear Plan</>}
                </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDeleteModal 
        isOpen={deleteModalState.isOpen}
        title={`Eliminar ${deleteModalState.type === 'solicitud' ? 'Ticket' : deleteModalState.type === 'plan' ? 'Plan Preventivo' : 'Registro'}`}
        message={`¿Estás seguro de que deseas eliminar este ${deleteModalState.type === 'solicitud' ? 'ticket' : deleteModalState.type === 'plan' ? 'plan preventivo' : 'registro histórico'} permanentemente? Esta acción NO se puede deshacer.`}
        isDeleting={deleteModalState.isLoading}
        onCancel={() => setDeleteModalState(prev => ({...prev, isOpen: false}))}
        onConfirm={async () => {
          setDeleteModalState(prev => ({...prev, isLoading: true}));
          try {
            if (deleteModalState.type === 'solicitud') {
              await api.delete(`/solicitudes/${deleteModalState.id}`);
              setSelectedSolicitud(null);
              setSelectedPlan(null);
              refetchSolicitudes();
            } else if (deleteModalState.type === 'plan') {
              await api.delete(`/planes_preventivos/${deleteModalState.id}`);
              setSelectedPlan(null);
              refetchPlanes();
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
