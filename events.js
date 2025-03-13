document.getElementById("calculateBtn").addEventListener("click", validateAndCalculate);
document.getElementById("randomDeadBtn").addEventListener("click", () => generateRandomCards("dead"));
document.getElementById("randomBoardBtn").addEventListener("click", () => generateRandomCards("board"));

function updateFoldEv() {
    const ante = parseFloat(document.getElementById("ante_size").value) || 0;
    const blind = parseFloat(document.getElementById("blind_size").value) || 0;
    document.getElementById("foldEvValue").textContent = (-(ante + blind)).toFixed(4);
}

document.getElementById("ante_size").addEventListener("input", updateFoldEv);
document.getElementById("blind_size").addEventListener("input", updateFoldEv);

updateFoldEv(); // Initial calculation

function generateRandomCards(targetId) {
    const numCards = targetId === "dead" ? parseInt(document.getElementById("numDead").value) : 5; // numDead for dead, 5 for board
    const boardCards = document.getElementById("board").value.match(/[23456789TJQKA][cdhs]/g) || [];
    const deadCards = document.getElementById("dead").value.match(/[23456789TJQKA][cdhs]/g) || [];
    const allUsedCards = new Set([...boardCards, ...deadCards]);

    const ranks = "23456789TJQKA";
    const suits = "cdhs";
    const deck = [];

    for (const rank of ranks) {
        for (const suit of suits) {
            const card = rank + suit;
            if (!allUsedCards.has(card)) {
                deck.push(card);
            }
        }
    }

    // Yates-Fisher shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    let randomCards = "";
    for (let i = 0; i < numCards && i < deck.length; i++) {
        randomCards += deck[i];
    }

    document.getElementById(targetId).value = randomCards;
}
