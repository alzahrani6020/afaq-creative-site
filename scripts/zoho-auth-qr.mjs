import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const [clientId, redirectUri, state = 'afaq-zoho-setup', accountsDomain = 'accounts.zoho.com'] = process.argv.slice(2);

if (!clientId || !redirectUri) {
  console.error('Usage: node scripts/zoho-auth-qr.mjs <CLIENT_ID> <REDIRECT_URI> [STATE] [ACCOUNTS_DOMAIN]');
  console.error('Example: node scripts/zoho-auth-qr.mjs 1000.xxx https://afaq-global.com/api/admin/zoho/callback');
  process.exit(1);
}

const scopes = 'ZohoMail.messages.CREATE,ZohoMail.accounts.READ';
const authUrl = new URL(`https://${accountsDomain}/oauth/v2/auth`);
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('scope', scopes);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');
authUrl.searchParams.set('state', state);

const outputPath = path.resolve(process.cwd(), 'zoho-auth-qr.png');

QRCode.toFile(outputPath, authUrl.toString(), { width: 400, margin: 2 }, (err) => {
  if (err) {
    console.error('Failed to generate QR code:', err.message);
    process.exit(1);
  }
  console.log('Authorization URL:');
  console.log(authUrl.toString());
  console.log('\nQR code saved to:');
  console.log(outputPath);
  console.log('\nScan the QR code with a device logged into info@bonds-global.com to authorize.');
});
