import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Settings, Users, BookOpen, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { getUserInfo } from '../services/auth';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface CatItem { id: number; nombre: string; }
interface UsuarioItem { id: number; nombre: string; email: string; rol?: any; centro?: any; }

const CatalogCard = ({ title, items, count, endpoint, onSaved }: { title: string; items: CatItem[]; count: number; endpoint: string; onSaved: () => void; }) => {
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, id: number | null, isLoading: boolean}>({isOpen: false, id: null, isLoading: false});

  const handleAdd = async () => {
    if (!input.trim()) return;
    setSaving(true);
    try {
      await api.post(endpoint, { nombre: input.trim() });
      setInput('');
      onSaved();
    } catch (e) {
      alert('Error al agregar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteModalState({ isOpen: true, id, isLoading: false });
  };

  const handleEditClick = (item: CatItem) => {
    setEditingId(item.id);
    setEditValue(item.nombre);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editValue.trim()) { setEditingId(null); return; }
    try {
      await api.put(`${endpoint}/${id}`, { nombre: editValue.trim() });
      setEditingId(null);
      onSaved();
    } catch {
      alert('Error al guardar edición.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <BookOpen size={18} className="text-brand-600" />
          {title}
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-2.5 py-1 rounded-full">{count} reg</span>
      </div>
      <div className="max-h-[250px] overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="flex justify-between items-center px-5 py-3 border-b border-slate-50 hover:bg-slate-50 group">
            {editingId === item.id ? (
              <div className="flex flex-1 gap-2 items-center">
                <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' ? handleSaveEdit(item.id) : e.key === 'Escape' ? setEditingId(null) : null} className="flex-1 bg-white border border-brand-500 text-slate-800 rounded-md px-2 py-1 text-sm outline-none shadow-sm" />
                <button onClick={() => handleSaveEdit(item.id)} className="text-emerald-600 hover:text-emerald-700 p-1"><Check size={16} /></button>
                <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-700 p-1"><X size={16} /></button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium text-slate-700">{item.nombre}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditClick(item)} className="text-slate-400 hover:text-blue-600 p-1 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteTrigger(item.id)} className="text-slate-400 hover:text-red-500 p-1 transition-colors"><Trash2 size={14} /></button>
                </div>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="px-5 py-6 text-sm text-slate-400 italic text-center">Sin registros</p>}
      </div>
      <div className="flex px-4 py-3 gap-2 border-t border-slate-100 bg-white">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Agregar nuevo..." className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-brand-500 transition-colors" />
        <button onClick={handleAdd} disabled={saving || !input.trim()} className={`bg-brand-600 hover:bg-brand-700 text-white border-none rounded-lg px-3 py-2 flex items-center transition-colors ${saving || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
          <Plus size={18} />
        </button>
      </div>
      
      <ConfirmDeleteModal 
        isOpen={deleteModalState.isOpen}
        title="Eliminar Registro"
        message="¿Estás seguro de eliminar este registro del catálogo? Esta acción no se puede deshacer."
        isDeleting={deleteModalState.isLoading}
        onCancel={() => setDeleteModalState(prev => ({...prev, isOpen: false}))}
        onConfirm={async () => {
          setDeleteModalState(prev => ({...prev, isLoading: true}));
          try {
            await api.delete(`${endpoint}/${deleteModalState.id}`);
            onSaved();
            setDeleteModalState(prev => ({...prev, isOpen: false, isLoading: false}));
          } catch {
            alert('No se pudo eliminar el registro, puede que esté actualmente en uso por otro módulo.');
            setDeleteModalState(prev => ({...prev, isLoading: false}));
          }
        }}
      />
    </div>
  );
};

const SeccionesCard = ({ items, centros, endpoint, onSaved, isSuperUser, userCentroId }: { items: any[], centros: any[], endpoint: string, onSaved: () => void, isSuperUser: boolean, userCentroId: number | null }) => {
  const [input, setInput] = useState('');
  const [selectedCentro, setSelectedCentro] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, id: number | null, isLoading: boolean}>({isOpen: false, id: null, isLoading: false});

  // Filtrar items basado en el rol y selección
  const filteredItems = isSuperUser
    ? (selectedCentro ? items.filter((i: any) => i.centro?.id === Number(selectedCentro)) : items)
    : items.filter((i: any) => i.centro?.id === userCentroId);

  const displayCount = filteredItems.length;

  const handleAdd = async () => {
    if (!input.trim()) return;
    if (isSuperUser && !selectedCentro) {
      alert('Por favor, selecciona un centro antes de agregar una sección.');
      return;
    }
    
    setSaving(true);
    try {
      const payload: any = { nombre: input.trim() };
      
      const targetCentroId = isSuperUser ? selectedCentro : userCentroId;
      if (targetCentroId) {
         payload.centro = `/api/centros/${targetCentroId}`;
      }
      
      await api.post(endpoint, payload);
      setInput('');
      onSaved();
    } catch (e) {
      alert('Error al agregar la sección.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteModalState({ isOpen: true, id, isLoading: false });
  };

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setEditValue(item.nombre);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editValue.trim()) { setEditingId(null); return; }
    try {
      await api.patch(`${endpoint}/${id}`, { nombre: editValue.trim() }, {
        headers: { 'Content-Type': 'application/merge-patch+json' }
      });
      setEditingId(null);
      onSaved();
    } catch {
      alert('Error al guardar edición.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md col-span-full xl:col-span-1">
      <div className="flex flex-col border-b border-slate-100 bg-slate-50">
        <div className="flex justify-between items-center px-5 py-4">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <BookOpen size={18} className="text-brand-600" />
            Secciones por Centro
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-2.5 py-1 rounded-full">{displayCount} reg</span>
        </div>
        
        {isSuperUser && (
          <div className="px-5 pb-3">
             <select 
               value={selectedCentro} 
               onChange={(e) => setSelectedCentro(e.target.value)}
               className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none bg-white focus:border-brand-500"
             >
               <option value="">Vista Global (Todos los Centros)</option>
               {centros.map((c: any) => (
                 <option key={c.id} value={c.id}>{c.nombre}</option>
               ))}
             </select>
          </div>
        )}
      </div>

      <div className="max-h-[250px] overflow-y-auto">
        {filteredItems.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center px-5 py-3 border-b border-slate-50 hover:bg-slate-50 group">
            {editingId === item.id ? (
              <div className="flex flex-1 gap-2 items-center">
                <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' ? handleSaveEdit(item.id) : e.key === 'Escape' ? setEditingId(null) : null} className="flex-1 bg-white border border-brand-500 text-slate-800 rounded-md px-2 py-1 text-sm outline-none shadow-sm" />
                <button onClick={() => handleSaveEdit(item.id)} className="text-emerald-600 hover:text-emerald-700 p-1"><Check size={16} /></button>
                <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-700 p-1"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex flex-col flex-1 truncate pr-2">
                <span className="text-sm font-medium text-slate-700 truncate">{item.nombre}</span>
                {isSuperUser && !selectedCentro && item.centro && (
                   <span className="text-[10px] text-brand-600 font-semibold truncate">{item.centro.nombre}</span>
                )}
                {isSuperUser && !selectedCentro && !item.centro && (
                   <span className="text-[10px] text-slate-400 font-semibold italic">Global (Sin centro)</span>
                )}
              </div>
            )}
            
            {editingId !== item.id && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditClick(item)} className="text-slate-400 hover:text-blue-600 p-1 transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => handleDeleteTrigger(item.id)} className="text-slate-400 hover:text-red-500 p-1 transition-colors"><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        ))}
        {filteredItems.length === 0 && <p className="px-5 py-6 text-sm text-slate-400 italic text-center">Sin secciones registradas</p>}
      </div>

      <div className="flex px-4 py-3 gap-2 border-t border-slate-100 bg-white">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleAdd()} 
          placeholder={isSuperUser && !selectedCentro ? "Selecciona un centro arriba..." : "Agregar sección..."}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
          disabled={isSuperUser && !selectedCentro}
        />
        <button 
          onClick={handleAdd} 
          disabled={saving || !input.trim() || (isSuperUser && !selectedCentro)} 
          className={`bg-brand-600 hover:bg-brand-700 text-white border-none rounded-lg px-3 py-2 flex items-center transition-colors ${saving || !input.trim() || (isSuperUser && !selectedCentro) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Plus size={18} />
        </button>
      </div>

      <ConfirmDeleteModal 
        isOpen={deleteModalState.isOpen}
        title="Eliminar Sección"
        message="¿Estás seguro de eliminar esta sección? Esta acción no se puede deshacer."
        isDeleting={deleteModalState.isLoading}
        onCancel={() => setDeleteModalState(prev => ({...prev, isOpen: false}))}
        onConfirm={async () => {
          setDeleteModalState(prev => ({...prev, isLoading: true}));
          try {
            await api.delete(`${endpoint}/${deleteModalState.id}`);
            onSaved();
            setDeleteModalState(prev => ({...prev, isOpen: false, isLoading: false}));
          } catch {
            alert('No se pudo eliminar, puede que la sección esté actualmente en uso.');
            setDeleteModalState(prev => ({...prev, isLoading: false}));
          }
        }}
      />
    </div>
  );
};

const UsuariosTabView = () => {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [centros, setCentros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuperUser, setIsSuperUser] = useState(false);

  const [formData, setFormData] = useState({ id: null as null|number, nombre: '', email: '', password: '', rol: '', centro: '' });
  const [deleteModalState, setDeleteModalState] = useState<{isOpen: boolean, id: number | null, isLoading: boolean}>({isOpen: false, id: null, isLoading: false});

  useEffect(() => { fetchUsersAndData(); }, []);

  const fetchUsersAndData = async () => {
    try {
      const [uRes, rRes, cRes] = await Promise.all([ api.get('/usuarios'), api.get('/rols'), api.get('/centros') ]);
      setUsuarios(uRes.data['hydra:member'] || uRes.data || []);
      setRoles(rRes.data['hydra:member'] || rRes.data || []);
      setCentros(cRes.data['hydra:member'] || cRes.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { nombre: formData.nombre, email: formData.email, rol: `/api/rols/${formData.rol}` };
      if (formData.password) payload.password = formData.password;
      
      // Si no es super usuario, exige un centro, si lo es, lo deja nulo
      if (!isSuperUser && formData.centro) {
        payload.centro = `/api/centros/${formData.centro}`;
      } else {
        payload.centro = null;
      }

      if (formData.id) {
        await api.patch(`/usuarios/${formData.id}`, payload, { headers: { 'Content-Type': 'application/merge-patch+json' } });
      } else {
        await api.post('/usuarios', payload);
      }
      setIsModalOpen(false);
      fetchUsersAndData();
    } catch (e) {
      alert("Error guardando el usuario. Verifica el email (puede que ya exista).");
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeleteModalState({ isOpen: true, id, isLoading: false });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Directorio de Usuarios</h2>
        <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
          onClick={() => { 
            setIsSuperUser(false); 
            setFormData({ id: null, nombre: '', email: '', password: '', rol: '', centro: '' }); 
            setIsModalOpen(true); 
          }}
        >
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-medium text-sm">
              <th className="py-3 px-4">Nombre</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Centro</th>
              <th className="py-3 px-4">Rol</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="py-6 text-center text-slate-500">Cargando...</td></tr> : 
             usuarios.length === 0 ? <tr><td colSpan={5} className="py-6 text-center text-slate-500">No hay usuarios</td></tr> :
             usuarios.map(u => (
               <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                 <td className="py-3 px-4 font-semibold text-slate-800">{u.nombre}</td>
                 <td className="py-3 px-4 text-slate-600">{u.email}</td>
                 <td className="py-3 px-4">
                    {u.centro?.nombre ? (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">{u.centro.nombre}</span>
                    ) : u.rol?.nombre?.toLowerCase().includes('super') ? (
                      <span className="bg-brand-100 text-brand-700 px-2 py-1 rounded-md text-xs font-semibold">SuperUsuario (Global)</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-400 px-2 py-1 rounded-md text-xs font-semibold italic">Sin centro</span>
                    )}
                  </td>
                 <td className="py-3 px-4 text-slate-600">{u.rol?.nombre}</td>
                 <td className="py-3 px-4 flex justify-center gap-2">
                    <button className="text-blue-500 hover:text-blue-700" onClick={() => {
                      const hasCentro = !!u.centro;
                      setIsSuperUser(!hasCentro);
                      setFormData({ 
                        id: u.id, nombre: u.nombre, email: u.email, password: '', 
                        rol: u.rol?.id?.toString() || (u.rol ? u.rol.split('/').pop() : ''), 
                        centro: u.centro?.id?.toString() || (u.centro ? u.centro.split('/').pop() : '') 
                      });
                      setIsModalOpen(true);
                    }}><Edit2 size={18} /></button>
                    <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteTrigger(u.id)}><Trash2 size={18} /></button>
                 </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden" onSubmit={handleSave}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">{formData.id ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña {formData.id && <span className="font-normal text-xs text-slate-400">(Dejar vacío para no cambiar)</span>}</label>
                <input required={!formData.id} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-brand-700 bg-brand-50 p-2 rounded-lg cursor-pointer border border-brand-100">
                    <input type="checkbox" checked={isSuperUser} onChange={(e) => setIsSuperUser(e.target.checked)} className="accent-brand-600 w-4 h-4 cursor-pointer" />
                    Hacer a esta cuenta SúperUsuario
                  </label>
                  {isSuperUser && <p className="text-xs text-brand-600 mt-1 pl-1">Esta cuenta podrá ver y administrar todos los Centros, roles y usuarios.</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Rol</label>
                  <select required value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white">
                    <option value="">Seleccionar</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Centro Físico</label>
                  <select required={!isSuperUser} disabled={isSuperUser} value={formData.centro} onChange={e => setFormData({...formData, centro: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white disabled:opacity-50 disabled:bg-slate-100">
                    <option value="">{isSuperUser ? 'Global (Todos)' : 'Seleccionar'}</option>
                    {!isSuperUser && centros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700">Guardar</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDeleteModal 
        isOpen={deleteModalState.isOpen}
        title="Eliminar Cuenta de Usuario"
        message="¿Estás seguro de eliminar permanentemente el acceso y todos los datos de este usuario? Esta acción no se puede deshacer."
        isDeleting={deleteModalState.isLoading}
        onCancel={() => setDeleteModalState(prev => ({...prev, isOpen: false}))}
        onConfirm={async () => {
          setDeleteModalState(prev => ({...prev, isLoading: true}));
          try {
            await api.delete(`/usuarios/${deleteModalState.id}`);
            fetchUsersAndData();
            setDeleteModalState(prev => ({...prev, isOpen: false, isLoading: false}));
          } catch {
            alert('No se pudo eliminar el usuario, puede que tenga registros vinculados.');
            setDeleteModalState(prev => ({...prev, isLoading: false}));
          }
        }}
      />
    </div>
  );
};

export const Administracion = () => {
  const user = getUserInfo();
  const isSuperUser = !user?.centro_id;
  const [tab, setTab] = useState<'usuarios' | 'catalogos'>(isSuperUser ? 'usuarios' : 'catalogos');

  const [categorias, setCategorias] = useState<CatItem[]>([]);
  const [estados, setEstados] = useState<CatItem[]>([]);
  const [secciones, setSecciones] = useState<CatItem[]>([]);
  const [tiposComponente, setTiposComponente] = useState<CatItem[]>([]);
  const [centros, setCentros] = useState<CatItem[]>([]);
  const [rolesCat, setRolesCat] = useState<CatItem[]>([]);

  const fetchAll = async () => {
    try {
      const ctRes = await api.get('/centros?pagination=false');
      const cRes = await api.get('/categoria_equipos?pagination=false');
      const eRes = await api.get('/estado_equipos?pagination=false');
      const sRes = await api.get('/seccions?pagination=false');
      const tRes = await api.get('/tipo_componentes?pagination=false');
      const rRes = await api.get('/rols?pagination=false');
      
      setCentros(ctRes.data['hydra:member'] || ctRes.data || []);
      setCategorias(cRes.data['hydra:member'] || cRes.data || []);
      setEstados(eRes.data['hydra:member'] || eRes.data || []);
      setSecciones(sRes.data['hydra:member'] || sRes.data || []);
      setTiposComponente(tRes.data['hydra:member'] || tRes.data || []);
      setRolesCat(rRes.data['hydra:member'] || rRes.data || []);
    } catch (err) {
      console.error('Error cargando catálogos:', err);
    }
  };

  useEffect(() => { if (tab === 'catalogos') fetchAll(); }, [tab]);

  return (
    <div className="fade-in pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Settings className="text-brand-600" size={32} /> Central de Configuración
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Gestión de parámetros del sistema y catálogos globales.</p>
      </div>

      <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-xl w-max border border-slate-200 shadow-sm">
        {isSuperUser && (
          <button onClick={() => setTab('usuarios')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${tab === 'usuarios' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Users size={18} /> Cuentas y Accesos
          </button>
        )}
        <button onClick={() => setTab('catalogos')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${tab === 'catalogos' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <BookOpen size={18} /> Catálogos Base (Maestros)
        </button>
      </div>

      {tab === 'usuarios' && isSuperUser ? (
        <UsuariosTabView />
      ) : (
        <div className="fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SeccionesCard items={secciones} centros={centros} endpoint="/seccions" onSaved={fetchAll} isSuperUser={isSuperUser} userCentroId={user?.centro_id || null} />
            <CatalogCard title="Categorías de Equipo" items={categorias} count={categorias.length} endpoint="/categoria_equipos" onSaved={fetchAll} />
            <CatalogCard title="Estados de Equipo" items={estados} count={estados.length} endpoint="/estado_equipos" onSaved={fetchAll} />
            <CatalogCard title="Tipos de Componente" items={tiposComponente} count={tiposComponente.length} endpoint="/tipo_componentes" onSaved={fetchAll} />
            
            {/* Solo SúperUsuarios ven los catálogos de permisos y centros físicos */}
            {isSuperUser && (
               <>
                 <CatalogCard title="Centros Físicos" items={centros} count={centros.length} endpoint="/centros" onSaved={fetchAll} />
                 <CatalogCard title="Roles de Usuario" items={rolesCat} count={rolesCat.length} endpoint="/rols" onSaved={fetchAll} />
               </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
