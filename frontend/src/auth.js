export const getStoredAuth = () => {
  const user = localStorage.getItem('aerodrive_user');
  return {
    user: user ? JSON.parse(user) : null,
    access: localStorage.getItem('aerodrive_access'),
    refresh: localStorage.getItem('aerodrive_refresh'),
  };
};

export const setStoredAuth = ({ user, access, refresh }) => {
  localStorage.setItem('aerodrive_user', JSON.stringify(user));
  localStorage.setItem('aerodrive_access', access);
  localStorage.setItem('aerodrive_refresh', refresh);
};

export const clearStoredAuth = () => {
  localStorage.removeItem('aerodrive_user');
  localStorage.removeItem('aerodrive_access');
  localStorage.removeItem('aerodrive_refresh');
};

export const authHeaders = () => {
  const { access } = getStoredAuth();
  return access ? { Authorization: `Bearer ${access}` } : {};
};

export const requireAuth = () => Boolean(getStoredAuth().access);
