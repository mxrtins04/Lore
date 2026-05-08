# Lore

A personal AI conversation aggregation and post generation tool.

## What it does

Captures conversations from AI platforms (Claude, ChatGPT), organizes them into buckets. These buckets could be customized to give LLM's more wholeistic context to generate content more relevant to the user's needs.

## Tech Stack

- Java 21
- Spring Boot 3.3.x
- PostgreSQL
- Gemini API (via Google AI Studio)
- Chrome Extension (Manifest V3)

## Prerequisites

- Java 21
- Maven
- PostgreSQL
- A Gemini API key from https://aistudio.google.com

## Setup(Not yet deployed)

### 1. Create the database

psql -U postgres
CREATE DATABASE lore_db;

### 2. Configure environment variables

Create a .env file in the project root (never commit this):
GEMINI_API_KEY=your_gemini_api_key_here
DB_PASSWORD=your_postgres_password

### 3. Run the backend

./mvnw spring-boot:run

### 4. Install the Chrome extension

- Open chrome://extensions
- Enable Developer mode
- Click "Load unpacked"
- Select the /extension folder

## API Documentation

Once the backend is running, visit:
http://localhost:8080/swagger-ui.html

## Project Structure

src/ # Spring Boot backend
extension/ # Chrome extension
├── manifest.json
├── content.js # Intercepts AI platform requests
├── bridge.js # Routes messages to background
├── background.js # Service worker
├── popup.html # Extension popup UI
└── popup.js # Popup logic

## Environment Variables

| Variable       | Description                             |
| -------------- | --------------------------------------- |
| GEMINI_API_KEY | API key from Google AI Studio           |
| DB_PASSWORD    | PostgreSQL password                     |
| DB_USERNAME    | PostgreSQL username (default: postgres) |
