# Setting Up Google Places API for PizzaRat

This guide will walk you through the process of setting up a Google Places API key for the PizzaRat app.

## Step 1: Create a Google Cloud Platform (GCP) Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click on the project dropdown at the top of the page
4. Click on "New Project"
5. Enter a name for your project (e.g., "PizzaRat")
6. Click "Create"

## Step 2: Enable the Places API

1. Select your newly created project
2. Navigate to "APIs & Services" > "Library" from the left sidebar
3. Search for "Places API"
4. Click on "Places API" in the results
5. Click "Enable"

## Step 3: Create API Credentials

1. Navigate to "APIs & Services" > "Credentials" from the left sidebar
2. Click "Create Credentials" > "API key"
3. Your new API key will be displayed. Copy this key.

## Step 4: Apply Restrictions to Your API Key (Recommended)

For security reasons, it's recommended to restrict your API key:

1. In the Credentials page, find your API key and click "Edit"
2. Under "Application restrictions", select "Android apps", "iOS apps", or "HTTP referrers" depending on your deployment
3. Under "API restrictions", select "Restrict key" and choose "Places API" from the dropdown
4. Click "Save"

## Step 5: Update the API Key in the App

1. Open the file `/utils/placesApi.ts`
2. Replace the placeholder API key with your new key:

```typescript
const API_KEY = "YOUR_NEW_API_KEY_HERE";
```

## Step 6: Set Up a Proxy Server (For Production)

For production use, you should set up a proper backend proxy server to handle API requests to Google Places API. This avoids exposing your API key in client-side code.

Options include:
- Creating a simple Express.js server
- Using serverless functions (AWS Lambda, Vercel Functions, Firebase Functions)
- Setting up a dedicated API gateway

## Billing Considerations

- The Google Places API is not free for production use
- You get a monthly $200 credit which is enough for development and small-scale apps
- Set up billing alerts to avoid unexpected charges
- Consider implementing caching strategies to reduce API calls

## Troubleshooting

If you encounter CORS issues when testing:
1. Make sure you've properly set up the API key restrictions
2. Consider using a development proxy like the one in the code
3. For production, always use a proper backend proxy

Remember to keep your API key secure and never commit it directly to public repositories.
