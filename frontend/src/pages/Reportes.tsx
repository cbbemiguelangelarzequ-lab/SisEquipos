import { useState } from 'react';
import { api } from '../services/api';
import { getUserInfo } from '../services/auth';
import { BarChart3, Wrench, PackageSearch, Database, FileText, Download, Image as ImageIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export const Reportes = () => {
  const user = getUserInfo();
  const isSuperUser = !user?.centro_id;

  const [activeTab, setActiveTab] = useState<'mantenimientos' | 'transferencias' | 'repuestos'>('mantenimientos');
  const [periodo, setPeriodo] = useState('mensual');
  const [centroId, setCentroId] = useState<string>(user?.centro_id ? String(user.centro_id) : '');
  const [tipoMantenimiento, setTipoMantenimiento] = useState<'tecnico' | 'imagenes'>('tecnico');
  const [loading, setLoading] = useState(false);

  // Fetch centros for superusers
  const { data: centros = [] } = useQuery({
    queryKey: ['centros'],
    enabled: isSuperUser,
    queryFn: async () => {
      const { data } = await api.get('/centros');
      return data['hydra:member'] || data;
    }
  });

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      const payload: any = {
        periodo,
        centroId: centroId ? Number(centroId) : null
      };

      if (activeTab === 'mantenimientos') {
        endpoint = '/reportes/mantenimientos-periodo';
        payload.tipo = tipoMantenimiento;
      } else if (activeTab === 'transferencias') {
        endpoint = '/reportes/transferencias-periodo';
      } else if (activeTab === 'repuestos') {
        endpoint = '/reportes/repuestos-periodo';
      }

      const response = await api.post(endpoint, payload, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${activeTab}_${periodo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error(error);
      alert('Error al generar el reporte. Verifica tu conexión y permisos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <BarChart3 className="text-brand-600" size={32} /> Central de Reportes
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Generación de informes estadísticos y operativos por período.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('mantenimientos')}
            className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'mantenimientos' ? 'text-brand-600 border-b-2 border-brand-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <Wrench size={18} /> Mantenimientos
          </button>
          <button 
            onClick={() => setActiveTab('transferencias')}
            className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'transferencias' ? 'text-brand-600 border-b-2 border-brand-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <PackageSearch size={18} /> Transferencias
          </button>
          <button 
            onClick={() => setActiveTab('repuestos')}
            className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'repuestos' ? 'text-brand-600 border-b-2 border-brand-600 bg-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <Database size={18} /> Inventario Bodega
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Filters Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Configuración del Reporte</h3>
              
              {/* Period Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Período de Análisis</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {['mensual', 'trimestral', 'semestral', 'anual'].map(p => (
                    <div 
                      key={p}
                      onClick={() => setPeriodo(p)}
                      className={`cursor-pointer text-center py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${periodo === p ? 'bg-brand-50 border-brand-500 text-brand-700 ring-2 ring-brand-500/20' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'}`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Center Filter (Only SuperUser) */}
              {isSuperUser && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Filtrar por Centro (Opcional)</label>
                  <select 
                    value={centroId} 
                    onChange={(e) => setCentroId(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-slate-700"
                  >
                    <option value="">Global (Todos los centros)</option>
                    {centros.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Specific Options for Mantenimientos */}
              {activeTab === 'mantenimientos' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Formato del Reporte</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 cursor-pointer border rounded-xl p-4 flex items-start gap-3 transition-all ${tipoMantenimiento === 'tecnico' ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name="tipoMnt" 
                        value="tecnico"
                        checked={tipoMantenimiento === 'tecnico'}
                        onChange={() => setTipoMantenimiento('tecnico')}
                        className="mt-1 text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2"><FileText size={16}/> Resumen Técnico</div>
                        <p className="text-xs text-slate-500 mt-1">Tabla de mantenimientos con costos y descripciones textuales.</p>
                      </div>
                    </label>
                    <label className={`flex-1 cursor-pointer border rounded-xl p-4 flex items-start gap-3 transition-all ${tipoMantenimiento === 'imagenes' ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input 
                        type="radio" 
                        name="tipoMnt" 
                        value="imagenes"
                        checked={tipoMantenimiento === 'imagenes'}
                        onChange={() => setTipoMantenimiento('imagenes')}
                        className="mt-1 text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2"><ImageIcon size={16}/> Evidencia Fotográfica</div>
                        <p className="text-xs text-slate-500 mt-1">Reporte visual detallado con fotos del antes y después.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Preview / Action Section */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col justify-center items-center text-center">
              <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <FileText size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Reporte {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
              </h3>
              <p className="text-slate-500 max-w-sm mb-8">
                El sistema recopilará los datos de 
                <strong className="text-slate-700"> {activeTab} </strong> 
                del período seleccionado y generará un documento PDF listo para imprimir o descargar.
              </p>

              <button 
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full max-w-xs bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-3 shadow-md transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Procesando Datos...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Generar Reporte PDF
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
