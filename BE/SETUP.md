# Car AI Setup Guide

## Why the AI is not working

The AI analysis is currently using a **fallback template response** because the OpenAI API key is not configured. Here's how to fix it:

## Step 1: Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (it starts with `sk-`)

## Step 2: Create Environment File

Create a `.env` file in the `BE` directory with the following content:

```env
# Server Configuration
PORT=8001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/car_ai_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important:** Replace `sk-your-actual-api-key-here` with your real OpenAI API key.

## Step 3: Restart the Server

After creating the `.env` file, restart your backend server:

```bash
cd BE
npm run dev
```

## Step 4: Test the AI

Now when you make a request to `/api/analyze-guided`, you should get a **real AI-generated response** instead of the template.

## Troubleshooting

### If you still get template responses:

1. Check that the `.env` file is in the correct location (`BE/.env`)
2. Verify the API key is correct and starts with `sk-`
3. Restart the server after adding the `.env` file
4. Check the server console for any error messages

### If you get API errors:

- **401 Error**: Invalid API key - check your key
- **429 Error**: Rate limit exceeded - wait and try again
- **Connection errors**: Check your internet connection

## Current Status

✅ **Frontend**: Correctly calling `/api/analyze-guided`  
✅ **Backend**: Has OpenAI integration  
✅ **Error Handling**: Improved with fallback responses  
❌ **Configuration**: Missing OpenAI API key

Once you add the API key, the AI will work properly!
