import React, { useState } from 'react';
import { Button, Header, Segment, Table } from 'semantic-ui-react';
import { userContext } from './App';

const BuyerView: React.FC = () => {
  const party = userContext.useParty();
  const ledger = userContext.useLedger();
  const [loading, setLoading] = useState(false);

  const handleSettle = async (contractId: string) => {
    setLoading(true);
    try {
      alert(
        `Settlement submitted for contract ${contractId}\n\n` +
        `In the full build, this calls:\n` +
        `ledger.exercise(Auction.FinancingAgreement.FinancingAgreement_SettleAtMaturity, contractId, {})\n\n` +
        `This atomically discharges your payment obligation on-ledger.`
      );
    } catch (e) {
      alert(`Error: ${JSON.stringify(e)}`);
    }
    setLoading(false);
  };

  return (
    <div>
      <Header as='h3'>Buyer Dashboard</Header>

      <Segment>
        <Header as='h4'>Your Financed Invoices</Header>
        <p style={{ color: 'grey', marginBottom: '1em' }}>
          Invoices that have been financed on your behalf appear here.
          You can see who to pay and when — but you never see the discount
          rate your supplier accepted. That stays private between them
          and their financier.
        </p>
        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Invoice ID</Table.HeaderCell>
              <Table.HeaderCell>Supplier</Table.HeaderCell>
              <Table.HeaderCell>Financier</Table.HeaderCell>
              <Table.HeaderCell>Face Amount</Table.HeaderCell>
              <Table.HeaderCell>Due Date</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Action</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>INV-1001</Table.Cell>
              <Table.Cell>Supplier</Table.Cell>
              <Table.Cell>Financier2</Table.Cell>
              <Table.Cell>$100,000</Table.Cell>
              <Table.Cell>60 days</Table.Cell>
              <Table.Cell>Funded</Table.Cell>
              <Table.Cell>
                <Button
                  size='small'
                  primary
                  loading={loading}
                  onClick={() => handleSettle('demo-contract-id')}
                >
                  Settle
                </Button>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
        <p style={{ color: 'grey', fontSize: '0.85em' }}>
          Note: This demo row reflects the INV-1001 contract seeded by Setup.daml.
          Live data will load automatically once ledger query hooks are fully wired.
        </p>
      </Segment>

      <Segment>
        <Header as='h4'>Privacy Guarantee</Header>
        <p>
          As the buyer, you are an <strong>observer</strong> on your
          FinancingAgreement contracts — meaning Canton's ledger enforces
          that you see the payment obligation details, but the financing
          terms (advance rate, discount) between your supplier and their
          financier remain completely private from you.
        </p>
      </Segment>
    </div>
  );
};

export default BuyerView;