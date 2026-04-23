import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Página de Secciones — reemplazada por la gestión dentro de Administración.
 * Redirige a Administración para no generar pantalla huérfana.
 */
export const Secciones = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate('/administracion', { replace: true }); }, []);
  return null;
};
