import React, { useState } from 'react';
import { Container, Header, Segment, Tab } from 'semantic-ui-react';
import { userContext } from './App';
import SupplierView from './SupplierView';

import FinancierView from './FinancierView';
import BuyerView from './BuyerView';

const MainView: React.FC = () => {
  const party = userContext.useParty();

  const getRole = (party: string) => {
    if (party.startsWith('Supplier')) return 'supplier';
    if (party.startsWith('Financier')) return 'financier';
    if (party.startsWith('Buyer')) return 'buyer';
    return 'unknown';
  };

  const role = getRole(party);

  return (
    <Container style={{ marginTop: '2em' }}>
      <Header as='h2'>
        Welcome, {party}
        <Header.Subheader>
          {role === 'supplier' && 'Issue invoices and accept financing offers'}
          {role === 'financier' && 'Browse open invoices and submit private bids'}
          {role === 'buyer' && 'View your financed invoices and settle at maturity'}
          {role === 'unknown' && 'Connected to Veil ledger'}
        </Header.Subheader>
      </Header>

      <Segment>
        {role === 'supplier' && <SupplierView />}
        {role === 'financier' && <FinancierView />}
        {role === 'buyer' && <BuyerView />}
        {role === 'unknown' && <p>Your party role could not be determined.</p>}
      </Segment>
    </Container>
  );
};

export default MainView;