let socket = io();
let gameState = {};
let playerUserId;
let selectedPlayerCard = null;
let turnTimer;
let remainingTime = 30;
let isTurn;

function logError(message, error = null) {
    console.error(`[ERROR] ${message}`);
    if (error) {
        console.error(error);
    }
}

function logInfo(message) {
    console.log(`[INFO] ${message}`);
}

socket.on('error', (message) => {
    console.error('Error:', message);
});

socket.on('connect', () => {
    logInfo('Connected to server via socket.io');
});

socket.on('disconnect', () => {
    logInfo('Disconnected from server');
});

socket.on('set-userId', (data) => {
    try {
        sessionStorage.setItem("userId", data.userId);
        playerUserId = sessionStorage.getItem('userId');
        logInfo(`User ID set: ${playerUserId}`);
    } catch (error) {
        logError('Failed to set user ID', error);
    }
});

const searchGameBtn = document.getElementById('search-game-btn');
searchGameBtn.addEventListener('click', () => {
    if (socket && socket.connected) {
        socket.emit('start-search');
        const turnButton = document.getElementById('search-game-btn');
        turnButton.disabled = true;
        logInfo('Game search started');
    } else {
        logError('Socket.io is not connected');
    }
});

const logoutBtn = document.getElementById('logout');
logoutBtn.addEventListener('click', () => {
    sessionStorage.clear();
});

const backToLobbyButton = document.querySelectorAll('.back-to-lobby');
backToLobbyButton.forEach(button => {
    const mainContainer = document.getElementById('main-container');
    const winContainer = document.getElementById('win-container');
    const loseContainer = document.getElementById('lose-container');
    button.addEventListener('click', () => {
        mainContainer.style.display = 'block';
        winContainer.style.display = 'none';
        loseContainer.style.display = 'none';
        document.body.style.backgroundImage = "";
    });
});

socket.on('game-search-status', (data) => {
    logInfo(`Search status: ${data.status}`);

    const searchStatusDiv = document.getElementById('search-status');
    const additionSearchStatusDiv = document.getElementById('addition-search-status');
    const additionSearchMessageSpan = document.getElementById('addition-search-message');

    if (data.status === 'searching') {
        if (data.message) {
            additionSearchMessageSpan.textContent = data.message;
            additionSearchStatusDiv.style.display = 'block';
        } else {
            additionSearchStatusDiv.style.display = 'none';
        }

        searchStatusDiv.style.display = 'block';
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('main-container').style.display = 'block';
    } else if (data.status === 'found') {
        const turnButton = document.getElementById('search-game-btn');
        turnButton.disabled = false;
        searchStatusDiv.style.display = 'none';
        additionSearchStatusDiv.style.display = 'none';
        additionSearchMessageSpan.style.display = 'none';
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
    } else if (data.status === 'stop-searching') {
        if (data.message) {
            additionSearchMessageSpan.textContent = data.message;
            additionSearchStatusDiv.style.display = 'block';
            additionSearchMessageSpan.style.display = 'block';
        }

        searchStatusDiv.style.display = 'none';
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('main-container').style.display = 'block';
    }
});

socket.on('start-game', (data) => {
    logInfo('Game started');
    gameState = data;

    const playerUserId = sessionStorage.getItem('userId');
    const player = data.players.find(player => String(player.id) === playerUserId);
    const opponent = data.players.find(player => String(player.id) !== playerUserId);
    const turnButton = document.getElementById('turn-button');
    const giveUp = document.getElementById('give-up');

    if (player.isCurrentTurn) {
        turnButton.textContent = "My move";
        turnButton.disabled = false;
        startTurnTimer(); // Start the timer at the beginning of the player's turn
        isTurn = true; // Remember whose turn it is
    } else {
        turnButton.textContent = "The opponent's move";
        turnButton.disabled = true;
        isTurn = false;
    }

    giveUp.addEventListener('click', () => {
        socket.emit('give-up');
        isTurn = false;
    });

    turnButton.addEventListener('click', () => {
        if (player.isCurrentTurn) {
            socket.emit('end-turn');
            logInfo('Player ended turn, passing to opponent');
            turnButton.disabled = true;
            isTurn = false;
            stopTurnTimer();
        }
    });

    if (player) {
        renderPlayerData(player);
        highlightAffordableCards(player);
    }

    if (opponent) {
        renderOpponentData(opponent);
    }

    const playerActiveCardsContainer = document.getElementById('player-board-row');
    playerActiveCardsContainer.innerHTML = '';

    const opponentActiveCardContainer = document.getElementById('opponent-board-row');
    opponentActiveCardContainer.innerHTML = '';
});

socket.on('game-over', (data) => {
    logInfo('Game over');
    stopTurnTimer();
    updateTimerDisplay(30);
    isTurn = false;

    const gameContainer = document.getElementById('game-container');
    const mainContainer = document.getElementById('main-container');
    const winContainer = document.getElementById('win-container');
    const loseContainer = document.getElementById('lose-container');

    mainContainer.style.display = 'none';
    gameContainer.style.display = 'none';

    if (data.winner == playerUserId) {
        winContainer.style.display = 'block';
        document.body.style.backgroundImage = "url('../images/backgrounds/paradise.png')";
    } else {
        loseContainer.style.display = 'block';
        document.body.style.backgroundImage = "url('../images/backgrounds/hell.png')";
    }
});

socket.on('update-game-state', (data) => {
    logInfo('Game state updated');
    gameState = data;

    const player = gameState.players.find(player => String(player.id) === playerUserId);

    // Update text on button
    const turnButton = document.getElementById('turn-button');

    if (player.isCurrentTurn) {
        turnButton.textContent = "My move";
        turnButton.disabled = false;
        turnButton.onclick = () => {
            socket.emit('end-turn');
            logInfo('Player ended turn, passing to opponent');
            turnButton.disabled = true;
            clearInterval(turnTimer);
            isTurn = false;
        };

        // Check if the current player has changed
        if (!isTurn) {
            startTurnTimer();
            isTurn = true; // Let's see who's walking now
        }
    } else {
        turnButton.textContent = "The opponent's move";
        turnButton.disabled = true;

        if (turnTimer) {
            stopTurnTimer();
        }
    }

    if (player) {
        renderPlayerData(player);
        highlightAffordableCards(player);

        const playerActiveCardsContainer = document.getElementById('player-board-row');
        playerActiveCardsContainer.innerHTML = '';
        player.activeCards.forEach(card => {
            const cardElement = createCardElement(card);
            playerActiveCardsContainer.appendChild(cardElement);

            if (card.isActive) {
                cardElement.addEventListener('click', function () {
                    const player = gameState.players.find(player => String(player.id) === playerUserId);
                    if (player.isCurrentTurn) {
                        if (selectedPlayerCard) {
                            selectedPlayerCard.classList.remove('highlight');
                        }
                        cardElement.classList.add('highlight');
                        selectedPlayerCard = cardElement;
                        addOpponentHighlights();
                        logInfo(`Card with ID ${card.id} is highlighted.`);
                    }
                });
            }
        });

        const opponent = gameState.players.find(player => String(player.id) !== playerUserId);
        if (opponent) {
            renderOpponentData(opponent);

            const opponentActiveCardContainer = document.getElementById('opponent-board-row');
            opponentActiveCardContainer.innerHTML = '';
            opponent.activeCards.forEach(card => {
                const cardElement = createCardElement(card);
                opponentActiveCardContainer.appendChild(cardElement);

                cardElement.addEventListener('click', function () {
                    if (selectedPlayerCard) {
                        const playerCardId = selectedPlayerCard.dataset.cardId;
                        socket.emit('attack-opponent-card', playerCardId, card.id);
                        selectedPlayerCard.classList.remove('highlight');
                        removeOpponentHighlights();
                        selectedPlayerCard = null;
                        logInfo(`Attacked opponent's card with ID ${card.id} using player's card with ID ${playerCardId}.`);
                    }
                });
            });

            const opponentIcon = document.querySelector('.top-player img');
            opponentIcon.addEventListener('click', function () {
                if (selectedPlayerCard) {
                    const playerCardId = selectedPlayerCard.dataset.cardId;
                    socket.emit('attack-opponent', playerCardId);
                    selectedPlayerCard.classList.remove('highlight');
                    removeOpponentHighlights();
                    selectedPlayerCard = null;
                    logInfo(`Attacked opponent using player's card with ID ${playerCardId}.`);
                }
            });
        }
    }
});

function startTurnTimer() {
    remainingTime = 30; // Reset the timer to 60 seconds
    updateTimerDisplay(remainingTime); // Updating the timer display

    if (turnTimer) {
        clearInterval(turnTimer); // Clear the previous timer, if there was one
    }

    turnTimer = setInterval(() => {
        remainingTime--;
        updateTimerDisplay(remainingTime);

        if (remainingTime <= 0) {
            clearInterval(turnTimer);
            isTurn = false;
            socket.emit('end-turn');
            logInfo('Turn automatically ended due to timer');
        }
    }, 1000);
}

function updateTimerDisplay(time) {
    const timerElement = document.getElementById('turn-timer');
    if (timerElement) {
        timerElement.textContent = time;
    }
}

function stopTurnTimer() {
    clearInterval(turnTimer);
}

function renderPlayerData(player) {
    document.getElementById('player-login').textContent = player.login;
    document.querySelector('.bottom-player img').src = `/images/user_icons/${player.icon_file_name}`;
    document.querySelector('.health_point_1').textContent = `Health: ${player.health}`;
    document.getElementById('player-coins').textContent = `Coins: ${player.coins}`;

    const playerCardsContainer = document.getElementById('player-cards');
    playerCardsContainer.innerHTML = '';
    player.cards.forEach(card => {
        const cardElement = createCardElement(card);
        playerCardsContainer.appendChild(cardElement);
    });
}

function renderOpponentData(opponent) {
    document.getElementById('opponent-login').textContent = opponent.login;
    document.querySelector('.top-player img').src = `/images/user_icons/${opponent.icon_file_name}`;
    document.querySelector('.health_point').textContent = `Health: ${opponent.health}`;
    document.getElementById('opponent-coins').textContent = `Coins: ${opponent.coins}`;

    const opponentCardsContainer = document.getElementById('opponent-cards');
    opponentCardsContainer.innerHTML = '';
    for (let i = 0; i < opponent.cards.length; i++) {
        const cardElement = document.createElement('li');
        cardElement.className = 'card back';
        cardElement.style.backgroundImage = "url('../images/backgrounds/back2.png')";
        opponentCardsContainer.appendChild(cardElement);
    }
}

function selectedCard(card_id, card_price) {
    const player = gameState.players.find(player => String(player.id) === sessionStorage.getItem('userId'));

    if (player.coins >= card_price) {
        socket.emit('buy-card', {cardId: card_id});
        logInfo(`Card with ID ${card_id} sent for purchase.`);
    } else {
        logError('Not enough coins to buy this card.');
    }
}

function addOpponentHighlights() {
    const opponentActiveCards = document.querySelectorAll('#opponent-board-row .card');
    opponentActiveCards.forEach(card => card.classList.add('opponent-highlight'));

    const opponentIcon = document.querySelector('.top-player img');
    opponentIcon.classList.add('opponent-highlight');
}

function removeOpponentHighlights() {
    const opponentActiveCards = document.querySelectorAll('#opponent-board-row .card');
    opponentActiveCards.forEach(card => card.classList.remove('opponent-highlight'));

    const opponentIcon = document.querySelector('.top-player img');
    opponentIcon.classList.remove('opponent-highlight');
}

function createCardElement(card) {
    const cardElement = document.createElement('li');
    cardElement.className = 'card';
    cardElement.dataset.cardId = card.id;
    cardElement.innerHTML = `
        <div class="card-background">
            <img src="/images/cards/${card.image_file_name}" alt="${card.character_name}" class="card-img-top">
        </div>
        <div class="card-body">
            <h5>${card.character_name}</h5>
            <p>${card.description}</p>
        </div>
        <table class="card-table">
            <tr>
                <th>Attack</th>
                <th>Defense</th>
                <th>Cost</th>
            </tr>
            <tr>
                <td>${card.attack_points}</td>
                <td>${card.defense_points}</td>
                <td>${card.price}</td>
            </tr>
        </table>
    `;

    if (!card.hasOwnProperty('isActive')) {
        cardElement.addEventListener('click', function () {
            const player = gameState.players.find(player => String(player.id) === playerUserId);
            if (player.isCurrentTurn) {
                selectedCard(card.id, card.price);
            }
        });
    }

    if (card.hasOwnProperty('isActive') && !card.isActive) {
        cardElement.style.opacity = '0.5';
    }

    return cardElement;
}

function highlightAffordableCards(player) {
    const playerCardsContainer = document.getElementById('player-cards');
    const cards = playerCardsContainer.querySelectorAll('.card');

    cards.forEach(card => {
        const cardPrice = parseInt(card.querySelector('.card-table tr:nth-child(2) td:nth-child(3)').textContent);
        if (player.coins >= cardPrice) {
            card.classList.add('affordable');
        } else {
            card.classList.remove('affordable');
        }
    });
}

function createCard(character) {
    return `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-3 mb-4">
            <div class="card">
                <div class="card-background">
                    <img src="${character.imageUrl}" alt="${character.name}" class="card-img-top">
                </div>
                <div class="card-body">
                    <h5>${character.name}</h5>
                    <p>${character.description}</p>
                </div>
                <table class="card-table">
                    <tr>
                        <th>Attack</th>
                        <th>Defense</th>
                        <th>Price</th>
                    </tr>
                    <tr>
                        <td>${character.attack}</td>
                        <td>${character.defense}</td>
                        <td>${character.cost}</td>
                    </tr>
                </table>
            </div>
        </div>
        `;
}