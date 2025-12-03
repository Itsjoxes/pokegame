// Lista de cuentas autorizadas para acceder al panel de admin
const ADMIN_ACCOUNTS = [
  'admin', // Cambiar por tus cuentas de admin reales
  'admin1',
  'neo005'
];

export function isAdminAccount(username) {
  if (!username) return false;
  return ADMIN_ACCOUNTS.includes(username.toLowerCase());
}

export function getAdminAccounts() {
  return ADMIN_ACCOUNTS;
}

export function addAdminAccount(username) {
  if (username && !ADMIN_ACCOUNTS.includes(username.toLowerCase())) {
    ADMIN_ACCOUNTS.push(username.toLowerCase());
    return true;
  }
  return false;
}

export function removeAdminAccount(username) {
  const idx = ADMIN_ACCOUNTS.findIndex(u => u.toLowerCase() === username.toLowerCase());
  if (idx !== -1) {
    ADMIN_ACCOUNTS.splice(idx, 1);
    return true;
  }
  return false;
}
