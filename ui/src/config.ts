import { encode } from 'jwt-simple';

export const LEDGER_API_URL = 'http://localhost:7575';

export const makeToken = (party: string): string => {
  const payload = {
    sub: party,
    scope: 'daml_ledger_api',
    act: { sub: party },
    aud: 'https://daml.com/ledger-api',
  };
  return encode(payload, 'secret', 'HS256');
};