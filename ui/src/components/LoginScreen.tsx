import React, { useState } from 'react';
import { Button, Grid, Header, Segment } from 'semantic-ui-react';
import { initLedger } from '../ledgerService';
import { Credentials } from '../Credentials';
import { makeToken } from '../config';

type Props = {
  onLogin: (credentials: Credentials) => void;
};

const LOGIN_PARTIES = ['Supplier', 'Buyer', 'Financier1', 'Financier2', 'Operator'];

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [activeParty, setActiveParty] = useState('');

  const handleLogin = async (party: string) => {
    setLoading(true);
    setActiveParty(party);
    try {
      initLedger(party);
      const token = makeToken(party);
      onLogin({
        party,
        token,
        user: { userId: party, primaryParty: party },
      });
    } catch (e) {
      alert(`Login error: ${JSON.stringify(e)}`);
    }
    setLoading(false);
  };

  return (
    <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header as='h1' textAlign='center'>
          🔐 Veil
          <Header.Subheader>
            Confidential Invoice Financing on Canton
          </Header.Subheader>
        </Header>

        <Segment>
          <Header as='h4'>Select your role to log in</Header>
          <p style={{ color: 'grey', fontSize: '0.9em' }}>
            Each party sees only what Canton's privacy model allows.
          </p>

          {LOGIN_PARTIES.map(p => (
            <Button
              key={p}
              fluid
              primary={p === 'Supplier'}
              secondary={p.startsWith('Financier')}
              style={{ marginBottom: '0.5em' }}
              loading={loading && activeParty === p}
              onClick={() => handleLogin(p)}
            >
              {p === 'Supplier' && '📄 '}
              {p.startsWith('Financier') && '💰 '}
              {p === 'Buyer' && '🏢 '}
              {p === 'Operator' && '⚙️ '}
              {p}
            </Button>
          ))}
        </Segment>

        <p style={{ color: 'grey', fontSize: '0.8em' }}>
          Running against local Canton sandbox · Port 7575
        </p>
      </Grid.Column>
    </Grid>
  );
};

export default LoginScreen;