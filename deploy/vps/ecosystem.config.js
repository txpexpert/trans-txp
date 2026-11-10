// deploy/vps/ecosystem.config.js
// ─────────────────────────────────────────────────────────────────────────────
// Processus pm2 du VPS : la production (port 3000) et la démo (port 3001).
// Chaque processus tourne depuis /srv/ixp/<env>/current, lien vers la version
// en ligne (voir deploy.sh). nginx est le seul point d'entrée public.
// ─────────────────────────────────────────────────────────────────────────────
const app = (env, port) => ({
  name: `ixp-${env}`,
  cwd: `/srv/ixp/${env}/current`,
  script: 'node_modules/next/dist/bin/next',
  args: `start -p ${port} -H 127.0.0.1`,
  exec_mode: 'fork',
  instances: 1,
  max_memory_restart: env === 'prod' ? '1200M' : '700M',
  out_file: `/var/log/ixp/${env}.out.log`,
  error_file: `/var/log/ixp/${env}.err.log`,
  time: true,
  env: { NODE_ENV: 'production', PORT: String(port) },
})

module.exports = {
  apps: [app('prod', 3000), app('demo', 3001)],
}
