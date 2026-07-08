import { makeToken } from './config';

const BASE_URL = '';

let _party: string | null = null;
let _token: string | null = null;

export const initLedger = (party: string) => {
  _party = party;
  _token = makeToken(party);
};

export const getParty = (): string => {
  if (!_party) throw new Error('Not logged in');
  return _party;
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${_token}`,
});

export const queryContracts = async (templateId: string): Promise<any[]> => {
  const response = await fetch(`${BASE_URL}/v2/state/active-contracts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      activeAtOffset: '',
      filter: {
        filtersByParty: {
          [_party!]: {
            cumulative: [{
              wildcardFilter: {}
            }]
          }
        }
      },
      verbose: true,
    }),
  });
  const text = await response.text();
  console.log('ACS raw response:', response.status, text.substring(0, 500));
  const lines = text.trim().split('\n').filter(Boolean);
  const contracts: any[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed?.activeContract?.createdEvent) {
        const event = parsed.activeContract.createdEvent;
        if (!templateId || event.templateId?.includes(templateId.split(':')[1])) {
          contracts.push(event);
        }
      }
    } catch {}
  }
  return contracts;
};

export const createContract = async (templateId: string, payload: object): Promise<any> => {
  const response = await fetch(`${BASE_URL}/v2/commands/submit-and-wait`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      commands: [{
        createCommand: {
          templateId,
          createArguments: payload,
        }
      }],
      actAs: [_party],
      readAs: [_party],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data;
};

export const exerciseChoice = async (
  templateId: string,
  contractId: string,
  choiceName: string,
  argument: object
): Promise<any> => {
  const response = await fetch(`${BASE_URL}/v2/commands/submit-and-wait`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      commands: [{
        exerciseCommand: {
          templateId,
          contractId,
          choice: choiceName,
          choiceArgument: argument,
        }
      }],
      actAs: [_party],
      readAs: [_party],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));
  return data;
};