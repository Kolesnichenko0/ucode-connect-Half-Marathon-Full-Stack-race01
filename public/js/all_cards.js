async function loadCards() {
    try {
        const response = await fetch('/all-cards-info');
        if (!response.ok) throw new Error('Ошибка при загрузке данных');

        const characters = await response.json();

        const cardContainer = document.querySelector('.row');
        cardContainer.innerHTML = '';
        characters.forEach(character => {
            cardContainer.innerHTML += createCard({
                name: character.character_name,
                description: character.description,
                attack: character.attack_points,
                defense: character.defense_points,
                cost: character.price,
                imageUrl: `/images/cards/${character.image_file_name}`
            });
        });
    } catch (error) {
        console.error(error.message);
    }
}

window.onload = loadCards;
