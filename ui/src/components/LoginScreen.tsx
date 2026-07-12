import React, { useState } from 'react';
import { Button, Grid, Header, Message, Segment } from 'semantic-ui-react';
import { initLedger } from '../ledgerService';
import { Credentials } from '../Credentials';
import { makeToken } from '../config';

type Props = {
  onLogin: (credentials: Credentials, role: string) => void;
};

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState('');
  const [walletParty, setWalletParty] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [error, setError] = useState('');

  const handleConnectWallet = async () => {
  setLoading(true);
  setError('');
  try {
    // @ts-ignore
    const { loop } = window.__loopSdk || {};
    if (!loop) throw new Error('Wallet not ready. Please refresh and try again.');
    await loop.init({
      appName: 'Veil',
      network: 'devnet',
      onAccept: (provider: any) => {
  console.log('Loop onAccept provider:', JSON.stringify(provider));
  const partyId = provider.party_id;
  setWalletParty(partyId);
  setWalletConnected(true);
  setLoading(false);
  // Store the full provider — we'll use provider.submitTransaction for writes
  // and provider.getActiveContracts for reads
  window.__veilAuth = { partyId, provider };
},
      onReject: () => {
        setError('Wallet connection was rejected.');
        setLoading(false);
      },
    });
    await loop.connect();
  } catch (e: any) {
    setError(e.message ?? 'Connection failed. Please try again.');
    setLoading(false);
  }
};

  const handleRoleSelect = async (role: string) => {
  setLoading(true);
  setActiveRole(role);
  try {
    const auth = window.__veilAuth;
    const party = walletConnected && auth ? auth.partyId : role;
    // Get the real auth token from the provider if available
    const realToken = auth?.provider?.auth_token;
    initLedger(party, realToken);
    const finalToken = realToken || makeToken(party);
    onLogin({
      party,
      token: finalToken,
      user: { userId: party, primaryParty: party },
    }, role);
  } catch (e: any) {
    setError('Something went wrong. Please try again.');
  }
  setLoading(false);
};
  return (
    <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
      <Grid.Column style={{ maxWidth: 460 }}>
        <Header as='h1' textAlign='center'>
          🔐 Veil
          <Header.Subheader>
            Confidential Invoice Financing on Canton
          </Header.Subheader>
        </Header>

        {error && (
          <Message negative onDismiss={() => setError('')}>{error}</Message>
        )}

        {!walletConnected ? (
          <Segment>
            <Header as='h3'>Sign in to get started</Header>
            <p style={{ color: 'grey', marginBottom: '1.5em' }}>
              Connect your Loop wallet to access the platform.
            </p>
            <Button
              fluid
              size='large'
              style={{ backgroundColor: '#0d9488', color: 'white', marginBottom: '1em' }}
              loading={loading}
              onClick={handleConnectWallet}
            >
              🔗 Connect Loop Wallet
            </Button>
            <p style={{ color: '#aaa', fontSize: '0.8em' }}>
              Don't have a Loop wallet?{' '}
              <a href='https://devnet.cantonloop.com' target='_blank' rel='noreferrer'>
                Create one here
              </a>
            </p>
          </Segment>
        ) : (
          <Segment>
            <Message positive size='small'>
              <strong>Wallet connected ✓</strong>
              <p style={{ fontSize: '0.8em', wordBreak: 'break-all', marginTop: '0.3em' }}>
                {walletParty}
              </p>
            </Message>

            <Header as='h3'>What's your role?</Header>
            <p style={{ color: 'grey', marginBottom: '1.5em' }}>
              Choose how you want to use Veil.
            </p>

            <Button
              fluid
              size='large'
              primary
              style={{ marginBottom: '0.75em' }}
              loading={loading && activeRole === 'Supplier'}
              onClick={() => handleRoleSelect('Supplier')}
            >
              📄 Supplier
              <div style={{ fontSize: '0.8em', fontWeight: 'normal', marginTop: '0.2em' }}>
                I want to finance my invoices
              </div>
            </Button>

            <Button
              fluid
              size='large'
              secondary
              style={{ marginBottom: '0.75em' }}
              loading={loading && activeRole === 'Financier'}
              onClick={() => handleRoleSelect('Financier')}
            >
              💰 Financier
              <div style={{ fontSize: '0.8em', fontWeight: 'normal', marginTop: '0.2em' }}>
                I want to fund invoices and earn returns
              </div>
            </Button>

            <Button
              fluid
              size='large'
              style={{ marginBottom: '0.75em', backgroundColor: '#7c3aed', color: 'white' }}
              loading={loading && activeRole === 'Buyer'}
              onClick={() => handleRoleSelect('Buyer')}
            >
              🏢 Buyer
              <div style={{ fontSize: '0.8em', fontWeight: 'normal', marginTop: '0.2em' }}>
                I want to view and settle my invoices
              </div>
            </Button>
          </Segment>
        )}
      </Grid.Column>
    </Grid>
  );
};

export default LoginScreen;