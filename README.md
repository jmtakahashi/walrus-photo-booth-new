# Walrus Photo Booth

## Project Description

The Walrus Photo Booth is a web application for event organizers to be able to set up a photo booth at an event. It enables administrators to set up a photo booth at events where attendees can capture and upload their photos to the blockchain using Walrus. Each event has their own photo gallery.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

To configure the application, you need to set up environment variables. Follow these steps:

1. **Create a `.env` file**: Copy the `.env.example` file to a new file named `.env` in the root of your project directory.

   ```bash
   cp .env.example .env
   ```

2. **Fill in the required values**: Open the `.env` file and provide the necessary values for each variable. Here is a brief description of each:

   - `NEXT_PUBLIC_SUPABASE_KEY`: supabase api key
   - `NEXT_PUBLIC_SUPABASE_URL`: the url for your supabase instance
   - `NEXT_PUBLIC_SUI_NETWORK`: the network for sui (RPC)
   - `NEXT_PUBLIC_SUI_NETWORK_NAME`: the name of the Sui network (example: testnet)
   - `NEXT_PUBLIC_ENOKI_API_KEY`: enoki api key
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: google client id for authentication
   - `NEXT_PUBLIC_WEBSITE_BASE_URL`: your website url 
   - `NEXT_PUBLIC_PUBLISHER_URL`: the url for the walrus publisher service
   - `NEXT_PUBLIC_AGGREGATOR_URL`: the url for the walrus aggregator service 
