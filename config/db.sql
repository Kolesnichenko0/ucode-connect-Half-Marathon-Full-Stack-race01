CREATE DATABASE IF NOT EXISTS card_game_db;

GRANT ALL ON card_game_db.* TO 'dkolesnych'@'localhost';
GRANT ALL ON card_game_db.* TO 'vzharyi'@'localhost';
GRANT ALL ON card_game_db.* TO 'alukash'@'localhost';

USE card_game_db;

CREATE TABLE IF NOT EXISTS icons (
    id INT UNSIGNED AUTO_INCREMENT NOT NULL,
    file_name VARCHAR(30) DEFAULT ('icon_1.png'),
    CONSTRAINT icons_id_pk PRIMARY KEY (id),
    CONSTRAINT icons_file_name_uq UNIQUE (file_name)
);

create TABLE IF NOT EXISTS users(
    id INT UNSIGNED AUTO_INCREMENT NOT NULL,
    login VARCHAR(30) NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    icon_id INT UNSIGNED DEFAULT (1),
    CONSTRAINT users_id_pk PRIMARY KEY (id),
    CONSTRAINT users_login_uq UNIQUE (login),
    CONSTRAINT users_email_uq UNIQUE (email),
    CONSTRAINT users_icons_icon_id_FK FOREIGN KEY (icon_id) REFERENCES icons(id) ON DELETE RESTRICT
);

create TABLE IF NOT EXISTS cards(
    id INT UNSIGNED AUTO_INCREMENT NOT NULL,
    character_name VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    attack_points INT UNSIGNED NOT NULL,
    defense_points INT UNSIGNED NOT NULL,
    price INT UNSIGNED NOT NULL,
    image_file_name VARCHAR(30) NOT NULL,
    CONSTRAINT cards_id_pk PRIMARY KEY (id),
    CONSTRAINT cards_character_name_uq UNIQUE (character_name)
);

INSERT INTO cards (character_name, description, attack_points, defense_points, price, image_file_name)
VALUES
('Bee', 'Brave pilot', 3, 2, 1, 'hero_1.png'),
('Pig', 'Fierce boar', 4, 3, 1, 'hero_2.png'),
('Creeper', 'Silent destroyer', 6, 1, 2, 'hero_3.png'),
('Archers', 'Fighter duo', 5, 4, 2, 'hero_4.png'),
('Steve with Sword', 'Fearless warrior', 8, 6, 3, 'hero_5.png'),
('Gamer', 'Master of the sword', 9, 7, 3, 'hero_6.png'),
('Bowman', 'Sharp-eyed hunter', 7, 5, 2, 'hero_7.png'),
('Armored Steve', 'Mighty defender', 5, 9, 3, 'hero_8.png'),
('Warrior Chicken', 'Brave and bold', 4, 4, 1, 'hero_9.png'),
('Zombie Warrior', 'Strong and unstoppable', 7, 6, 3, 'hero_10.png'),
('Zombie Marauder', 'Greedy raider', 6, 4, 2, 'hero_11.png'),
('Wolf Guardian', 'Loyal and fierce', 6, 5, 2, 'hero_12.png'),
('Zombie Rider', 'Agile and cunning', 7, 4, 3, 'hero_13.png'),
('Skeleton Knight', 'Swift warrior', 6, 5, 2, 'hero_14.png'),
('Enderman', 'Mysterious and fast', 8, 3, 3, 'hero_15.png'),
('Wild Wolf', 'Ferocious hunter', 7, 4, 2, 'hero_16.png'),
('Phantom', 'Swift and treacherous', 5, 4, 2, 'hero_17.png'),
('Ghast', 'Floating terror', 9, 2, 3, 'hero_18.png'),
('Iron Golem', 'Powerful protector', 3, 10, 3, 'hero_19.png'),
('Wither', 'Dangerous and destructive', 10, 7, 4, 'hero_20.png');

INSERT INTO icons (file_name)
VALUES
('icon_1.png'),
('icon_2.png'),
('icon_3.png'),
('icon_4.png'),
('icon_5.png');

INSERT INTO users (login, password, full_name, email, icon_id)
VALUES
('john_doe', 'Password123@', 'John Doe', 'john.doe@example.com', 1),
('jane_smith', 'SecurePass!45', 'Jane Smith', 'jane.smith@example.com', 2),
('alice_wonder', 'AliceInWonderland1@', 'Alice Wonderland', 'alice.wonder@example.com', 3),
('bob_builder', 'CanWeFixIt!2', 'Bob Builder', 'bob.builder@example.com', 4),
('charlie_brown', 'GoodGrief!3@', 'Charlie Brown', 'charlie.brown@example.com', 5);