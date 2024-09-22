const User = require("../models/user");
const Card = require('../models/card');
const Icon = require('../models/icon');
const cardModel = new Card();
const userModel = new User();
const iconModel = new Icon();

let roomCount = 0;
const rooms = {};
const gameStates = {};
let shuffledCards = [];

function logError(message, error = null) {
    console.error(`[ERROR] ${message}`, error ? `: ${error.message}` : '');
}

function logInfo(message) {
    console.log(`[INFO] ${message}`);
}

module.exports = function (io) {
    io.on("connection", (socket) => {
            logInfo(`A user connected: ${socket.id}`);

            socket.on('start-search', async () => {
                logInfo('User started searching for a game');

                const userId = socket.handshake.session.userId; // Getting userId from session
                if (!userId) {
                    logError('User ID not found in session');
                    return;
                }
                socket.emit('set-userId', {userId});
                logInfo(`User ID set: ${userId}`);

                const roomName = `room-${roomCount}`;
                const room = io.sockets.adapter.rooms.get(roomName);
                const numClients = room ? room.size : 0;

                if (numClients === 0) {
                    // First player, create a new room
                    socket.join(roomName);
                    rooms[roomName] = {users: [userId], sockets: [socket.id]};
                    socket.emit('game-search-status', {status: 'searching'});
                    logInfo(`Player ${socket.id} joined new room ${roomName}`);
                } else if (numClients === 1) {
                    // The second player joins an existing room
                    socket.join(roomName);
                    rooms[roomName].users.push(userId);
                    rooms[roomName].sockets.push(socket.id);
                    roomCount++;

                    io.to(roomName).emit('game-search-status', {
                        status: 'found',
                        message: 'Second player found. Game starting!'
                    });

                    try {
                        const players = await getPlayersInfo(rooms[roomName].users, rooms[roomName].sockets);
                        await initializeCards();
                        const initialGameState = await initializeGame(players);
                        gameStates[roomName] = initialGameState;
                        io.to(roomName).emit('start-game', initialGameState);
                        logInfo(`Player ${socket.id} joined room ${roomName}`);
                    } catch (error) {
                        logError('Error initializing game', error);
                    }
                } else {
                    socket.emit('full', 'This room is full, try another one.');
                    logError('Room is full');
                }
            });

            socket.on('buy-card', (data) => {
                const {cardId} = data;
                const roomName = Object.keys(rooms).find(room => rooms[room].sockets.includes(socket.id));
                const gameState = gameStates[roomName];
                if (!gameState) {
                    logError('Game state not found for room:', roomName);
                    return;
                }
                const player = findPlayerBySocketId(socket.id, gameState);
                const card = findCardById(cardId, gameState);

                if (card && player && player.coins >= card.price && player.isCurrentTurn) {
                    player.coins -= card.price;

                    player.activeCards.push({
                        id: card.id,
                        character_name: card.character_name,
                        description: card.description,
                        attack_points: card.attack_points,
                        defense_points: card.defense_points,
                        price: card.price,
                        image_file_name: card.image_file_name,
                        isActive: false
                    });

                    player.cards = player.cards.filter(c => c.id !== cardId);

                    io.to(roomName).emit('update-game-state', gameState);
                    logInfo(`Player ${player.id} bought card ${cardId}`);
                } else {
                    socket.emit('error', {message: 'Not enough coins or card not found'});
                    logError('Not enough coins or card not found');
                }
            });

            socket.on('end-turn', () => {
                const roomName = Object.keys(rooms).find(room => rooms[room].sockets.includes(socket.id));
                const gameState = gameStates[roomName];
                if (!gameState) {
                    logError('Game state not found for room:', roomName);
                    return;
                }
                const player = findPlayerBySocketId(socket.id, gameState);
                if (player && player.isCurrentTurn) {
                    player.coins += 2;

                    const opponent = gameState.players.find(p => p.id !== player.id);

                    if (opponent) {
                        // Create a set of all card IDs that are already in use by the opponent
                        const usedCardIds = new Set(opponent.cards.map(card => card.id).concat(opponent.activeCards.map(card => card.id)));

                        // Filter the shuffledCards array to exclude the used cards
                        const availableCards = shuffledCards.filter(card => !usedCardIds.has(card.id));

                        if (availableCards.length > 0) {
                            const randomIndex = Math.floor(Math.random() * availableCards.length);
                            const newCard = availableCards[randomIndex];
                            opponent.cards.push(newCard);
                        }
                    }

                    player.activeCards.forEach(card => {
                        if (!card.isActive) {
                            card.isActive = true;
                        }
                    });

                    const currentPlayerIndex = gameState.players.findIndex(p => p.id === player.id);
                    const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
                    gameState.players.forEach((p, index) => {
                        p.isCurrentTurn = index === nextPlayerIndex;
                    });

                    io.to(roomName).emit('update-game-state', gameState);
                    logInfo(`Player ${player.id} ended turn`);
                } else {
                    logError('Player not found or not current turn');
                }
            });

            socket.on('attack-opponent', (cardId) => {
                const roomName = Object.keys(rooms).find(room => rooms[room].sockets.includes(socket.id));
                const gameState = gameStates[roomName];
                if (!gameState) {
                    logError('Game state not found for room:', roomName);
                    return;
                }
                const player = findPlayerBySocketId(socket.id, gameState);

                if (player) {
                    const card = player.activeCards.find(c => c.id == cardId && c.isActive);

                    if (card) {
                        const opponent = gameState.players.find(p => p.id !== player.id);

                        if (opponent) {
                            opponent.health -= card.attack_points;

                            player.activeCards = player.activeCards.filter(c => c.id != card.id);

                            if (opponent.health <= 0) {
                                gameState.gameEnded = true;
                                io.to(roomName).emit('game-over', {
                                    winner: player.id,
                                    loser: opponent.id
                                });
                                delete rooms[roomName];
                                logInfo(`Game over. Winner: ${player.id}, Loser: ${opponent.id}`);
                            } else {
                                io.to(roomName).emit('update-game-state', gameState);
                                logInfo(`Player ${player.id} attacked opponent ${opponent.id} with card ${cardId}`);
                            }
                        }
                    } else {
                        socket.emit('error', 'Invalid card or card is not active.');
                        logError('Invalid card or card is not active');
                    }
                } else {
                    socket.emit('error', 'Player not found.');
                    logError('Player not found');
                }
            });

            socket.on('attack-opponent-card', (playerCardId, opponentCardId) => {
                const roomName = Object.keys(rooms).find(room => rooms[room].sockets.includes(socket.id));
                const gameState = gameStates[roomName];
                if (!gameState) {
                    logError('Game state not found for room:', roomName);
                    return;
                }
                const player = findPlayerBySocketId(socket.id, gameState);

                if (player) {
                    const playerCard = player.activeCards.find(c => c.id == playerCardId && c.isActive);

                    if (playerCard) {
                        const opponent = gameState.players.find(p => p.id !== player.id);

                        if (opponent) {
                            const opponentCard = opponent.activeCards.find(c => c.id == opponentCardId && c.isActive);

                            if (opponentCard) {
                                const attackPoints = Math.min(playerCard.attack_points, opponentCard.defense_points);

                                opponentCard.defense_points -= attackPoints;
                                playerCard.attack_points -= attackPoints;

                                if (playerCard.attack_points <= 0) {
                                    player.activeCards = player.activeCards.filter(c => c.id != playerCardId);
                                }

                                if (opponentCard.defense_points <= 0) {
                                    opponent.activeCards = opponent.activeCards.filter(c => c.id != opponentCardId);
                                }

                                io.to(roomName).emit('update-game-state', gameState);
                                logInfo(`Player ${player.id} attacked opponent's card ${opponentCardId} with card ${playerCardId}`);
                            } else {
                                socket.emit('error', 'Invalid opponent card or card is not active.');
                                logError('Invalid opponent card or card is not active');
                            }
                        }
                    } else {
                        socket.emit('error', 'Invalid player card or card is not active.');
                        logError('Invalid player card or card is not active');
                    }
                } else {
                    socket.emit('error', 'Player not found.');
                    logError('Player not found');
                }
            });

            socket.on('give-up', () => {
                const roomName = Object.keys(rooms).find(room => rooms[room].sockets.includes(socket.id));
                const gameState = gameStates[roomName];
                if (!gameState) {
                    logError('Game state not found for room:', roomName);
                    return;
                }
                const player = findPlayerBySocketId(socket.id, gameState);

                if (player) {
                    const opponent = gameState.players.find(p => p.id !== player.id);

                    if (opponent) {
                        gameState.gameEnded = true;
                        io.to(roomName).emit('game-over', {
                            winner: opponent.id,
                            loser: player.id
                        });
                        delete rooms[roomName];
                        logInfo(`Game over. Winner: ${opponent.id}, Loser: ${player.id}`);
                    } else {
                        io.to(roomName).emit('update-game-state', gameState);
                        logInfo(`Player ${player.id} attacked opponent ${opponent.id} with card ${cardId}`);
                    }
                } else {
                    socket.emit('error', 'Player not found.');
                    logError('Player not found');
                }
            });

            socket.on('disconnect', () => {
                logInfo(`A user disconnected: ${socket.id}`);
                for (const roomName in rooms) {
                    const roomPlayers = rooms[roomName].sockets;
                    if (roomPlayers.includes(socket.id)) {
                        roomPlayers.splice(roomPlayers.indexOf(socket.id), 1);
                        const gameState = gameStates[roomName];
                        if (roomPlayers.length === 0) {
                            delete rooms[roomName];
                        } else if (!gameState.gameEnded) {
                            io.to(roomName).emit('game-search-status', {
                                status: 'stop-searching',
                                message: 'The player has disconnected. You\'re back in the lobby.'
                            });
                            delete rooms[roomName];
                        }
                        break;
                    }
                }
            });
        }
    )
    ;

    async function initializeCards() {
        try {
            const cards = await cardModel.findAll();
            if (!Array.isArray(cards)) {
                throw new Error('Expected an array of cards');
            }

            shuffledCards = cards.sort(() => 0.5 - Math.random());
            logInfo('Cards initialized and shuffled');
        } catch (error) {
            logError('Error initializing cards', error);
        }
    }

    async function initializeGame(players) {
        const initialHealth = 40;
        const initialCoins = 1;
        const initialCardsCount = 3;

        const randomStart = Math.random() >= 0.5;

        return {
            players: players.map((player, index) => ({
                id: player.id,
                socket_id: player.socket_id,
                login: player.login,
                icon_file_name: player.icon_file_name,
                health: initialHealth,
                coins: initialCoins,
                cards: shuffledCards.slice(3 * index, initialCardsCount + 3 * index).map(card => ({
                    id: card.id,
                    character_name: card.character_name,
                    description: card.description,
                    attack_points: card.attack_points,
                    defense_points: card.defense_points,
                    price: card.price,
                    image_file_name: card.image_file_name
                })),
                isCurrentTurn: index === 0 ? randomStart : !randomStart, // Randomly assign true/false
                activeCards: []
            })),
            gameEnded: false
        };
    }

    async function getPlayersInfo(userIds, socketIds) {
        try {
            const users = await Promise.all(userIds.map(async (id, index) => {
                const user = new User();
                const icon = new Icon();
                const userData = await user.find(id);
                const iconData = await icon.find(userData.icon_id);

                if (!userData) {
                    logError(`User with id ${id} not found`);
                    return null;
                }

                logInfo(`User found: ${userData.id}`);
                return {
                    id: userData.id,
                    login: userData.login,
                    icon_file_name: iconData.file_name,
                    socket_id: socketIds[index]
                };
            }));
            return users;
        } catch (error) {
            logError('Error fetching player info', error);
        }
    }

    function findPlayerBySocketId(socketId, gameState) {
        if (!gameState || !gameState.players) {
            logError('Game state or players not found');
            return null;
        }
        return gameState.players.find(player => player.socket_id == socketId);
    }

    function findCardById(cardId, gameState) {
        if (!gameState || !gameState.players) {
            logError('Game state or players not found');
            return null;
        }
        return gameState.players.flatMap(player => player.cards).find(card => card.id === cardId);
    }
}