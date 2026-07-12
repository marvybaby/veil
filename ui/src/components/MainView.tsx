import React, { useContext } from 'react';
import { Container, Header, Segment } from 'semantic-ui-react';
import { RoleContext } from './App';
import SupplierView from './SupplierView';
import FinancierView from './FinancierView';
import BuyerView from './BuyerView';

const MainView: React.FC = () => {
  const role = useContext(RoleContext);

  return (
    <Container style={{ marginTop: '2em' }}>
      <Header as='h2'>
        {role === 'Supplier' && '📄 Supplier Dashboard'}
        {role === 'Financier' && '💰 Financier Dashboard'}
        {role === 'Buyer' && '🏢 Buyer Dashboard'}
        <Header.Subheader>
          {role === 'Supplier' && 'Issue invoices and accept financing offers'}
          {role === 'Financier' && 'Browse open invoices and submit private bids'}
          {role === 'Buyer' && 'View your financed invoices and settle at maturity'}
        </Header.Subheader>
      </Header>

      <Segment>
        {role === 'Supplier' && <SupplierView />}
        {role === 'Financier' && <FinancierView />}
        {role === 'Buyer' && <BuyerView />}
        {!role && <p>Role not set. Please log in again.</p>}
      </Segment>
    </Container>
  );
};

export default MainView;