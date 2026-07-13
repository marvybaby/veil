import React, { useState, useEffect } from 'react';
import { Button, Header, Message, Segment, Table } from 'semantic-ui-react';
import { exerciseChoice, getProvider } from '../ledgerService';

const AGREEMENT_TEMPLATE = '0cc9d0b630445d98cf59e246f51b49ad51499d521a51b1607cbddf687b5ba583:Auction:FinancingAgreement';

const BuyerView: React.FC = () => {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const provider = getProvider();
      if (provider) {
        const deals = await provider.getActiveContracts({ templateId: '#veil:Auction:FinancingAgreement' }).catch(() => []);
        setAgreements(deals || []);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSettle = async (contractId: string, invoiceId: string) => {
    try {
      await exerciseChoice(AGREEMENT_TEMPLATE, contractId, 'FinancingAgreement_SettleAtMaturity', {});
      setSuccess(`Invoice ${invoiceId} settled!`); fetchData();
    } catch (e: any) { alert(`Error: ${e.message ?? JSON.stringify(e)}`); }
  };

  return (
    <div>
      <Header as='h3'>Buyer Dashboard</Header>
      {success && <Message positive onDismiss={() => setSuccess('')}>{success}</Message>}

      <Segment>
        <Header as='h4'>Your Financed Invoices ({agreements.length})</Header>
        <p style={{ color: 'grey', fontSize: '0.85em' }}>
          You can see who to pay and when — but the discount rate your supplier accepted stays completely private.
        </p>
        {agreements.length === 0 ? <p style={{ color: 'grey' }}>No financed invoices yet.</p> : (
          <Table celled>
            <Table.Header><Table.Row>
              <Table.HeaderCell>Invoice ID</Table.HeaderCell>
              <Table.HeaderCell>Pay To</Table.HeaderCell>
              <Table.HeaderCell>Amount Due</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Action</Table.HeaderCell>
            </Table.Row></Table.Header>
            <Table.Body>
              {agreements.map((c, i) => {
                const p = c.createArgument || c;
                return (
                  <Table.Row key={i}>
                    <Table.Cell>{p.invoiceId}</Table.Cell>
                    <Table.Cell>{p.financier}</Table.Cell>
                    <Table.Cell>${Number(p.faceAmount).toLocaleString()}</Table.Cell>
                    <Table.Cell>{p.status}</Table.Cell>
                    <Table.Cell>
                      {p.status === 'Funded' && <Button size='small' primary onClick={() => handleSettle(c.contractId || c.contract_id, p.invoiceId)}>Settle</Button>}
                      {p.status === 'Settled' && <span style={{ color: 'grey' }}>✓ Settled</span>}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        )}
      </Segment>

      <Segment>
        <Header as='h4'>Privacy Guarantee</Header>
        <p>As the buyer you are an <strong>observer</strong> on your FinancingAgreement contracts. Canton enforces that you see the payment obligation but never the discount rate your supplier accepted.</p>
      </Segment>
    </div>
  );
};

export default BuyerView;