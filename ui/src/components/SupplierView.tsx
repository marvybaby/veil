import React, { useState } from 'react';
import { Button, Form, Header, Input, Segment, Table, Message } from 'semantic-ui-react';
import { userContext } from './App';
import * as Invoice from '@daml.js/veil-0.0.1/lib/Invoice';
import * as Auction from '@daml.js/veil-0.0.1/lib/Auction';
import { ContractId } from '@daml/types';
import * as damlLedger from '@daml/ledger';


const SupplierView: React.FC = () => {
  const party = userContext.useParty();
  const ledger = userContext.useLedger();

  // Live queries
  const invoices = userContext.useQuery(Invoice.Invoice).contracts as damlLedger.CreateEvent<Invoice.Invoice>[];
const openInvoices = userContext.useQuery(Invoice.OpenInvoice).contracts as damlLedger.CreateEvent<Invoice.OpenInvoice>[];
const bids = userContext.useQuery(Auction.Bid).contracts as damlLedger.CreateEvent<Auction.Bid>[];
const agreements = userContext.useQuery(Auction.FinancingAgreement).contracts as damlLedger.CreateEvent<Auction.FinancingAgreement>[];

  // Form state
  const [invoiceId, setInvoiceId] = useState('');
  const [buyer, setBuyer] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [operator] = useState('Operator');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleCreateInvoice = async () => {
    if (!invoiceId || !buyer || !amount || !description) {
      alert('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const due = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      await ledger.create(Invoice.Invoice, {
        supplier: party,
        buyer,
        invoiceId,
        amount: amount,
        currency: 'USD',
        dueDate: due,
        issuedAt: now,
        description,
      });
      setSuccess(`Invoice ${invoiceId} created successfully!`);
      setInvoiceId(''); setBuyer(''); setAmount(''); setDescription('');
    } catch (e: any) {
      alert(`Error creating invoice: ${e.message ?? JSON.stringify(e)}`);
    }
    setLoading(false);
  };

  const handleOpenForFinancing = async (contractId: string, iId: string) => {
    try {
      await ledger.exercise(Invoice.Invoice.Invoice_OpenForFinancing, contractId as ContractId<Invoice.Invoice>, {
  operator,
});
      setSuccess(`Invoice ${iId} opened for financing!`);
    } catch (e: any) {
      alert(`Error: ${e.message ?? JSON.stringify(e)}`);
    }
  };

  const handleAcceptBid = async (bidContractId: string, openInvoiceCid: string) => {
    try {
      await ledger.exercise(Auction.Bid.Bid_Accept, bidContractId as ContractId<Auction.Bid>, {
  openInvoiceCid: openInvoiceCid as ContractId<Invoice.OpenInvoice>,
});
      setSuccess('Bid accepted! Financing agreement created.');
    } catch (e: any) {
      alert(`Error: ${e.message ?? JSON.stringify(e)}`);
    }
  };

  return (
    <div>
      <Header as='h3'>Supplier Dashboard</Header>

      {success && (
        <Message positive onDismiss={() => setSuccess('')}>
          {success}
        </Message>
      )}

      <Segment>
        <Header as='h4'>Issue a New Invoice</Header>
        <Form>
          <Form.Field>
            <label>Invoice ID</label>
            <Input placeholder='e.g. INV-1002' value={invoiceId}
              onChange={e => setInvoiceId(e.target.value)} />
          </Form.Field>
          <Form.Field>
            <label>Buyer Party ID</label>
            <Input placeholder='e.g. Buyer' value={buyer}
              onChange={e => setBuyer(e.target.value)} />
          </Form.Field>
          <Form.Field>
            <label>Amount (USD)</label>
            <Input placeholder='e.g. 50000' value={amount}
              onChange={e => setAmount(e.target.value)} />
          </Form.Field>
          <Form.Field>
            <label>Description</label>
            <Input placeholder='e.g. Q3 hardware delivery' value={description}
              onChange={e => setDescription(e.target.value)} />
          </Form.Field>
          <Button primary loading={loading} onClick={handleCreateInvoice}>
            Issue Invoice
          </Button>
        </Form>
      </Segment>

      <Segment>
        <Header as='h4'>Your Invoices ({invoices.length})</Header>
        {invoices.length === 0 ? (
          <p style={{ color: 'grey' }}>No invoices yet.</p>
        ) : (
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Invoice ID</Table.HeaderCell>
                <Table.HeaderCell>Buyer</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
                <Table.HeaderCell>Description</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {invoices.map(({ contractId, payload }) => (
                <Table.Row key={contractId}>
                  <Table.Cell>{payload.invoiceId}</Table.Cell>
                  <Table.Cell>{payload.buyer}</Table.Cell>
                  <Table.Cell>${Number(payload.amount).toLocaleString()}</Table.Cell>
                  <Table.Cell>{payload.description}</Table.Cell>
                  <Table.Cell>
                    <Button size='small' primary
                      onClick={() => handleOpenForFinancing(contractId, payload.invoiceId)}>
                      Open for Financing
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Segment>

      <Segment>
        <Header as='h4'>Incoming Bids ({bids.length})</Header>
        <p style={{ color: 'grey', fontSize: '0.85em' }}>
          Only you can see all bids — each financier sees only their own.
        </p>
        {bids.length === 0 ? (
          <p style={{ color: 'grey' }}>No bids yet.</p>
        ) : (
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Invoice ID</Table.HeaderCell>
                <Table.HeaderCell>Financier</Table.HeaderCell>
                <Table.HeaderCell>Advance Rate</Table.HeaderCell>
                <Table.HeaderCell>Advance Amount</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {bids.map(({ contractId, payload }) => {
                const openInvoice = openInvoices.find(
                  o => o.payload.invoiceId === payload.invoiceId
                );
                return (
                  <Table.Row key={contractId}>
                    <Table.Cell>{payload.invoiceId}</Table.Cell>
                    <Table.Cell>{payload.financier}</Table.Cell>
                    <Table.Cell>{(Number(payload.advanceRate) * 100).toFixed(1)}%</Table.Cell>
                    <Table.Cell>
                      ${(Number(payload.amount) * Number(payload.advanceRate)).toLocaleString()}
                    </Table.Cell>
                    <Table.Cell>
                      {openInvoice ? (
                        <Button size='small' positive
                          onClick={() => handleAcceptBid(contractId, openInvoice.contractId)}>
                          Accept Bid
                        </Button>
                      ) : (
                        <span style={{ color: 'grey' }}>Already financed</span>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        )}
      </Segment>

      <Segment>
        <Header as='h4'>Active Financing Agreements ({agreements.length})</Header>
        {agreements.length === 0 ? (
          <p style={{ color: 'grey' }}>No active agreements.</p>
        ) : (
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Invoice ID</Table.HeaderCell>
                <Table.HeaderCell>Financier</Table.HeaderCell>
                <Table.HeaderCell>Advance Amount</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {agreements.map(({ contractId, payload }) => (
                <Table.Row key={contractId}>
                  <Table.Cell>{payload.invoiceId}</Table.Cell>
                  <Table.Cell>{payload.financier}</Table.Cell>
                  <Table.Cell>
                    ${Number(payload.advanceAmount).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell>{payload.status}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Segment>
    </div>
  );
};

export default SupplierView;