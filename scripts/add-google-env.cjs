/**
 * Add GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET to Vercel Production.
 * Reads the Google client_secret JSON from Downloads in-memory, pushes values
 * directly to the Vercel API (sensitive/encrypted), prints verdicts only.
 * Never prints, never stores the secret on disk.
 */
const fs = require('fs');

const PROJECT = 'prj_XAPaMLJtUlXPMKBz1WJWgF2jEdin';
const TEAM = 'team_ENxUZq5el15Zn8pi4ahZMXpz';

(async () => {
  const auth = JSON.parse(fs.readFileSync(process.env.APPDATA + '/xdg.data/com.vercel.cli/auth.json', 'utf8'));
  const token = auth.token;

  const dl = process.env.USERPROFILE + '/Downloads';
  const f = fs.readdirSync(dl).find((n) => /^client_secret_.*\.json$/.test(n));
  if (!f) { console.log(JSON.stringify({ ERROR: 'client_secret json not found in Downloads' })); process.exit(1); }
  const j = JSON.parse(fs.readFileSync(dl + '/' + f, 'utf8'));
  const web = j.web || j.installed;
  const clientId = web && web.client_id;
  const clientSecret = web && web.client_secret;
  if (!clientId || !clientSecret) { console.log(JSON.stringify({ ERROR: 'client_id/client_secret missing in json' })); process.exit(1); }

  const log = { FILE_FOUND: 'YES (name withheld)', ID_SHAPE_OK: clientId.endsWith('.apps.googleusercontent.com') };

  async function addEnv(key, value, type) {
    const r = await fetch(`https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM}`, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, type, target: ['production'] }),
    });
    const body = await r.json().catch(() => ({}));
    return { key, http: r.status, created: r.status === 200 || (body && !body.error) };
  }

  log.ID_ADD = await addEnv('GOOGLE_CLIENT_ID', clientId, 'encrypted');
  log.SECRET_ADD = await addEnv('GOOGLE_CLIENT_SECRET', clientSecret, 'sensitive');

  // metadata-only verification
  const list = await (await fetch(`https://api.vercel.com/v10/projects/${PROJECT}/env?teamId=${TEAM}&decrypt=false`, {
    headers: { Authorization: 'Bearer ' + token },
  })).json();
  const names = list.envs.map((e) => e.key);
  log.ID_PRESENT = names.includes('GOOGLE_CLIENT_ID');
  log.SECRET_PRESENT = names.includes('GOOGLE_CLIENT_SECRET');
  log.SECRET_TYPE = (list.envs.find((e) => e.key === 'GOOGLE_CLIENT_SECRET') || {}).type;

  console.log(JSON.stringify(log, null, 1));
  process.exit(log.ID_PRESENT && log.SECRET_PRESENT ? 0 : 1);
})().catch((e) => { console.log(JSON.stringify({ ERROR: e.message })); process.exit(1); });
