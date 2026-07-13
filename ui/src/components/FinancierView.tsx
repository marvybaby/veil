import React, { useState, useEffect } from 'react';
import { Button, Form, Header, Input, Message, Segment, Table } from 'semantic-ui-react';
import { getParty, queryContracts, createContract, exerciseChoice, getProvider } from '../ledgerService';

const OPEN_INVOICE_TEMPLATE = '0cc9d0b630445d98cf59e246f51b49ad51499d521a51b1607cbddf687b5ba583:Invoice:OpenInvoice';
const BID_TEMPLATE = '0cc9d0b630445d98cf59e246f51b49ad51499d521a51b1607cbddf687b5ba583:Auction:Bid';
const AGREEMENT_TEMPLATE = '0cc9d0b630445d98cf59e246f51b49ad51499d521a51b1607cbddf687b5ba583:Auction:FinancingAgreement';

const FinancierView: React.FC = () => {
  const party = getParty();
  const [openInvoices, setOpenInvoices] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [myDeals, setMyDeals] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [advanceRate, setAdvanceRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const provider = getProvider();
      if (provider) {
        const [open, bids, deals] = await Promise.all([
          provider.getActiveContracts({ templateId: '#veil:Invoice:OpenInvoice' }).catch(() => []),
          provider.getActiveContracts({ templateId: '#veil:Auction:Bid' }).catch(() => []),
          provider.getActiveContracts({ templateId: '#veil:Auction:FinancingAgreement' }).catch(() => []),
        ]);
        setOpenInvoices(open || []);
        setMyBids(bids || []);
        setMyDeals(deals || []);
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmitBid = async () => {
    if (!selectedInvoice || !advanceRate) { alert('Please select an invoice and enter an advance rate'); return; }
    const rate = parseFloat(advanceRate);
    if (isNaN(rate) || rate <= 0 || rate >= 1) { alert('Advance rate must be between 0 and 1'); return; }
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const p = selectedInvoice.createArgument || selectedInvoice;
      await createContract(BID_TEMPLATE, {
        supplier: p.supplier, buyer: p.buyer, financier: party,
        invoiceId: p.invoiceId, amount: p.amount, currency: p.currency,
        advanceRate, dueDate: p.dueDate, submittedAt: now,
      });
      setSuccess(`Private bid submitted! Only you and the supplier can see this.`);
      setSelectedInvoice(null); setAdvanceRate(''); fetchData();
    } catch (e: any) { alert(`Error: ${e.message ?? JSON.stringify(e)}`); }
    setLoading(false);
  };

  const handleWithdrawBid = async (contractId: string, invoiceId: string) => {
    try {
      await exerciseChoice(BID_TEMPLATE, contractId, 'Bid_Withdraw', {});
      setSuccess(`Bid withdrawn.`); fetchData();
    } catch (e: any) { alert(`Error: ${e.message ?? JSON.stringify(e)}`); }
  };

  const handleConfirmFunding = async (contractId: string) => {
    try {
      await exerciseChoice(AGREEMENT_TEMPLATE, contractId, 'FinancingAgreement_ConfirmFunding', {});
      setSuccess(`Funding confirmed!`); fetchData();
    } catch (e: any) { alert(`Error: ${e.message ?? JSON.stringify(e)}`); }
  };

  return (
    <div>
      <Header as='h3'>Financier Dashboard</Header>
      {success && <Message positive onDismiss={() => setSuccess('')}>{success}</Message>}

      <Segment>
        <Header as='h4'>Open Invoices ({openInvoices.length})</Header>
        {openInvoices.length === 0 ? <p style={{ color: 'grey' }}>No invoices open for financing.</p> : (
          <Table celled selectable>
            <Table.Header><Table.Row>
              <Table.HeaderCell>Invoice ID</Table.HeaderCell>
              <Table.HeaderCell>Supplier</Table.HeaderCell>
              <Table.HeaderCell>Amount</Table.HeaderCell>
              <Table.HeaderCell>Action</Table.HeaderCell>
            </Table.Row></Table.Header>
            <Table.Body>
              {openInvoices.map((c, i) => {
                const p = c.createArgument || c;
                return (
                  <Table.Row key={i} active={selectedInvoice === c} onClick={() => setSelectedInvoice(c)} style={{ cursor: 'pointer' }}>
                    <Table.Cell>{p.invoiceId}</Table.Cell>
                    <Table.Cell>{p.supplier}</Table.Cell>
                    <Table.Cell>${Number(p.amount).toLocaleString()}</Table.Cell>
                    <Table.Cell><Button size='small' primary onClick={e => { e.stopPropagation(); setSelectedInvoice(c); }}>Bid</Button></Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        )}
      </Segment>

      {selectedInvoice && (
        <Segment color='blue'>
          <Header as='h4'>Submit Private Bid</Header>
          <p style={{ color: 'grey', fontSize: '0.85em' }}>Your bid is private — only you and the supplier will see it.</p>
          <Form>
            <Form.Field>
              <label>Advance Rate (e.g. 0.95 = 95%)</label>
              <Input placeholder='e.g. 0.95' value={advanceRate} onChange={e => setAdvanceRate(e.target.value)} />
            </Form.Field>
            <Button primary loading={loading} onClick={handleSubmitBid}>Submit Private Bid</Button>
            <Button onClick={() => setSelectedInvoice(null)}>Cancel</Button>
          </Form>
        </Segment>
      )}

      <Segment>
        <Header as='h4'>Your Active Bids ({myBids.length})</Header>
        {myBids.length === 0 ? <p style={{ color: 'grey' }}>No active bids.</p> : (
          <Table celled><Table.Header><Table.Row>
            <Table.HeaderCell>Invoice ID</Table.HeaderCell>
            <Table.HeaderCell>Advance Rate</Table.HeaderCell>
            <Table.HeaderCell>Action</Table.HeaderCell>
          </Table.Row></Table.Header>
          <Table.Body>
            {myBids.map((c, i) => {
              const p = c.createArgument || c;
              return (
                <Table.Row key={i}>
                  <Table.Cell>{p.invoiceId}</Table.Cell>
                  <Table.Cell>{(Number(p.advanceRate) * 100).toFixed(1)}%</Table.Cell>
                  <Table.Cell><Button size='small' negative onClick={() => handleWithdrawBid(c.contractId || c.contract_id, p.invoiceId)}>Withdraw</Button></Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body></Table>
        )}
      </Segment>

      <Segment>
        <Header as='h4'>Deals Won ({myDeals.length})</Header>
        {myDeals.length === 0 ? <p style={{ color: 'grey' }}>No deals yet.</p> : (
          <Table celled><Table.Header><Table.Row>
            <Table.HeaderCell>Invoice ID</Table.HeaderCell>
            <Table.HeaderCell>Face Amount</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Action</Table.HeaderCell>
          </Table.Row></Table.Header>
          <Table.Body>
            {myDeals.map((c, i) => {
              const p = c.createArgument || c;
              return (
                <Table.Row key={i}>
                  <Table.Cell>{p.invoiceId}</Table.Cell>
                  <Table.Cell>${Number(p.faceAmount).toLocaleString()}</Table.Cell>
                  <Table.Cell>{p.status}</Table.Cell>
                  <Table.Cell>
                    {p.status === 'PendingFunding' && <Button size='small' positive onClick={() => handleConfirmFunding(c.contractId || c.contract_id)}>Confirm Funding</Button>}
                    {p.status === 'Funded' && <span style={{ color: 'green' }}>Awaiting settlement</span>}
                    {p.status === 'Settled' && <span style={{ color: 'grey' }}>✓ Settled</span>}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body></Table>
        )}
      </Segment>
    </div>
  );
};

export default FinancierView;