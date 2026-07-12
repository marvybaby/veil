import { makeToken } from './config';

const DEVNET_PROXY = '/devnet';

let _party: string | null = null;
let _token: string | null = null;

export const initLedger = (party: string, token?: string) => {
  _party = party;
  _token = token || makeToken(party);
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
  const response = await fetch(`${DEVNET_PROXY}/v2/state/active-contracts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      activeAtOffset: 0,
      filter: {
        filtersByParty: {
          [_party!]: {
            cumulative: [{ wildcardFilter: {} }]
          }
        }
      },
      verbose: true,
    }),
  });
  const text = await response.text();
  console.log('ACS response:', response.status, text.substring(0, 300));
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
  const provider = getProvider();
  if (provider) {
    // Use Loop SDK provider to submit — it handles auth internally
    const result = await provider.submitAndWaitForTransaction({
      commandId: `cmd-${Date.now()}`,
      commands: [{
        CreateCommand: {
          templateId,
          createArguments: payload,
        }
      }],
      actAs: [_party],
      readAs: [_party],
    });
    console.log('CREATE via Loop SDK:', result);
    return result;
  }
  // Fallback to direct API
  const response = await fetch(`${DEVNET_PROXY}/v2/commands/submit-and-wait`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      commandId: `cmd-${Date.now()}`,
      commands: [{ CreateCommand: { templateId, createArguments: payload } }],
      actAs: [_party],
      readAs: [_party],
    }),
  });
  const text = await response.text();
  console.log('CREATE response:', response.status, text.substring(0, 300));
  if (!response.ok) throw new Error(text);
  return JSON.parse(text);
};

export const exerciseChoice = async (
  templateId: string,
  contractId: string,
  choiceName: string,
  argument: object
): Promise<any> => {
  const provider = getProvider();
  if (provider) {
    const result = await provider.submitAndWaitForTransaction({
      commandId: `cmd-${Date.now()}`,
      commands: [{
        ExerciseCommand: {
          templateId,
          contractId,
          choice: choiceName,
          choiceArgument: argument,
        }
      }],
      actAs: [_party],
      readAs: [_party],
    });
    console.log('EXERCISE via Loop SDK:', result);
    return result;
  }
  const response = await fetch(`${DEVNET_PROXY}/v2/commands/submit-and-wait`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      commandId: `cmd-${Date.now()}`,
      commands: [{ ExerciseCommand: { templateId, contractId, choice: choiceName, choiceArgument: argument } }],
      actAs: [_party],
      readAs: [_party],
    }),
  });
  const text = await response.text();
  console.log('EXERCISE response:', response.status, text.substring(0, 300));
  if (!response.ok) throw new Error(text);
  return JSON.parse(text);
};
export const getProvider = (): any => {
  return (window as any).__veilAuth?.provider || null;
};