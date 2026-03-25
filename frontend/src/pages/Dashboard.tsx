// @ts-nocheck
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiMonitor, FiTool, FiAlertTriangle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { api } from '../services/api';

const COLORS = ['#3e7365', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4'];

/* ── StatCard ── */
const StatCard = ({ title, value, icon, colorClass, loading }: any) => (
  <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{title}</p>
        {loading
          ? <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
          : <p className="text-3xl font-bold text-slate-900">{value}</p>
        }
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
    </div>
  </div>
);

/* ── Tooltip personalizado ── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
        <p className="text-slate-500 text-xs mb-1 font-medium">{label}</p>
        <p className="text-slate-900 font-bold">{payload[0].value} registros</p>
      </div>
    );
  }
  return null;
};

export const Dashboard = () => {
  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: equipos = [], isLoading: loadEq } = useQuery({
    queryKey: ['equipos'],
    queryFn: () => api.get('/equipos').then(r => r.data['hydra:member'] || r.data),
  });

  const { data: solicitudes = [], isLoading: loadSol } = useQuery({
    queryKey: ['solicitudes'],
    queryFn: () => api.get('/solicitudes').then(r => r.data['hydra:member'] || r.data).catch(() => []),
  });

  const { data: historial = [], isLoading: loadHis } = useQuery({
    queryKey: ['historial'],
    queryFn: () => api.get('/historials').then(r => r.data['hydra:member'] || r.data).catch(() => []),
  });

  const isLoading = loadEq || loadSol || loadHis;

  // ─── KPIs calculados ───────────────────────────────────────────────────────
  const totalEquipos     = equipos.length;
  const enReparacion     = equipos.filter((e: any) => e.estado?.nombre === 'En Reparación').length;
  const solicPendientes  = solicitudes.filter((s: any) => s.estadoSolicitud === 'Pendiente').length;
  const solicEnProceso   = solicitudes.filter((s: any) => s.estadoSolicitud === 'En Proceso').length;

  // Costo total de mantenimientos
  const costoTotal = historial.reduce((acc: number, h: any) => acc + parseFloat(h.costo || '0'), 0);

  // ─── Datos para gráfica de barras: mantenimientos por mes ─────────────────
  const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const mantenimientosPorMes = useMemo(() => {
    const conteo: Record<string, number> = {};
    historial.forEach((h: any) => {
      const fecha = h.fechaMantenimiento ? new Date(h.fechaMantenimiento) : null;
      if (fecha) {
        const key = mesesNombres[fecha.getMonth()];
        conteo[key] = (conteo[key] || 0) + 1;
      }
    });
    // Devolver los últimos 6 meses con datos (o todos si hay menos)
    const ahora = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - (5 - i), 1);
      const mes = mesesNombres[d.getMonth()];
      return { name: mes, valor: conteo[mes] || 0 };
    });
  }, [historial]);

  // ─── Datos para pie: equipos por estado ───────────────────────────────────
  const equiposPorEstado = useMemo(() => {
    const conteo: Record<string, number> = {};
    equipos.forEach((e: any) => {
      const nombre = e.estado?.nombre || 'Sin estado';
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });
    return Object.entries(conteo).map(([name, value]) => ({ name, value }));
  }, [equipos]);

  // ─── Datos para pie: equipos por categoría ────────────────────────────────
  const equiposPorCategoria = useMemo(() => {
    const conteo: Record<string, number> = {};
    equipos.forEach((e: any) => {
      const nombre = e.categoria?.nombre || 'Sin categoría';
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });
    return Object.entries(conteo).map(([name, value]) => ({ name, value }));
  }, [equipos]);

  // ─── Últimas solicitudes ──────────────────────────────────────────────────
  const ultimasSolicitudes = [...solicitudes]
    .sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime())
    .slice(0, 5);

  const estadoColors: Record<string, string> = {
    'Pendiente': 'text-slate-500 bg-slate-100 border-slate-200',
    'En Proceso': 'text-blue-600 bg-blue-50 border-blue-200',
    'Resuelta':   'text-brand-600 bg-brand-50 border-brand-200',
    'Cancelada':  'text-red-600 bg-red-50 border-red-200',
  };

  const prioColors: Record<string, string> = { 'Alta': 'text-red-600', 'Media': 'text-yellow-600', 'Baja': 'text-blue-500' };

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 fade-in pb-12">
      {/* Header */}
      <div className="flex justify-between items-end pb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Resumen General</h1>
          <p className="text-slate-500 text-sm mt-1">Métricas en tiempo real del sistema • Caja Petrolera de Salud</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-brand-600 font-medium text-sm animate-pulse bg-brand-50 px-3 py-1.5 rounded-full">
            <FiRefreshCw className="animate-spin" size={14} />
            Sincronizando...
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Equipos"       value={totalEquipos}    loading={loadEq}  icon={<FiMonitor size={22} />}      colorClass="bg-brand-50 text-brand-600" />
        <StatCard title="En Reparación"       value={enReparacion}    loading={loadEq}  icon={<FiTool size={22} />}         colorClass="bg-amber-50 text-amber-600" />
        <StatCard title="Solicitudes Pend."   value={solicPendientes} loading={loadSol} icon={<FiAlertTriangle size={22} />} colorClass="bg-red-50 text-red-600" />
        <StatCard title="En Proceso"          value={solicEnProceso}  loading={loadSol} icon={<FiCheckCircle size={22} />}  colorClass="bg-blue-50 text-blue-600" />
      </div>

      {/* Costo total */}
      <div className="bg-gradient-to-r from-brand-50 to-emerald-50 border border-brand-100 shadow-sm rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-brand-700 text-xs font-bold uppercase tracking-wider mb-1">Costo Total de Mantenimientos</p>
          <p className="text-4xl font-black text-brand-600">Bs. {costoTotal.toFixed(2)}</p>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <span className="bg-white px-3 py-1 rounded-full text-brand-700 font-medium text-sm shadow-sm border border-brand-100">{historial.length} mantenimientos</span>
          <span className="bg-white px-3 py-1 rounded-full text-slate-600 font-medium text-sm shadow-sm border border-slate-100">{solicitudes.length} solicitudes</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Barra: mantenimientos por mes */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Historial de Mantenimientos
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Últimos 6 meses</span>
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mantenimientosPorMes} barSize={36} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="valor" fill="#3e7365" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie: estados */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Estado del Inventario</h3>
          {equiposPorEstado.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm italic bg-slate-50 rounded-xl border border-dashed border-slate-200">Sin equipos registrados</div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="h-[200px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={equiposPorEstado} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                      {equiposPorEstado.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {equiposPorEstado.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm px-2 py-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Segunda fila: pie categorías + últimas solicitudes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pie: categorías */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Equipos por Categoría</h3>
          {equiposPorCategoria.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm italic bg-slate-50 rounded-xl border border-dashed border-slate-200">Sin categorías registradas</div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="h-[200px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={equiposPorCategoria} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                      {equiposPorCategoria.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {equiposPorCategoria.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm px-2 py-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[(i + 3) % COLORS.length] }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Últimas solicitudes */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Últimas Solicitudes de Mantenimiento</h3>
            <button className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">Ver todas &rarr;</button>
          </div>
          
          {loadSol ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : ultimasSolicitudes.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No hay solicitudes recientes registradas.
            </div>
          ) : (
            <div className="space-y-3">
              {ultimasSolicitudes.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-100 shadow-sm transition-all group">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      <FiAlertTriangle size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 text-sm font-bold truncate tracking-tight">{s.equipo?.nombre || 'Equipo no especificado'}</p>
                      <p className="text-slate-500 text-xs truncate mt-1">{s.descripcionFalla}</p>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${estadoColors[s.estadoSolicitud] || ''}`}>
                      {s.estadoSolicitud}
                    </span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${prioColors[s.prioridad] || 'text-slate-400'}`}>
                      {s.prioridad} PRIORIDAD
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
