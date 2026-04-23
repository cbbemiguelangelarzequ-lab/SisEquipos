import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal = ({
  isOpen,
  title = "Confirmar Eliminación",
  message,
  onConfirm,
  onCancel,
  isDeleting = false
}: ConfirmDeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden fade-in relative">
        <button 
          onClick={onCancel} 
          disabled={isDeleting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="p-6 pt-8 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
            <AlertTriangle size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            {message}
          </p>
          
          <div className="flex gap-3">
            <button 
              onClick={onCancel} 
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm} 
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm shadow-red-200"
            >
              {isDeleting ? (
                'Eliminando...'
              ) : (
                <>
                  <Trash2 size={18} />
                  Eliminar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
