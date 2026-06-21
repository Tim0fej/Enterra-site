import Database from 'better-sqlite3';

const db = new Database('./data/enterra.db');
try {
  console.log('tiers', db.prepare('SELECT * FROM privilege_tiers').all());
  console.log('priv count', db.prepare('SELECT COUNT(*) as c FROM user_privileges').get());
  console.log('admins', db.prepare("SELECT id, username, role FROM users WHERE role = 'admin'").all());
} catch (e) {
  console.error('DB ERROR:', e.message);
}
