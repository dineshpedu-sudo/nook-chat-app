export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password) {
  // Minimum 8 characters for this starter project.
  // For production, also consider checking against known-breached password lists.
  return typeof password === 'string' && password.length >= 8;
}

export function isValidUsername(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9_]{3,20}$/.test(username);
}
