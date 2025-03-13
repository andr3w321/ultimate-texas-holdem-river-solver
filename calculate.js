function validateAndCalculate() {
    const board = document.getElementById("board").value;
    const dead = document.getElementById("dead").value;
    const errorMessageDiv = document.getElementById("error-message");

    if (!validateCards(board, dead)) {
        errorMessageDiv.textContent = "Error: Duplicate cards detected.";
        return;
    }

    errorMessageDiv.textContent = ""; // Clear previous error message
    calculateEV();
}

function validateCards(board, dead) {
    const cardSet = new Set();
    const allCards = (board + dead).match(/[23456789TJQKA][cdhs]/g) || [];

    for (const card of allCards) {
        if (cardSet.has(card)) {
            return false; // Duplicate found
        }
        cardSet.add(card);
    }

    return true; // No duplicates
}

function calculateEV() {
    const ante_size = parseInt(document.getElementById("ante_size").value);
    const blind_size = parseInt(document.getElementById("blind_size").value);
    const river_betsize = parseInt(document.getElementById("river_betsize").value);
    const board = document.getElementById("board").value;
    const dead = document.getElementById("dead").value;

    const cardToIntLookup = {
        '2c': 0, '2d': 1, '2h': 2, '2s': 3,
        '3c': 4, '3d': 5, '3h': 6, '3s': 7,
        '4c': 8, '4d': 9, '4h': 10, '4s': 11,
        '5c': 12, '5d': 13, '5h': 14, '5s': 15,
        '6c': 16, '6d': 17, '6h': 18, '6s': 19,
        '7c': 20, '7d': 21, '7h': 22, '7s': 23,
        '8c': 24, '8d': 25, '8h': 26, '8s': 27,
        '9c': 28, '9d': 29, '9h': 30, '9s': 31,
        'Tc': 32, 'Td': 33, 'Th': 34, 'Ts': 35,
        'Jc': 36, 'Jd': 37, 'Jh': 38, 'Js': 39,
        'Qc': 40, 'Qd': 41, 'Qh': 42, 'Qs': 43,
        'Kc': 44, 'Kd': 45, 'Kh': 46, 'Ks': 47,
        'Ac': 48, 'Ad': 49, 'Ah': 50, 'As': 51
    };

    const intToCardLookup = [
        '2c', '2d', '2h', '2s', '3c', '3d', '3h', '3s', '4c', '4d', '4h', '4s',
        '5c', '5d', '5h', '5s', '6c', '6d', '6h', '6s', '7c', '7d', '7h', '7s',
        '8c', '8d', '8h', '8s', '9c', '9d', '9h', '9s', 'Tc', 'Td', 'Th', 'Ts',
        'Jc', 'Jd', 'Jh', 'Js', 'Qc', 'Qd', 'Qh', 'Qs', 'Kc', 'Kd', 'Kh', 'Ks',
        'Ac', 'Ad', 'Ah', 'As'
    ];

    function getBlindPayout(hRank) {
      if (hRank === 1) return 500;
      else if (phe.handRank(hRank) === phe.ranks.STRAIGHT_FLUSH) return 50;
      else if (phe.handRank(hRank) === phe.ranks.FOUR_OF_A_KIND) return 10;
      else if (phe.handRank(hRank) === phe.ranks.FULL_HOUSE) return 3;
      else if (phe.handRank(hRank) === phe.ranks.FLUSH) return 1.5;
      else if (phe.handRank(hRank) === phe.ranks.STRAIGHT) return 1;
      else return 0;
    }

    function getEV(hole0, hole1, iboard, deck) {
        let totalPayoutPlay = 0;
        let totalPayoutNoPlay = 0;
        let sims = 0;

        for (let dealer1 = 0; dealer1 < deck.length - 1; ++dealer1) {
            for (let dealer2 = dealer1 + 1; dealer2 < deck.length; ++dealer2) {
                sims++;
                const dealerRank = phe.evaluateCardCodes([deck[dealer1], deck[dealer2], ...iboard]);
                const playerRank = phe.evaluateCardCodes([hole0, hole1, ...iboard]);
                const dealerQualifies = phe.handRank(dealerRank) <= phe.ranks.ONE_PAIR;

                let payoutPlay = 0;
                let payoutNoPlay = -ante_size - blind_size;
                const playBet = blind_size * river_betsize;

                if (playerRank === dealerRank) {
                } else if (playerRank < dealerRank) {
                    const blindPayout = blind_size * getBlindPayout(playerRank);
                    payoutPlay += blindPayout;
                    if (dealerQualifies) {
                        payoutPlay += ante_size;
                    }
                    payoutPlay += playBet;
                } else {
                    payoutPlay -= blind_size;
                    if (dealerQualifies) {
                        payoutPlay -= ante_size;
                    }
                    payoutPlay -= playBet;
                }

                totalPayoutPlay += payoutPlay;
                totalPayoutNoPlay += payoutNoPlay;
            }
        }

        const totalBetPlay = ante_size + blind_size + river_betsize * blind_size;
        const totalBetNoPlay = ante_size + blind_size;

        const evPlay = totalPayoutPlay / sims;
        const evNoPlay = totalPayoutNoPlay / sims;

        return [evPlay, evNoPlay];
    }

    const iboard = [];
    for (let i = 0; i < board.length; i += 2) {
        iboard.push(cardToIntLookup[board.substr(i, 2)]);
    }

    const idead = [];
    for (let i = 0; i < dead.length; i += 2) {
        idead.push(cardToIntLookup[dead.substr(i, 2)]);
    }

    const seenCards = new Set([...iboard, ...idead]);
    const bets = [];
    const folds = [];

    for (let hole1 = 0; hole1 < 51; ++hole1) {
        if (seenCards.has(hole1)) continue;
        for (let hole2 = hole1 + 1; hole2 < 52; ++hole2) {
            if (seenCards.has(hole2)) continue;

            const holecards = intToCardLookup[hole1] + intToCardLookup[hole2];
            const deck = [];
            for (let i = 0; i < 52; ++i) {
                if (seenCards.has(i) || i === hole1 || i === hole2) continue;
                deck.push(i);
            }
            const [evPlay, evNoPlay] = getEV(hole1, hole2, iboard, deck);
            const key = { holecards, evPlay, evNoPlay };

            if (evPlay > evNoPlay) {
                bets.push(key);
            } else {
                folds.push(key);
            }
        }
    }

    bets.sort((a, b) => (a.evPlay - a.evNoPlay) - (b.evPlay - b.evNoPlay));
    folds.sort((a, b) => (b.evPlay - b.evNoPlay) - (a.evPlay - a.evNoPlay));

    const handcount = bets.length + folds.length;
    const betsPercent = (bets.length / handcount * 100).toFixed(2);
    const foldsPercent = (folds.length / handcount * 100).toFixed(2);

    let resultsHTML = `
        <p>
            <strong>Bets:</strong> ${betsPercent}% (${bets.length}/${handcount}) 
            <strong>Folds:</strong> ${foldsPercent}% (${folds.length}/${handcount})
        </p>
        <table class="table table-striped">
            <thead>
                <tr>
                    <th colspan=3>Bets</th>
                    <th colspan=3>Folds</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Hand</td>
                    <td>Net EV</td>
                    <td>Bet</td>
                    <td>Hand</td>
                    <td>Net EV</td>
                    <td>Bet</td>
                </tr>
    `;

    const maxSize = Math.max(bets.length, folds.length);
    for (let i = 0; i < maxSize; ++i) {
        let betHolecards = '';
        let betNetEv = '';
        let betEvPlay = '';

        let foldHolecards = '';
        let foldNetEv = '';
        let foldEvPlay = '';

        if (i < bets.length) {
            betHolecards = bets[i].holecards;
            betNetEv = (bets[i].evPlay - bets[i].evNoPlay).toFixed(4);
            betEvPlay = (bets[i].evPlay).toFixed(4);
        }

        if (i < folds.length) {
            foldHolecards = folds[i].holecards;
            foldNetEv = (folds[i].evPlay - folds[i].evNoPlay).toFixed(4);
            foldEvPlay = (folds[i].evPlay).toFixed(4);
        }

        resultsHTML += `
            <tr>
                <td>${betHolecards}</td>
                <td>${betNetEv}</td>
                <td>${betEvPlay}</td>
                <td>${foldHolecards}</td>
                <td>${foldNetEv}</td>
                <td>${foldEvPlay}</td>
            </tr>
        `;
    }

    resultsHTML += `
            </tbody>
        </table>
    `;

    document.getElementById("results").innerHTML = resultsHTML;
}
