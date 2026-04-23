export const getUserInfo = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    return decodedPayload; // Should have { id, email, rol, centro_id, centro_nombre }
  } catch (error) {
    return null;
  }
};
