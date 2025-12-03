import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as admin from '../src/app/utils/adminAccess.js';
import * as cookies from '../src/app/utils/cookies.js';

describe('adminAccess utilities', () => {
  let originalAdmins;
  beforeEach(() => {
    // snapshot current admin accounts
    originalAdmins = admin.getAdminAccounts().slice();
  });
  afterEach(() => {
    // restore original list
    const list = admin.getAdminAccounts();
    // remove extras
    list.length = 0;
    originalAdmins.forEach((u) => list.push(u));
  });

  // Verifica que `isAdminAccount` reconoce cuentas admin (insensible a mayúsculas)
  it('recognizes default admin account (case-insensitive)', () => {
    // default in file includes 'admin'
    expect(admin.isAdminAccount('admin')).toBe(true);
    expect(admin.isAdminAccount('ADMIN')).toBe(true);
    expect(admin.isAdminAccount('notanadmin')).toBe(false);
  });

  // Comprueba que `addAdminAccount` añade una cuenta y `isAdminAccount` la reconoce
  it('can add an admin account and recognize it', () => {
    const added = admin.addAdminAccount('TestUser');
    expect(added).toBe(true);
    expect(admin.isAdminAccount('testuser')).toBe(true);
    // adding again returns false
    expect(admin.addAdminAccount('TestUser')).toBe(false);
  });

  // Verifica que `removeAdminAccount` elimina una cuenta previamente añadida
  it('can remove an admin account', () => {
    // add then remove
    admin.addAdminAccount('tempadmin');
    expect(admin.isAdminAccount('tempadmin')).toBe(true);
    const removed = admin.removeAdminAccount('tempadmin');
    expect(removed).toBe(true);
    expect(admin.isAdminAccount('tempadmin')).toBe(false);
  });
});

describe('cookie helpers (jsdom)', () => {
  beforeEach(() => {
    // Ensure a document exists (some test runners use node env)
    if (typeof document === 'undefined') {
      global.document = { cookie: '' };
    }
    // clear cookies
    const raw = document.cookie || '';
    raw.split(';').forEach((c) => {
      const name = (c || '').split('=')[0].trim();
      if (name) document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    });
  });

  // Asegura que `setCookie` escribe y `getCookie` lee el valor correctamente
  it('sets and gets a cookie', () => {
    cookies.setCookie('foo', 'bar', 1);
    expect(cookies.getCookie('foo')).toBe('bar');
  });

  // Comprueba que `removeCookie` elimina la cookie (resultado falsy: null o '')
  it('removes a cookie', () => {
    cookies.setCookie('toRemove', 'value', 1);
    expect(cookies.getCookie('toRemove')).toBe('value');
    cookies.removeCookie('toRemove');
    // Some environments represent removed cookies as empty string, others as null
    expect(!!cookies.getCookie('toRemove')).toBe(false);
  });
});
