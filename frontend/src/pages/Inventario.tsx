import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { getUserInfo } from '../services/auth';
import { Archive, Plus, Search, Edit3, Trash2, X, Cpu, Settings2, Eye, FileText } from 'lucide-react';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Equipo {
  id: number;
  codigoInventario: string;
  nombre: string;
  marca: string;
  modelo: string;
  numeroSerie: string | null;
  estado: any | null;
  vidaUtilMeses: number | null;
  fechaAdquisicion: string | null;
  porcentajeVidaUtilConsumido: number | null;
  obsoleto: boolean | null;
  seccion: any | null;
  categoria: any | null;
  centro: any | null;
  observaciones?: string | null;
}

/**
 * Vida útil base realista por categoría (en meses):
 * - Computadoras/Monitores/Impresoras: 120 meses (10 años)
 * - Equipos médicos/especializados: 144 meses (12 años)
 * - Teléfonos/Móviles: 60 meses (5 años)
 * - Genérico: 96 meses (8 años)
 */
const BASE_VIDA_POR_CATEGORIA: Record<string, number> = {
  'computadora': 120,
  'laptop': 120,
  'monitor': 120,
  'impresora': 96,
  'servidor': 144,
  'telefono': 60,
  'movil': 60,
  'medico': 144,
  'electromedico': 144,
};

const getBaseVidaUtil = (categoriaNombre: string | null | undefined): number => {
  if (!categoriaNombre) return 96;
  const lower = categoriaNombre.toLowerCase();
  for (const [key, val] of Object.entries(BASE_VIDA_POR_CATEGORIA)) {
    if (lower.includes(key)) return val;
  }
  return 96;
};

const calcularVidaUtil = (
  fechaAdquisicion: string | null,
  nMantenimientos: number,
  repuestosUsados: number,
  categoriaNombre?: string | null
) => {
  if (!fechaAdquisicion) return null;
  const base = getBaseVidaUtil(categoriaNombre);
  const bonoMantenimiento = nMantenimientos * 8;  // cada mantenimiento suma 8 meses
  const bonoRepuestos = repuestosUsados * 4;       // cada repuesto suma 4 meses
  return Math.min(base + bonoMantenimiento + bonoRepuestos, Math.round(base * 1.5)); // máx. 50% extra
};

/** Devuelve el porcentaje de vida útil consumida (puede superar 100% si es obsoleto) */
const calcularDesgaste = (fechaAdquisicion: string | null, vidaUtilMeses: number | null) => {
  if (!fechaAdquisicion || !vidaUtilMeses) return null;
  const inicio = new Date(fechaAdquisicion).getTime();
  const ahora = Date.now();
  const mesesTranscurridos = (ahora - inicio) / (1000 * 60 * 60 * 24 * 30.44);
  // No limitamos a 100 — dejamos que supere para saber cuánto está fuera de vida útil
  return Math.round((mesesTranscurridos / vidaUtilMeses) * 100);
};

/** Años transcurridos desde la fecha de adquisición */
const calcularAnosUso = (fechaAdquisicion: string | null): number | null => {
  if (!fechaAdquisicion) return null;
  const inicio = new Date(fechaAdquisicion).getTime();
  return Math.floor((Date.now() - inicio) / (1000 * 60 * 60 * 24 * 365.25));
};

export const Inventario = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [categorias, setCategorias] = useState<any[]>([]);
  const [secciones, setSecciones] = useState<any[]>([]);
  const [estados, setEstados] = useState<any[]>([]);
  const [centros, setCentros] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detalleEquipo, setDetalleEquipo] = useState<Equipo | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null as number | null,
    nombre: '',
    codigoInventario: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    fechaAdquisicion: '',
    categoria: '',
    seccion: '',
    estado: '',
    centro: '',
    observaciones: ''
  });

  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean, type: 'equipo' | 'componente', id: number | null, isLoading: boolean }>({
    isOpen: false, type: 'equipo', id: null, isLoading: false
  });

  const [isComponentesModalOpen, setIsComponentesModalOpen] = useState(false);
  const [selectedEquipoForComponentes, setSelectedEquipoForComponentes] = useState<any>(null);
  const [componentes, setComponentes] = useState<any[]>([]);
  const [loadingComponentes, setLoadingComponentes] = useState(false);
  const [tiposComponente, setTiposComponente] = useState<any[]>([]);
  const [nuevoComponenteData, setNuevoComponenteData] = useState({ tipoComponente: '', descripcion: '', numeroSerie: '', estado: 'Instalado', fechaInstalacion: new Date().toISOString().slice(0, 10) });

  const [mantenimientosPorEquipo, setMantenimientosPorEquipo] = useState<Record<number, number>>({});
  const [repuestosPorEquipo, setRepuestosPorEquipo] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchEquipos();
    fetchMaestros();
  }, []);

  const fetchEquipos = async () => {
    try {
      const user = getUserInfo();
      const url = user?.centro_id ? `/equipos?centro=${user.centro_id}&pagination=false` : '/equipos?pagination=false';

      // ── Todas las peticiones en paralelo (3x más rápido que secuencial) ──
      const [equiposRes, historialesRes, reemplazosRes] = await Promise.all([
        api.get(url),
        api.get('/historials').catch(() => ({ data: [] })),
        api.get('/reemplazo_componentes').catch(() => ({ data: [] })),
      ]);

      const lista        = equiposRes.data['hydra:member']     || equiposRes.data     || [];
      const historiales  = historialesRes.data['hydra:member'] || historialesRes.data  || [];
      const reemplazos   = reemplazosRes.data['hydra:member']  || reemplazosRes.data   || [];

      setEquipos(lista);

      const conteoMant: Record<number, number> = {};
      historiales.forEach((h: any) => {
        const eqId = typeof h.equipo === 'object' ? h.equipo?.id : parseInt(h.equipo?.split('/').pop());
        if (eqId) conteoMant[eqId] = (conteoMant[eqId] || 0) + 1;
      });
      setMantenimientosPorEquipo(conteoMant);

      const conteoRep: Record<number, number> = {};
      reemplazos.forEach((r: any) => {
        const hId = typeof r.historialMantenimiento === 'object' ? r.historialMantenimiento?.id : null;
        if (hId) {
          const h = historiales.find((h: any) => h.id === hId);
          const eqId = typeof h?.equipo === 'object' ? h?.equipo?.id : parseInt(h?.equipo?.split('/').pop());
          if (eqId) conteoRep[eqId] = (conteoRep[eqId] || 0) + 1;
        }
      });
      setRepuestosPorEquipo(conteoRep);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  const fetchMaestros = async () => {
    try {
      const [cRes, sRes, eRes, cenRes] = await Promise.all([
        api.get('/categoria_equipos').catch(() => ({ data: [] })),
        api.get('/seccions').catch(() => ({ data: [] })),
        api.get('/estado_equipos').catch(() => ({ data: [] })),
        api.get('/centros').catch(() => ({ data: [] })),
      ]);
      setCategorias(cRes.data['hydra:member'] || cRes.data || []);
      setSecciones(sRes.data['hydra:member'] || sRes.data || []);
      setEstados(eRes.data['hydra:member'] || eRes.data || []);
      setCentros(cenRes.data['hydra:member'] || cenRes.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // Helper: resuelve un valor que puede ser IRI string, objeto, o número
  const resolveRelation = (val: any, lista: any[]): any => {
    if (!val) return null;
    if (typeof val === 'object' && val !== null) return val;
    // IRI string tipo "/api/seccions/3" o número
    const id = typeof val === 'string' ? parseInt(val.split('/').pop() || '0') : val;
    return lista.find((item: any) => item.id === id) || null;
  };

  const equiposConDesgaste = useMemo(() => {
    return equipos.map(eq => {
      const nMant = mantenimientosPorEquipo[eq.id] || 0;
      const nRep = repuestosPorEquipo[eq.id] || 0;
      // Resolver relaciones que pueden venir como IRI o como objeto
      const seccionObj = resolveRelation(eq.seccion, secciones);
      const centroObj = resolveRelation(eq.centro, centros);
      const categoriaObj = resolveRelation(eq.categoria, categorias);
      const categoriaNombre = categoriaObj?.nombre || null;
      const vidaCalculada = calcularVidaUtil(eq.fechaAdquisicion, nMant, nRep, categoriaNombre);
      const desgaste = calcularDesgaste(eq.fechaAdquisicion, vidaCalculada);
      const anosUso = calcularAnosUso(eq.fechaAdquisicion);
      return {
        ...eq,
        seccion: seccionObj,
        centro: centroObj,
        categoria: categoriaObj,
        _vidaCalculada: vidaCalculada,
        _desgaste: desgaste,
        _anosUso: anosUso
      };
    });
  }, [equipos, mantenimientosPorEquipo, repuestosPorEquipo, secciones, centros, categorias]);

  const filteredEquipos = equiposConDesgaste.filter(e =>
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.codigoInventario && e.codigoInventario.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredEquipos.length / itemsPerPage);
  const currentEquipos = filteredEquipos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let pages = [];
    if (totalPages <= 7) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      if (currentPage <= 4) {
        pages = [1, 2, 3, 4, 5, '...', totalPages];
      } else if (currentPage >= totalPages - 3) {
        pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }

    return (
      <div className="flex justify-center items-center gap-1 mt-6">
        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors">&larr;</button>
        {pages.map((p, i) => (
          typeof p === 'string' ? (
            <span key={i} className="px-3 py-1.5 text-slate-400 font-bold">...</span>
          ) : (
            <button key={i} onClick={() => setCurrentPage(p as number)} className={`w-9 h-9 rounded-lg font-bold transition-colors ${currentPage === p ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-brand-50 text-slate-600 border border-transparent hover:border-brand-200'}`}>
              {p}
            </button>
          )
        ))}
        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors">&rarr;</button>
      </div>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditEquipo = (equipo: any) => {
    const extractId = (val: any) => (typeof val === 'object' && val !== null ? val.id : (typeof val === 'string' ? val.split('/').pop() : ''));
    setFormData({
      id: equipo.id,
      nombre: equipo.nombre || '',
      codigoInventario: equipo.codigoInventario || '',
      marca: equipo.marca || '',
      modelo: equipo.modelo || '',
      numeroSerie: equipo.numeroSerie || '',
      fechaAdquisicion: equipo.fechaAdquisicion ? equipo.fechaAdquisicion.split('T')[0] : '',
      categoria: extractId(equipo.categoria),
      seccion: extractId(equipo.seccion),
      estado: extractId(equipo.estado),
      centro: extractId(equipo.centro),
      observaciones: equipo.observaciones || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteEquipo = (id: number) => {
    setDeleteModalState({ isOpen: true, type: 'equipo', id, isLoading: false });
  };

  const handleOpenComponentes = async (equipo: any) => {
    setSelectedEquipoForComponentes(equipo);
    setLoadingComponentes(true);
    setIsComponentesModalOpen(true);
    try {
      const { data } = await api.get(`/componente_equipos?equipo=/api/equipos/${equipo.id}`);
      setComponentes(data['hydra:member'] || data || []);
      const { data: tipos } = await api.get('/tipo_componentes');
      setTiposComponente(tipos['hydra:member'] || tipos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComponentes(false);
    }
  };

  const handleCreateComponente = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        equipo: `/api/equipos/${selectedEquipoForComponentes.id}`,
        tipoComponente: `/api/tipo_componentes/${nuevoComponenteData.tipoComponente}`,
        descripcion: nuevoComponenteData.descripcion || null,
        numeroSerie: nuevoComponenteData.numeroSerie || null,
        estado: nuevoComponenteData.estado,
        fechaInstalacion: `${nuevoComponenteData.fechaInstalacion}T00:00:00Z`
      };
      await api.post('/componente_equipos', payload);
      const { data } = await api.get(`/componente_equipos?equipo=/api/equipos/${selectedEquipoForComponentes.id}`);
      setComponentes(data['hydra:member'] || data || []);
      setNuevoComponenteData({ tipoComponente: '', descripcion: '', numeroSerie: '', estado: 'Instalado', fechaInstalacion: new Date().toISOString().slice(0, 10) });
    } catch (err: any) {
      console.error(err);
      setEquipos([]);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComponente = (id: number) => {
    setDeleteModalState({ isOpen: true, type: 'componente', id, isLoading: false });
  };

  const handleCreateEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { nombre: formData.nombre, codigoInventario: formData.codigoInventario };
      if (formData.marca) payload.marca = formData.marca;
      if (formData.modelo) payload.modelo = formData.modelo;
      if (formData.numeroSerie) payload.numeroSerie = formData.numeroSerie;
      if (formData.fechaAdquisicion) payload.fechaAdquisicion = formData.fechaAdquisicion;
      if (formData.observaciones) payload.observaciones = formData.observaciones;
      if (formData.categoria) payload.categoria = `/api/categoria_equipos/${formData.categoria}`;
      if (formData.seccion) payload.seccion = `/api/seccions/${formData.seccion}`;
      if (formData.estado) payload.estado = `/api/estado_equipos/${formData.estado}`;
      if (formData.centro) payload.centro = `/api/centros/${formData.centro}`;

      if (formData.id) await api.put(`/equipos/${formData.id}`, payload);
      else await api.post('/equipos?pagination=false', payload);

      setIsModalOpen(false);
      fetchEquipos();
    } catch {
      alert('Error al guardar el equipo.');
    } finally {
      setSaving(false);
    }
  };

  const user = getUserInfo();

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });

      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175);
      doc.text('Caja Petrolera de Salud - Reporte de Inventario', 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100);
      const dateStr = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      doc.text(`Generado: ${dateStr} - Total listado: ${filteredEquipos.length} equipos`, 14, 30);
      if (searchTerm) {
        doc.text(`Filtro aplicado: "${searchTerm}"`, 14, 36);
      }

      const tableColumn = ["Código", "Nombre del Equipo", "Marca/Modelo", "Serie", "Categoría", "Centro / Sección", "Estado"];
      const tableRows = filteredEquipos.map(eq => [
        eq.codigoInventario || '-',
        eq.nombre || '-',
        `${eq.marca || '-'} / ${eq.modelo || '-'}`,
        eq.numeroSerie || '-',
        eq.categoria?.nombre || '-',
        `${eq.centro?.nombre?.split(' ')[0] || 'Gen.'} - ${eq.seccion?.nombre || 'Gral.'}`,
        eq.estado?.nombre || '-'
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: searchTerm ? 42 : 36,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
        headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`Inventario_CPS_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Hubo un error al generar el PDF. Revisa la consola.");
    }
  };

  return (
    <div className="fade-in pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
            <Archive className="text-brand-600" size={32} />
            Catálogo de Equipos
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Visualiza y administra los equipos de computacion.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-brand-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
            title="Exportar a PDF"
          >
            <FileText size={20} /> <span className="hidden sm:inline">Exportar PDF</span>
          </button>
          <button
            className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
            onClick={() => {
              setFormData({
                id: null, nombre: '', codigoInventario: '', marca: '', modelo: '',
                numeroSerie: '', fechaAdquisicion: '', categoria: '',
                seccion: '', centro: user?.centro_id ? user.centro_id.toString() : '', estado: '', observaciones: ''
              });
              setIsModalOpen(true);
            }}
          >
            <Plus size={20} /> Nuevo Equipo
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all text-slate-700"
              placeholder="Buscar por nombre, código..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 font-medium">Cargando equipos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-slate-500 text-sm">
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider">Código</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider">Nombre</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider">Marca / Modelo</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider">Sección / Centro</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider">Desgaste</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentEquipos.map((equipo: any) => {
                  const desgaste = equipo._desgaste;
                  const anosUso = equipo._anosUso;
                  const obsoleto = desgaste !== null && desgaste >= 100;
                  // Para la barra visual siempre mostramos máx 100%
                  const barWidth = desgaste !== null ? Math.min(desgaste, 100) : 0;
                  return (
                    <tr key={equipo.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                      <td className="py-4 px-4 font-bold text-slate-700">{equipo.codigoInventario || '-'}</td>
                      <td className="py-4 px-4 text-slate-800 font-medium">{equipo.nombre}</td>
                      <td className="py-4 px-4 text-slate-500 text-sm">{equipo.marca} {equipo.modelo}</td>
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {equipo.seccion?.nombre ? (
                          <span className="block font-semibold text-slate-700">{equipo.seccion.nombre}</span>
                        ) : (
                          <span className="block text-slate-400 italic">Sin sección</span>
                        )}
                        {equipo.centro?.nombre ? (
                          <span className="text-slate-400">{equipo.centro.nombre}</span>
                        ) : (
                          <span className="text-slate-300 italic">Sin centro</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {desgaste !== null ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${obsoleto ? 'bg-red-500'
                                      : desgaste > 70 ? 'bg-yellow-400'
                                        : 'bg-emerald-500'
                                    }`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${obsoleto ? 'text-red-600'
                                  : desgaste > 70 ? 'text-yellow-600'
                                    : 'text-emerald-600'
                                }`}>
                                {Math.min(desgaste, 100)}%
                              </span>
                            </div>
                            {obsoleto && anosUso !== null && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 rounded px-1.5 py-0.5 w-fit">
                                ⚠ Obsoleto · {anosUso} años de uso
                              </span>
                            )}
                            {!obsoleto && anosUso !== null && (
                              <span className="text-[10px] text-slate-400">{anosUso} año{anosUso !== 1 ? 's' : ''} de uso</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin fecha</span>
                        )}
                      </td>
                      <td className="py-4 px-4 flex justify-center gap-2">
                        <button onClick={() => setDetalleEquipo(equipo)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Detalles">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => handleOpenComponentes(equipo)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Componentes Internos">
                          <Cpu size={18} />
                        </button>
                        <button onClick={() => handleEditEquipo(equipo)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => handleDeleteEquipo(equipo.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredEquipos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic">No se encontraron equipos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {renderPagination()}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {formData.id ? 'Editar Equipo' : 'Nuevo Equipo'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm p-1 rounded-full"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateEquipo} className="overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Equipo</label>
                  <input required name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Ej: Monitor de Signos Vitales" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white text-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Código Inventario</label>
                  <input required name="codigoInventario" value={formData.codigoInventario} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white text-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Marca</label>
                  <input name="marca" value={formData.marca} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white text-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Modelo</label>
                  <input name="modelo" value={formData.modelo} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white text-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nº Serie</label>
                  <input name="numeroSerie" value={formData.numeroSerie} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white text-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fecha Adquisición</label>
                  <input type="date" name="fechaAdquisicion" value={formData.fechaAdquisicion} onChange={handleInputChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white text-slate-600" />
                </div>
              </div>

              {formData.fechaAdquisicion && (
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6">
                  <p className="text-xs font-semibold text-brand-700 mb-1">Vida Útil Estimada (Calculada automáticamente)</p>
                  <p className="text-sm text-brand-800">
                    La vida útil base depende de la categoría del equipo
                    (ej: <strong>10 años</strong> para computadoras/monitores, <strong>5 años</strong> para teléfonos).
                    Cada mantenimiento suma 8 meses y cada repuesto 4 meses adicionales.
                    Un equipo puede seguir activo aunque supere su vida útil estimada — se marcará como <strong>Obsoleto</strong> indicando cuántos años lleva en funcionamiento.
                  </p>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Clasificación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Centro / Hospital</label>
                    <select name="centro" value={formData.centro} onChange={handleInputChange} required disabled={!!user?.centro_id} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800 disabled:opacity-60 disabled:bg-slate-100">
                      <option value="">Seleccionar</option>
                      {centros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Sección</label>
                    <select name="seccion" value={formData.seccion} onChange={handleInputChange} required className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800">
                      <option value="">Seleccionar</option>
                      {secciones.filter(s => {
                        if (!formData.centro) return true;
                        const sCentroId = typeof s.centro === 'object' ? s.centro?.id : (typeof s.centro === 'string' ? s.centro.split('/').pop() : s.centro);
                        return sCentroId?.toString() === formData.centro.toString();
                      }).map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Categoría</label>
                    <select name="categoria" value={formData.categoria} onChange={handleInputChange} required className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800">
                      <option value="">Seleccionar</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Estado Físico</label>
                    <select name="estado" value={formData.estado} onChange={handleInputChange} required className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 text-slate-800">
                      <option value="">Seleccionar</option>
                      {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Observaciones</label>
                <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white text-slate-800 resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className={`bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${saving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-brand-700 hover:shadow-md'}`}>
                  {saving ? 'Guardando...' : formData.id ? 'Guardar Cambios' : 'Registrar Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isComponentesModalOpen && selectedEquipoForComponentes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-brand-50">
              <h2 className="text-xl font-bold text-brand-800 flex items-center gap-3">
                <Cpu size={24} /> Componentes: {selectedEquipoForComponentes.nombre}
              </h2>
              <button disabled={saving} onClick={() => setIsComponentesModalOpen(false)} className="text-brand-500 hover:text-brand-800 bg-white shadow-sm p-1.5 rounded-full"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50">
              <div className="w-full lg:w-2/3 h-full border-r border-slate-200 overflow-y-auto bg-white p-6">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Settings2 size={18} /> Lista de Partes Asignadas</h3>
                {loadingComponentes ? (
                  <div className="text-center text-slate-400 py-8">Cargando...</div>
                ) : componentes.length === 0 ? (
                  <div className="text-center text-slate-400 py-8 border-2 border-dashed border-slate-100 rounded-xl">No hay componentes registrados en este equipo.</div>
                ) : (
                  <div className="space-y-3">
                    {componentes.map(c => (
                      <div key={c.id} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center hover:shadow-sm transition-all hover:border-brand-100 bg-slate-50 group">
                        <div>
                          <p className="font-bold text-slate-800">{c.tipoComponente?.nombre || 'Pieza General'}</p>
                          {(c.descripcion || c.numeroSerie) && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {c.descripcion} {c.numeroSerie ? `(S/N: ${c.numeroSerie})` : ''}
                            </p>
                          )}
                          <div className="flex gap-3 mt-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{c.estado}</span>
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest">{c.fechaInstalacion ? new Date(c.fechaInstalacion).toLocaleDateString() : ''}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteComponente(c.id)} className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-red-100 rounded-lg shadow-sm" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full lg:w-1/3 h-full p-6 bg-slate-50 overflow-y-auto">
                <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">Añadir Componente</h3>
                <form onSubmit={handleCreateComponente} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Pieza *</label>
                    <select required value={nuevoComponenteData.tipoComponente} onChange={e => setNuevoComponenteData({ ...nuevoComponenteData, tipoComponente: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500">
                      <option value="">Seleccionar...</option>
                      {tiposComponente.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción</label>
                    <input type="text" value={nuevoComponenteData.descripcion} onChange={e => setNuevoComponenteData({ ...nuevoComponenteData, descripcion: e.target.value })} placeholder="Ej. Kingston 8GB 3200Mhz" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Número de Serie</label>
                    <input type="text" value={nuevoComponenteData.numeroSerie} onChange={e => setNuevoComponenteData({ ...nuevoComponenteData, numeroSerie: e.target.value })} placeholder="Opcional" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-brand-500" />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={saving} className={`w-full py-2.5 rounded-lg font-bold text-sm text-white shadow-sm transition-all ${saving ? 'bg-brand-400' : 'bg-brand-600 hover:bg-brand-700'}`}>
                      {saving ? 'Añadiendo...' : 'Instalar en Equipo'}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-3 text-center leading-relaxed">Para reemplazos técnicos, usa la sección de Mantenimiento para descontar repuestos de Bodega.</p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {detalleEquipo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-brand-50">
              <h2 className="text-xl font-bold text-brand-800 flex items-center gap-2">
                <Archive size={20} /> Detalle de Equipo
              </h2>
              <button onClick={() => setDetalleEquipo(null)} className="text-brand-400 hover:text-brand-700 bg-white shadow-sm p-1 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Nombre</span><span className="text-slate-800 font-bold">{detalleEquipo.nombre}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Código</span><span className="text-slate-800">{detalleEquipo.codigoInventario || '-'}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Marca</span><span className="text-slate-800">{detalleEquipo.marca || '-'}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Modelo</span><span className="text-slate-800">{detalleEquipo.modelo || '-'}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Categoría</span><span className="text-slate-800">{detalleEquipo.categoria?.nombre || '-'}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Centro / Sección</span><span className="text-slate-800 tracking-tight">{detalleEquipo.centro?.nombre || 'Global'} / {detalleEquipo.seccion?.nombre || 'General'}</span></div>
                <div><span className="text-slate-400 font-semibold block text-xs uppercase">Fecha Adquisición</span><span className="text-slate-800">{detalleEquipo.fechaAdquisicion ? new Date(detalleEquipo.fechaAdquisicion).toLocaleDateString() : '-'}</span></div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-semibold block text-xs uppercase mb-1">Observaciones</span>
                <p className="text-slate-600 text-sm whitespace-pre-wrap">{detalleEquipo.observaciones || 'Sin observaciones.'}</p>
              </div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setDetalleEquipo(null)} className="px-5 py-2 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        title={deleteModalState.type === 'equipo' ? 'Eliminar Equipo' : 'Eliminar Componente'}
        message={`¿Estás seguro de que deseas eliminar este ${deleteModalState.type} de forma permanente?`}
        isDeleting={deleteModalState.isLoading}
        onCancel={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          setDeleteModalState(prev => ({ ...prev, isLoading: true }));
          try {
            if (deleteModalState.type === 'equipo') {
              await api.delete(`/equipos/${deleteModalState.id}`);
              fetchEquipos();
            } else {
              await api.delete(`/componente_equipos/${deleteModalState.id}`);
              setComponentes(componentes.filter(c => c.id !== deleteModalState.id));
            }
            setDeleteModalState(prev => ({ ...prev, isOpen: false, isLoading: false }));
          } catch {
            alert("Error al intentar eliminar el elemento.");
            setDeleteModalState(prev => ({ ...prev, isLoading: false }));
          }
        }}
      />

    </div>
  );
};
