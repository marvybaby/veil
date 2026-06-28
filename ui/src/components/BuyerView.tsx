import React, { useState } from 'react';
import { Button, Header, Message, Segment, Table } from 'semantic-ui-react';
import { userContext } from './App';
import * as Auction from '@daml.js/veil-0.0.1/lib/Auction';
import * as damlLedger from '@daml/ledger';
import { ContractId } from '@daml/types';

const BuyerView: React.FC = () => {
  const ledger = userContext.useLedger();
  const [success, setSuccess] = useState('');

  // Live query — Buyer is an observer on FinancingAgreement
  // so Canton shows only what Buyer is allowed to see:
  // payment obligation details YES, advance rate/discount NO
  const agreements = userContext.useQuery(Auction.FinancingAgreement).contracts as damlLedger.CreateEvent<Auction.FinancingAgreement>[];

  const handleSettle = async (contractId: string, invoiceId: string) => {
    try {
      await ledger.exercise(
        Auction.FinancingAgreement.FinancingAgreement_SettleAtMaturity,
        contractId as ContractId<Auction.FinancingAgreement>,
        {}
      );
      setSuccess(`Invoice ${invoiceId} settled successfully. Payment obligation discharged on-ledger.`);
    } catch (e: any) {
      alert(`Error: ${e.message ?? JSON.stringify(e)}`);
    }
  };

  return (
    <div>
      <Header as='h3'>Buyer Dashboard</Header>

      {success && (
        <Message positive onDismiss={() => setSuccess('')}>
          {success}
        </Message>
      )}

      <Segment>
        <Header as='h4'>Your Financed Invoices ({agreements.length})</Header>
        <p style={{ color: 'grey', fontSize: '0.85em' }}>
          You can see who to pay and when — but the discount rate your supplier
          accepted stays completely private between them and their financier.
          This is enforced by Canton's ledger, not application logic.
        </p>
        {agreements.length === 0 ? (
          <p style={{ color: 'grey' }}>No financed invoices yet.</p>
        ) : (
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Invoice ID</Table.HeaderCell>
                <Table.HeaderCell>Supplier</Table.HeaderCell>
                <Table.HeaderCell>Pay To (Financier)</Table.HeaderCell>
                <Table.HeaderCell>Amount Due</Table.HeaderCell>
                <Table.HeaderCell>Currency</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {agreements.map(({ contractId, payload }) => (
                <Table.Row key={contractId}>
                  <Table.Cell>{payload.invoiceId}</Table.Cell>
                  <Table.Cell>{payload.supplier}</Table.Cell>
                  <Table.Cell><strong>{payload.financier}</strong></Table.Cell>
                  <Table.Cell>${Number(payload.faceAmount).toLocaleString()}</Table.Cell>
                  <Table.Cell>{payload.currency}</Table.Cell>
                  <Table.Cell>{payload.status}</Table.Cell>
                  <Table.Cell>
                    {payload.status === 'Funded' && (
                      <Button
                        size='small'
                        primary
                        onClick={() => handleSettle(contractId, payload.invoiceId)}
                      >
                        Settle at Maturity
                      </Button>
                    )}
                    {payload.status === 'PendingFunding' && (
                      <span style={{ color: 'orange' }}>Awaiting funding</span>
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

      <Segment>
        <Header as='h4'>Privacy Guarantee</Header>
        <p>
          As the buyer you are an <strong>observer</strong> on your
          FinancingAgreement contracts. Canton's ledger structurally enforces
          that you can see the payment obligation (who to pay, how much, when),
          but the financing terms — the advance rate and discount your supplier
          accepted — are in a private contract between the supplier and their
          financier that you have zero visibility into.
        </p>
        <p style={{ color: 'grey', fontSize: '0.85em' }}>
          This is not an access control rule that can be misconfigured.
          It is a structural property of the Canton ledger — your node
          simply never receives those contract details.
        </p>
      </Segment>
    </div>
  );
};

export default BuyerView;