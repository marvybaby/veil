import React, { useState } from 'react';
import { Button, Form, Header, Input, Segment } from 'semantic-ui-react';
import { userContext } from './App';

const FinancierView: React.FC = () => {
  const party = userContext.useParty();
  const ledger = userContext.useLedger();

  const [invoiceId, setInvoiceId] = useState('');
  const [supplier, setSupplier] = useState('');
  const [advanceRate, setAdvanceRate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitBid = async () => {
    setLoading(true);
    try {
      alert(
        `Bid submitted!\n` +
        `Invoice: ${invoiceId}\n` +
        `Advance Rate: ${advanceRate}%\n\n` +
        `In the full build, this calls ledger.create(Auction.Bid, {...})\n` +
        `Your bid is private — other financiers cannot see it.`
      );
    } catch (e) {
      alert(`Error: ${JSON.stringify(e)}`);
    }
    setLoading(false);
  };

  return (
    <div>
      <Header as='h3'>Financier Dashboard</Header>

      <Segment>
        <Header as='h4'>Open Invoices Available for Financing</Header>
        <p style={{ color: 'grey' }}>
          Invoices opened for financing by suppliers will appear here.
          You can submit a private bid on any listed invoice.
        </p>
      </Segment>

      <Segment>
        <Header as='h4'>Submit a Private Bid</Header>
        <p style={{ color: 'grey', marginBottom: '1em' }}>
          Your bid is visible only to you and the supplier —
          competing financiers cannot see your offer.
        </p>
        <Form>
          <Form.Field>
            <label>Invoice ID</label>
            <Input
              placeholder='e.g. INV-1001'
              value={invoiceId}
              onChange={e => setInvoiceId(e.target.value)}
            />
          </Form.Field>
          <Form.Field>
            <label>Supplier Party ID</label>
            <Input
              placeholder='e.g. Supplier'
              value={supplier}
              onChange={e => setSupplier(e.target.value)}
            />
          </Form.Field>
          <Form.Field>
            <label>Advance Rate (e.g. 0.95 = 95%)</label>
            <Input
              placeholder='e.g. 0.95'
              value={advanceRate}
              onChange={e => setAdvanceRate(e.target.value)}
            />
          </Form.Field>
          <Button
            primary
            loading={loading}
            onClick={handleSubmitBid}
          >
            Submit Private Bid
          </Button>
        </Form>
      </Segment>

      <Segment>
        <Header as='h4'>Your Active Bids</Header>
        <p style={{ color: 'grey' }}>
          Bids you have submitted will appear here.
          Only you and the relevant supplier can see these.
        </p>
      </Segment>

      <Segment>
        <Header as='h4'>Deals Won</Header>
        <p style={{ color: 'grey' }}>
          Financing agreements where your bid was accepted will appear here.
        </p>
      </Segment>
    </div>
  );
};

export default FinancierView;