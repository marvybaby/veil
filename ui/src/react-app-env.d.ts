/// <reference types="react-scripts" />

interface Window {
  __loopSdk: any;
  __veilAuth: {
    partyId: string;
    provider: any;
  } | undefined;
}