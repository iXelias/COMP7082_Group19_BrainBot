# COMP7082_Group19_BrainBot
A Discord bot for creating, studying, and sharing flashcards in any discord server.

## Environment Variables
Copy `.env.example` to `.env` and fill in the values:
- MONGODB_URI: The MongoDB Atlast connection string (ask a team member for it; never commit it)
- DISCORD_TOKEN: The BrainBot token from the Discord Developer Portal

## Database Schema
BrainBot uses MongoDB with Mongoose. There are two collections.

### Deck
- title (String, required, 1-100 characters)
- description (String, optional, up to 300 characters)
- topic (String, optional)
- ownerId (String, required): Discord user ID of the creator
- createdAt, updatedAt (Date, automatic)

### Flashcard
- deckId (ObjectId, required): the deck the card belongs to
- question (String, required, 1-500 characters)
- answer (String, required, 1-500 characters)
- createdAt, updatedAt (Date, automatic)

### Relationships and rules
- One deck has many flashcards; each flashcard belongs to one deck.
- A user cannot have two decks with the same title.
- Deleting a deck deletes its flashcards.