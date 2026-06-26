import React from 'react';
import { EVResult } from './pokerUtils';

interface EVResultsTableProps {
  bets: EVResult[];
  folds: EVResult[];
}

export const EVResultsTable: React.FC<EVResultsTableProps> = ({ bets, folds }) => {
  const handcount = bets.length + folds.length;
  if (handcount === 0) return null;

  const betsPercent = ((bets.length / handcount) * 100).toFixed(2);
  const foldsPercent = ((folds.length / handcount) * 100).toFixed(2);
  const maxSize = Math.max(bets.length, folds.length);

  const rows = [];
  for (let i = 0; i < maxSize; i++) {
    const bet = bets[i];
    const fold = folds[i];

    rows.push(
      <tr key={i}>
        <td>{bet ? bet.holecards : ''}</td>
        <td>{bet ? (bet.evPlay - bet.evNoPlay).toFixed(4) : ''}</td>
        <td>{bet ? bet.evPlay.toFixed(4) : ''}</td>
        <td>{fold ? fold.holecards : ''}</td>
        <td>{fold ? (fold.evPlay - fold.evNoPlay).toFixed(4) : ''}</td>
        <td>{fold ? fold.evPlay.toFixed(4) : ''}</td>
      </tr>
    );
  }

  return (
    <div className="mt-4">
      <p>
        <strong>Bets:</strong> {betsPercent}% ({bets.length}/{handcount}){' '}
        <strong>Folds:</strong> {foldsPercent}% ({folds.length}/{handcount})
      </p>
      <table className="table table-striped">
        <thead>
          <tr>
            <th colSpan={3}>Bets</th>
            <th colSpan={3}>Folds</th>
          </tr>
          <tr>
            <th>Hand</th>
            <th>Net EV</th>
            <th>Bet</th>
            <th>Hand</th>
            <th>Net EV</th>
            <th>Bet</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  );
};