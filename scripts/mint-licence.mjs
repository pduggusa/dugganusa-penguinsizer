#!/usr/bin/env node
/* Mint a signed licence key for the AI Factory Sizer.
 *
 * There is no database. A key IS the licence: an HMAC-SHA256 signature over a JSON
 * payload, verified offline by the Worker. Stripe payment link -> run this -> email
 * the key. Revocation is adding the id to the Worker's LICENCE_DENY secret.
 *
 *   node scripts/mint-licence.mjs --name "Acme Partners" --tier partner --years 1
 *
 * The signing secret lives in Azure Key Vault as `penguinsizer-licence-secret` and is
 * read from there, never passed on argv. */
import { createHmac, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const arg = (f, d) => { const i = process.argv.indexOf('--' + f); return i > -1 ? process.argv[i + 1] : d; };
const name = arg('name'), tier = arg('tier', 'practitioner'), years = parseFloat(arg('years', '1'));
if (!name) { console.error('Usage: --name "Licensee" [--tier practitioner|partner|project|oem] [--years 1]'); process.exit(1); }

const secret = execFileSync('az', ['keyvault', 'secret', 'show', '--vault-name', 'dugganusa-kv-prod',
  '--name', 'penguinsizer-licence-secret', '--query', 'value', '-o', 'tsv'], { encoding: 'utf8' }).trim();
if (!secret) { console.error('Could not read penguinsizer-licence-secret from Key Vault.'); process.exit(1); }

const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const payload = { id: randomUUID().slice(0, 8), name, tier, exp: Math.floor(Date.now() / 1000 + years * 31557600) };
const body = b64u(JSON.stringify(payload));
const sig = b64u(createHmac('sha256', secret).update(body).digest());

console.log('\nLicensee : ' + name);
console.log('Tier     : ' + tier);
console.log('Expires  : ' + new Date(payload.exp * 1000).toISOString().slice(0, 10));
console.log('Key id   : ' + payload.id + '   (add to LICENCE_DENY to revoke)');
console.log('\nKEY:\n' + body + '.' + sig + '\n');
