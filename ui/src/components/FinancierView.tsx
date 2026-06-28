import React, { useState } from 'react';
import { Button, Form, Header, Input, Message, Segment, Table } from 'semantic-ui-react';
import { userContext } from './App';
import * as Invoice from '@daml.js/veil-0.0.1/lib/Invoice';
import * as Auction from '@daml.js/veil-0.0.1/lib/Auction';
import * as damlLedger from '@daml/ledger';
import { ContractId } from '@daml/types';

const FinancierView: React.FC = () => {
  const party = userContext.useParty();
  const ledger = userContext.useLedger();

  // Live queries
  const openInvoices = userContext.useQuery(Invoice.OpenInvoice).contracts as damlLedger.CreateEvent<Invoice.OpenInvoice>[];
  const myBids = userContext.useQuery(Auction.Bid).contracts as damlLedger.CreateEvent<Auction.Bid>[];
  const myDeals = userContext.useQuery(Auction.FinancingAgreement).contracts as damlLedger.CreateEvent<Auction.FinancingAgreement>[];

  // Form state
  const [selectedInvoice, setSelectedInvoice] = useState<damlLedger.CreateEvent<Invoice.OpenInvoice> | null>(null);
  const [advanceRate, setAdvanceRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmitBid = async () => {
    if (!selectedInvoice || !advanceRate) {
      alert('Please select an invoice and enter an advance rate');
      return;
    }
    const rate = parseFloat(advanceRate);
    if (isNaN(rate) || rate <= 0 || rate >= 1) {
      alert('Advance rate must be between 0 and 1 (e.g. 0.95 for 95%)');
      return;
    }
    setLoading(true);
    try {
      const now = new Date().toISOString();
      await ledger.create(Auction.Bid, {
        supplier: selectedInvoice.payload.supplier,
        buyer: selectedInvoice.payload.buyer,
        financier: party,
        invoiceId: selectedInvoice.payload.invoiceId,
        amount: selectedInvoice.payload.amount,
        currency: selectedInvoice.payload.currency,
        advanceRate: advanceRate,
        dueDate: selectedInvoice.payload.dueDate,
        submittedAt: now,
      });
      setSuccess(`Private bid submitted on invoice ${selectedInvoice.payload.invoiceId} at ${(rate * 100).toFixed(1)}% advance rate. Only you and the supplier can see this bid.`);
      setSelectedInvoice(null);
      setAdvanceRate('');
    } catch (e: any) {
      alert(`Error submitting bid: ${e.message ?? JSON.stringify(e)}`);
    }
    setLoading(false);
  };

  const handleWithdrawBid = async (contractId: string, invoiceId: string) => {
    try {
      await ledger.exercise(Auction.Bid.Bid_Withdraw, contractId as ContractId<Auction.Bid>, {});
      setSuccess(`Bid on invoice ${invoiceId} withdrawn.`);
    } catch (e: any) {
      alert(`Error: ${e.message ?? JSON.stringify(e)}`);
    }
  };

  const handleConfirmFunding = async (contractId: string, invoiceId: string) => {
    try {
      await ledger.exercise(Auction.FinancingAgreement.FinancingAgreement_ConfirmFunding, contractId as ContractId<Auction.FinancingAgreement>, {});
      setSuccess(`Funding confirmed for invoice ${invoiceId}. Buyer will now pay you at maturity.`);
    } catch (e: any) {
      alert(`Error: ${e.message ?? JSON.stringify(e)}`);
    }
  };

  return (
    <div>
      <Header as='h3'>Financier Dashboard</Header>

      {success && (
        <Message positive onDismiss={() => setSuccess('')}>
          {success}
        </Message>
      )}

      <Segment>
        <Header as='h4'>Open Invoices Available for Financing ({openInvoices.length})</Header>
        <p style={{ color: 'grey', fontSize: '0.85em' }}>
          Select an invoice to submit a private bid. Other financiers cannot see your offer.
        </p>
        {openInvoices.length === 0 ? (
          <p style={{ color: 'grey' }}>No invoices currently open for financing.</p>
        ) : (
          <Table celled selectable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Invoice ID</Table.HeaderCell>
                <Table.HeaderCell>Supplier</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
                <Table.HeaderCell>Currency</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {openInvoices.map(inv => (
                <Table.Row
                  key={inv.contractId}
                  active={selectedInvoice?.contractId === inv.contractId}
                  onClick={() => setSelectedInvoice(inv)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Cell>{inv.payload.invoiceId}</Table.Cell>
                  <Table.Cell>{inv.payload.supplier}</Table.Cell>
                  <Table.Cell>${Number(inv.payload.amount).toLocaleString()}</Table.Cell>
                  <Table.Cell>{inv.payload.currency}</Table.Cell>
                  <Table.Cell>
                    <Button
                      size='small'
                      primary
                      onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }}
                    >
                      Bid on this
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Segment>

      {selectedInvoice && (
        <Segment color='blue'>
          <Header as='h4'>
            Submit Private Bid — Invoice {selectedInvoice.payload.invoiceId}
          </Header>
          <p style={{ color: 'grey', fontSize: '0.85em' }}>
            Face value: ${Number(selectedInvoice.payload.amount).toLocaleString()} {selectedInvoice.payload.currency}.
            Your bid is private — only you and the supplier will see it.
          </p>
          <Form>
            <Form.Field>
              <label>Advance Rate (e.g. 0.95 = advance 95% of face value)</label>
              <Input
                placeholder='e.g. 0.95'
                value={advanceRate}
                onChange={e => setAdvanceRate(e.target.value)}
              />
            </Form.Field>
            {advanceRate && !isNaN(parseFloat(advanceRate)) && (
              <p style={{ color: 'green' }}>
                You will advance ${(Number(selectedInvoice.payload.amount) * parseFloat(advanceRate)).toLocaleString()} now
                and receive ${Number(selectedInvoice.payload.amount).toLocaleString()} at maturity.
              </p>
            )}
            <Button primary loading={loading} onClick={handleSubmitBid}>
              Submit Private Bid
            </Button>
            <Button onClick={() => setSelectedInvoice(null)}>
              Cancel
            </Button>
          </Form>
        </Segment>
      )}

      <Segment>
        <Header as='h4'>Your Active Bids ({myBids.length})</Header>
        <p style={{ color: 'grey', fontSize: '0.85em' }}>
          Only you and the relevant supplier can see these bids.
        </p>
        {myBids.length === 0 ? (
          <p style={{ color: 'grey' }}>No active bids.</p>
        ) : (
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Invoice ID</Table.HeaderCell>
                <Table.HeaderCell>Supplier</Table.HeaderCell>
                <Table.HeaderCell>Advance Rate</Table.HeaderCell>
                <Table.HeaderCell>Advance Amount</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {myBids.map(({ contractId, payload }) => (
                <Table.Row key={contractId}>
                  <Table.Cell>{payload.invoiceId}</Table.Cell>
                  <Table.Cell>{payload.supplier}</Table.Cell>
                  <Table.Cell>{(Number(payload.advanceRate) * 100).toFixed(1)}%</Table.Cell>
                  <Table.Cell>
                    ${(Number(payload.amount) * Number(payload.advanceRate)).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size='small'
                      negative
                      onClick={() => handleWithdrawBid(contractId, payload.invoiceId)}
                    >
                      Withdraw
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Segment>

      <Segment>
        <Header as='h4'>Deals Won ({myDeals.length})</Header>
        {myDeals.length === 0 ? (
          <p style={{ color: 'grey' }}>No financing agreements yet.</p>
        ) : (
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Invoice ID</Table.HeaderCell>
                <Table.HeaderCell>Supplier</Table.HeaderCell>
                <Table.HeaderCell>Face Amount</Table.HeaderCell>
                <Table.HeaderCell>Advance Amount</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {myDeals.map(({ contractId, payload }) => (
                <Table.Row key={contractId}>
                  <Table.Cell>{payload.invoiceId}</Table.Cell>
                  <Table.Cell>{payload.supplier}</Table.Cell>
                  <Table.Cell>${Number(payload.faceAmount).toLocaleString()}</Table.Cell>
                  <Table.Cell>${Number(payload.advanceAmount).toLocaleString()}</Table.Cell>
                  <Table.Cell>{payload.status}</Table.Cell>
                  <Table.Cell>
                    {payload.status === 'PendingFunding' && (
                      <Button
                        size='small'
                        positive
                        onClick={() => handleConfirmFunding(contractId, payload.invoiceId)}
                      >
                        Confirm Funding
                      </Button>
                    )}
                    {payload.status === 'Funded' && (
                      <span style={{ color: 'green' }}>Awaiting buyer settlement</span>
                    )}
                    {payload.status === 'Settled' && (
                      <span style={{ color: 'grey' }}>✓ Settled</span>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Segment>
    </div>
  );
};

export default FinancierView;