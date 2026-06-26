import React, { useState } from 'react';
import { 
  formatCards, 
  validateCards, 
  generateRandomCardsHelper, 
  cardToIntLookup, 
  intToCardLookup, 
  getEV, 
  EVResult 
} from './pokerUtils';
import { EVResultsTable } from './EVResultsTable';

export const App: React.FC = () => {
  // Numeric Inputs
  const [anteSize, setAnteSize] = useState<number>(25);
  const [blindSize, setBlindSize] = useState<number>(25);
  const [riverBetSize, setRiverBetSize] = useState<number>(1);
  const [numDead, setNumDead] = useState<number>(10);

  // Card Inputs
  const [board, setBoard] = useState<string>("");
  const [dead, setDead] = useState<string>("");
  const [holeCards, setHoleCards] = useState<string>("");

  // Calculation Results & Error States
  const [error, setError] = useState<string>("");
  const [bets, setBets] = useState<EVResult[]>([]);
  const [folds, setFolds] = useState<EVResult[]>([]);

  const foldEv = -(anteSize + blindSize);

  const handleRandomCards = (target: "board" | "dead") => {
    const generated = generateRandomCardsHelper(target, numDead, board, dead, holeCards);
    if (target === "board") setBoard(generated);
    if (target === "dead") setDead(generated);
  };

  const handleCalculate = () => {
    setError("");
    
    // Format card string parameters instantly
    const fmtBoard = formatCards(board);
    const fmtDead = formatCards(dead);
    const fmtHole = formatCards(holeCards);

    setBoard(fmtBoard);
    setDead(fmtDead);
    setHoleCards(fmtHole);

    if (!validateCards(fmtBoard, fmtDead, fmtHole)) {
      setError("Error: Duplicate cards detected.");
      return;
    }

    if (fmtBoard.length !== 10) {
      setError("Error: Board must contain exactly 5 cards.");
      return;
    }

    const iboard: number[] = [];
    for (let i = 0; i < fmtBoard.length; i += 2) {
      iboard.push(cardToIntLookup[fmtBoard.substr(i, 2)]);
    }

    const idead: number[] = [];
    for (let i = 0; i < fmtDead.length; i += 2) {
      idead.push(cardToIntLookup[fmtDead.substr(i, 2)]);
    }

    const seenCards = new Set([...iboard, ...idead]);
    const localBets: EVResult[] = [];
    const localFolds: EVResult[] = [];

    if (fmtHole) {
      const hole1 = cardToIntLookup[fmtHole.substr(0, 2)];
      const hole2 = cardToIntLookup[fmtHole.substr(2, 2)];

      if (hole1 === undefined || hole2 === undefined || seenCards.has(hole1) || seenCards.has(hole2) || hole1 === hole2) {
        setError("Invalid hole cards.");
        return;
      }

      const deck: number[] = [];
      for (let i = 0; i < 52; ++i) {
        if (seenCards.has(i) || i === hole1 || i === hole2) continue;
        deck.push(i);
      }

      const [evPlay, evNoPlay] = getEV(hole1, hole2, iboard, deck, anteSize, blindSize, riverBetSize);
      const key: EVResult = { holecards: fmtHole, evPlay, evNoPlay };

      if (evPlay > evNoPlay) localBets.push(key);
      else localFolds.push(key);

    } else {
      // Loop over all remaining possible starting hand permutations
      for (let hole1 = 0; hole1 < 51; ++hole1) {
        if (seenCards.has(hole1)) continue;
        for (let hole2 = hole1 + 1; hole2 < 52; ++hole2) {
          if (seenCards.has(hole2)) continue;

          const currentHoleCards = intToCardLookup[hole1] + intToCardLookup[hole2];
          const deck: number[] = [];
          for (let i = 0; i < 52; ++i) {
            if (seenCards.has(i) || i === hole1 || i === hole2) continue;
            deck.push(i);
          }

          const [evPlay, evNoPlay] = getEV(hole1, hole2, iboard, deck, anteSize, blindSize, riverBetSize);
          const key: EVResult = { holecards: currentHoleCards, evPlay, evNoPlay };

          if (evPlay > evNoPlay) localBets.push(key);
          else localFolds.push(key);
        }
      }

      localBets.sort((a, b) => (a.evPlay - a.evNoPlay) - (b.evPlay - b.evNoPlay));
      localFolds.sort((a, b) => (b.evPlay - b.evNoPlay) - (a.evPlay - a.evNoPlay));
    }

    setBets(localBets);
    setFolds(localFolds);
  };

  return (
    <div className="container mt-4">
      <h1>Ultimate Texas Hold'em River EV Calculator</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-row">
          <div className="form-group col-md-2">
            <label htmlFor="ante_size">Ante Size:</label>
            <input 
              type="number" 
              className="form-control" 
              id="ante_size" 
              value={anteSize} 
              onChange={(e) => setAnteSize(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="form-group col-md-2">
            <label htmlFor="blind_size">Blind Size:</label>
            <input 
              type="number" 
              className="form-control" 
              id="blind_size" 
              value={blindSize} 
              onChange={(e) => setBlindSize(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="form-group col-md-2">
            <label htmlFor="river_betsize">River Bet Size:</label>
            <input 
              type="number" 
              className="form-control" 
              id="river_betsize" 
              value={riverBetSize} 
              onChange={(e) => setRiverBetSize(parseInt(e.target.value) || 0)} 
            />
          </div>
        </div>

        <div className="form-row">
          <div className="col-md-6 mb-3">
            <label>Fold EV: <span id="foldEvValue">{foldEv.toFixed(4)}</span></label>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group col-md-4">
            <label htmlFor="board">Board Cards:</label>
            <input 
              type="text" 
              className="form-control" 
              id="board" 
              value={board} 
              onChange={(e) => setBoard(e.target.value)} 
            />
          </div>
          <div className="form-group col-md-2 d-flex align-items-end">
            <button type="button" className="btn btn-primary" onClick={() => handleRandomCards("board")}>
              Random Board
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group col-md-4">
            <label htmlFor="dead">Dead Cards:</label>
            <input 
              type="text" 
              className="form-control" 
              id="dead" 
              value={dead} 
              onChange={(e) => setDead(e.target.value)} 
            />
          </div>
          <div className="form-group col-md-2">
            <label htmlFor="numDead"># Random Dead:</label>
            <input 
              type="number" 
              className="form-control" 
              id="numDead" 
              value={numDead} 
              onChange={(e) => setNumDead(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="form-group col-md-2 d-flex align-items-end">
            <button type="button" className="btn btn-primary" onClick={() => handleRandomCards("dead")}>
              Random Dead
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group col-md-4">
            <label htmlFor="holeCards">Hole Cards (optional):</label>
            <input 
              type="text" 
              className="form-control" 
              id="holeCards" 
              value={holeCards} 
              onChange={(e) => setHoleCards(e.target.value)} 
            />
          </div>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleCalculate}>
          Calculate EVs
        </button>
      </form>

      {error && <div className="mt-2 text-danger">{error}</div>}
      
      <EVResultsTable bets={bets} folds={folds} />
    </div>
  );
};

export default App;