import React, { useState } from 'react';
import { Button, Card, Form, Header, Input, Label, Segment, Table } from 'semantic-ui-react';
import { userContext } from './App';
import Ledger from '@daml/ledger';

const SupplierView: React.FC = () => {
  const party = userContext.useParty();
  const ledger = userContext.useLedger();

  // Form state for creating a new invoice
  const [invoiceId, setInvoiceId] = useState('');
  const [buyer, setBuyer] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateInvoice = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const due = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      alert(`Invoice ${invoiceId} creation would be submitted here.\nIn the full build, this calls ledger.create(Invoice.Invoice, {...})`);
    } catch (e) {
      alert(`Error: ${JSON.stringify(e)}`);
    }
    setLoading(false);
  };

  return (
    <div>
      <Header as='h3'>Supplier Dashboard</Header>

      <Segment>
        <Header as='h4'>Issue a New Invoice</Header>
        <Form>
          <Form.Field>
            <label>Invoice ID</label>
            <Input
              placeholder='e.g. INV-1002'
              value={invoiceId}
              onChange={e => setInvoiceId(e.target.value)}
            />
          </Form.Field>
          <Form.Field>
            <label>Buyer Party ID</label>
            <Input
              placeholder='e.g. Buyer'
              value={buyer}
              onChange={e => setBuyer(e.target.value)}
            />
          </Form.Field>
          <Form.Field>
            <label>Amount (USD)</label>
            <Input
              placeholder='e.g. 50000'
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </Form.Field>
          <Form.Field>
            <label>Description</label>
            <Input
              placeholder='e.g. Q3 hardware delivery'
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </Form.Field>
          <Button
            primary
            loading={loading}
            onClick={handleCreateInvoice}
          >
            Issue Invoice
          </Button>
        </Form>
      </Segment>

      <Segment>
        <Header as='h4'>Your Active Invoices</Header>
        <p style={{ color: 'grey' }}>
          Active invoices will appear here once connected to the live ledger
          via <code>@daml/react</code> query hooks.
        </p>
      </Segment>

      <Segment>
        <Header as='h4'>Incoming Bids</Header>
        <p style={{ color: 'grey' }}>
          Private bids from financiers will appear here. Only you can see all bids —
          each financier sees only their own.
        </p>
      </Segment>
    </div>
  );
};

export default SupplierView;