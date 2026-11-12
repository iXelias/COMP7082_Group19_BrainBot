# COMP7082_Group19_BrainBot
A Discord bot for creating, studying, and sharing flashcards in any Discord server.

## Prerequisites
Before setting up the project, make sure you have the following installed:
- [Node.js](https://nodejs.org) (v18 or higher recommended)
- [Git](https://git-scm.com)
- Access to the project's MongoDB Atlas cluster and Discord Developer Portal application

## Setup & Installation

### 1. Clone the Repository
Open your terminal and clone the project to your local machine:
```bash
git clone https://github.com/iXelias/COMP7082_Group19_BrainBot.git
cd COMP7082_Group19_BrainBot
```

### 2. Install Dependencies
Install all required Node packages (`discord.js`, `mongoose`, `dotenv`):
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` (or create a new `.env` file in the root folder) and fill in the required values:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
DISCORD_TOKEN=your_discord_bot_token
```
- **MONGODB_URI:** The MongoDB Atlas connection string (ask a team member for it; never commit it).
- **DISCORD_TOKEN:** The BrainBot token from the Discord Developer Portal.

### 4. Discord Developer Portal & Bot Invite (First-Time Setup)
If you are running your own test instance of the bot:
1. Open the [Discord Developer Portal](https://discord.com) and select the application.
2. Go to the **Bot** tab, enable **Message Content Intent**, and copy your **Token** for the `.env` file.
3. Go to **OAuth2 > URL Generator**, check `bot` and `applications.commands`, select `Send Messages` / `Read Message History` permissions, and open the generated URL to invite the bot to your test server.

### 5. Run the Bot
Start the bot from the root directory:
```bash
node index.js
```

**Expected Console Output:**
```text
Loaded command: /create-card (createCard.js)
Loaded command: /create-deck (createDeck.js)
Loaded command: /delete-card (deleteCard.js)
Loaded command: /delete-deck (deleteDeck.js)
Loaded command: /list-cards (listCards.js)
Loaded command: /list-decks (listDecks.js)
Loaded command: /quiz (quiz.js)
Bot is online as BrainBot#1176
Connected to MongoDB
Started refreshing 7 application commands.
Successfully reloaded application commands.
```

## Verifying Setup & Available Commands
Once the bot is online in Discord (press `Ctrl + R` in Discord if slash commands do not appear immediately):
- `!ping` — Quick connectivity test (bot replies `Pong!`).
- `/create-deck` — Create a new flashcard deck.
- `/list-decks` — View all of your saved decks.
- `/create-card` — Add a question and answer to a deck.
- `/list-cards` — View all flashcards inside a deck.
- `/quiz` — Quiz yourself on a random card from a deck with a private answer reveal button.
- `/delete-card` — Delete a specific flashcard from a deck.
- `/delete-deck` — Delete a deck and all flashcards inside it.

### Running Database Tests
To verify MongoDB connectivity and schema validation independently of Discord:
```bash
node src/testing/test-connection.js
node src/testing/test-services.js
```

## Database Schema
BrainBot uses MongoDB with Mongoose. There are two collections.

### Deck
- `title` (String, required, 1–100 characters)
- `description` (String, optional, up to 300 characters)
- `topic` (String, optional)
- `ownerId` (String, required): Discord user ID of the creator
- `createdAt`, `updatedAt` (Date, automatic)

### Flashcard
- `deckId` (ObjectId, required): the deck the card belongs to
- `question` (String, required, 1–500 characters)
- `answer` (String, required, 1–500 characters)
- `createdAt`, `updatedAt` (Date, automatic)

### Relationships and Rules
- One deck has many flashcards; each flashcard belongs to one deck.
- A user cannot have two decks with the same title.
- Deleting a deck deletes its flashcards.

## Setup Verification & Issues Log
*(For Sprint Verification: Have a teammate follow these steps from scratch and document any setup issues or fixes below.)*

| Date | Tester | Result | Issues Encountered & Resolution |
| :--- | :--- | :--- | :--- |
| YYYY-MM-DD | Name | Pass / Fail | e.g., Slash commands took 5 mins to appear; resolved with `Ctrl + R`. |
