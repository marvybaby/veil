import React, { useState, useEffect } from 'react';
import { Button, Form, Header, Input, Message, Segment, Table } from 'semantic-ui-react';
import { getParty, queryContracts, createContract, exerciseChoice } from '../ledgerService';

const INVOICE_TEMPLATE = '0cc9d0b630445d98cf59e246f51b49ad51499d521a51b1607cbddf687b5ba583:Invoice:Invoice';
const OPEN_INVOICE_TEMPLATE = '0cc9d0b630445d98cf59e246f51b49ad51499d521a51b1607cbddf687b5ba583:Invoice:OpenInvoice';
const BID_TEMPLATE = '0cc9d0b630445d98cf59e246f51b49ad51499d521a51b1607cbddf687b5ba583:Auction:Bid';
const AGREEMENT_TEMPLATE = '0cc9d0b630445d98cf59e246f51b49ad51499d521a51b1607cbddf687b5ba583:Auction:FinancingAgreement';

const SupplierView: React.FC = () => {
  const party = getParty();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [openInvoices, setOpenInvoices] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);

  const [invoiceId, setInvoiceId] = useState('');
  const [buyer, setBuyer] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [inv, open, bid, agr] = await Promise.all([
        queryContracts(INVOICE_TEMPLATE),
        queryContracts(OPEN_INVOICE_TEMPLATE),
        queryContracts(BID_TEMPLATE),
        queryContracts(AGREEMENT_TEMPLATE),
      ]);
      setInvoices(inv);
      setOpenInvoices(open);
      setBids(bid);
      setAgreements(agr);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateInvoice = async () => {
    if (!invoiceId || !buyer || !amount || !description) {
      alert('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const due = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      await createContract(INVOICE_TEMPLATE, {
        supplier: party,
        buyer,
        invoiceId,
        amount,
        currency: 'USD',
        dueDate: due,
        issuedAt: now,
        description,
      });
      setSuccess(`Invoice ${invoiceId} created!`);
      setInvoiceId(''); setBuyer(''); setAmount(''); setDescription('');
      fetchData();
    } catch (e: any) {
      alert(`Error: ${e.message ?? JSON.stringify(e)}`);
    }
    setLoading(false);
  };

  const handleOpenForFinancing = async (contractId: string, iId: string) => {
    try {
      await exerciseChoice(INVOICE_TEMPLATE, contractId, 'Invoice_OpenForFinancing', { operator: party });
      setSuccess(`Invoice ${iId} opened for financing!`);
      fetchData();
    } catch (e: any) {
      alert(`Error: ${e.message ?? JSON.stringify(e)}`);
    }
  };

  const handleAcceptBid = async (bidContractId: string, openInvoiceCid: string) => {
    try {
      await exerciseChoice(BID_TEMPLATE, bidContractId, 'Bid_Accept', { openInvoiceCid });
      setSuccess('Bid accepted! Financing agreement created.');
      fetchData();
    } catch (e: any) {
      alert(`Error: ${e.message ?? JSON.stringify(e)}`);
    }
  };

  return (
    <div>
      <Header as='h3'>Supplier Dashboard</Header>

      {success && (
        <Message positive onDismiss={() => setSuccess('')}>{success}</Message>
      )}

      <Segment>
        <Header as='h4'>Issue a New Invoice</Header>
        <Form>
          <Form.Field>
            <label>Invoice ID</label>
            <Input placeholder='e.g. INV-1002' value={invoiceId} onChange={e => setInvoiceId(e.target.value)} />
          </Form.Field>
          <Form.Field>
            <label>Buyer Party ID</label>
            <Input placeholder='e.g. Buyer' value={buyer} onChange={e => setBuyer(e.target.value)} />
          </Form.Field>
          <Form.Field>
            <label>Amount (USD)</label>
            <Input placeholder='e.g. 50000' value={amount} onChange={e => setAmount(e.target.value)} />
          </Form.Field>
          <Form.Field>
            <label>Description</label>
            <Input placeholder='e.g. Q3 hardware delivery' value={description} onChange={e => setDescription(e.target.value)} />
          </Form.Field>
          <Button primary loading={loading} onClick={handleCreateInvoice}>
            Issue Invoice
          </Button>
        </Form>
      </Segment>

      <Segment>
        <Header as='h4'>Your Invoices ({invoices.length})</Header>
        {invoices.length === 0 ? <p style={{ color: 'grey' }}>No invoices yet.</p> : (
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
              {invoices.map((c) => (
                <Table.Row key={c.contractId}>
                  <Table.Cell>{c.createArgument?.invoiceId}</Table.Cell>
                  <Table.Cell>{c.createArgument?.buyer}</Table.Cell>
                  <Table.Cell>${Number(c.createArgument?.amount).toLocaleString()}</Table.Cell>
                  <Table.Cell>{c.createArgument?.description}</Table.Cell>
                  <Table.Cell>
                    <Button size='small' primary
                      onClick={() => handleOpenForFinancing(c.contractId, c.createArgument?.invoiceId)}>
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
        {bids.length === 0 ? <p style={{ color: 'grey' }}>No bids yet.</p> : (
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
              {bids.map((c) => {
                const openInvoice = openInvoices.find(
                  o => o.createArgument?.invoiceId === c.createArgument?.invoiceId
                );
                return (
                  <Table.Row key={c.contractId}>
                    <Table.Cell>{c.createArgument?.invoiceId}</Table.Cell>
                    <Table.Cell>{c.createArgument?.financier}</Table.Cell>
                    <Table.Cell>{(Number(c.createArgument?.advanceRate) * 100).toFixed(1)}%</Table.Cell>
                    <Table.Cell>
                      ${(Number(c.createArgument?.amount) * Number(c.createArgument?.advanceRate)).toLocaleString()}
                    </Table.Cell>
                    <Table.Cell>
                      {openInvoice ? (
                        <Button size='small' positive
                          onClick={() => handleAcceptBid(c.contractId, openInvoice.contractId)}>
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
        {agreements.length === 0 ? <p style={{ color: 'grey' }}>No active agreements.</p> : (
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
              {agreements.map((c) => (
                <Table.Row key={c.contractId}>
                  <Table.Cell>{c.createArgument?.invoiceId}</Table.Cell>
                  <Table.Cell>{c.createArgument?.financier}</Table.Cell>
                  <Table.Cell>${Number(c.createArgument?.advanceAmount).toLocaleString()}</Table.Cell>
                  <Table.Cell>{c.createArgument?.status}</Table.Cell>
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