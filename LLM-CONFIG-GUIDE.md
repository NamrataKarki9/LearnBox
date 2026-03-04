# LLM Configuration Guide

## Overview

The LearnBox platform now supports configurable AI/LLM providers. Super Admins can manage LLM configurations through the dashboard and switch between local (Ollama) and cloud (Groq) providers.

## Features Implemented

### 1. **Database Model**
- New `LLMConfig` table to store configurations
- Supports both Ollama (local) and Groq (cloud) providers
- Only one configuration can be active at a time
- Stores provider-specific settings and common parameters

### 2. **Backend API Endpoints**
All endpoints require `SUPER_ADMIN` role and are prefixed with `/api/llm-config`

- `GET /` - Get all configurations
- `GET /active` - Get the currently active configuration
- `GET /:id` - Get a specific configuration by ID
- `POST /` - Create a new configuration
- `PUT /:id` - Update a configuration
- `DELETE /:id` - Delete a configuration (cannot delete active config)
- `POST /:id/activate` - Activate a specific configuration

### 3. **Centralized LLM Service**
The new `llm.service.js` provides:
- Automatic provider detection (Ollama or Groq)
- Unified API for calling LLMs regardless of provider
- Fallback to default Ollama settings if no config is found
- Support for both providers with their specific APIs

### 4. **Updated AI Services**
Both MCQ generation and summarization services now use the centralized LLM service:
- `mcq-generation.service.js` - Uses active LLM config
- `summary.service.js` - Uses active LLM config

### 5. **SuperAdmin Dashboard**
New "LLM Config" tab with full CRUD operations:
- View all configurations
- Create new configurations
- Edit existing configurations  
- Delete inactive configurations
- Activate/deactivate configurations
- Visual indication of active configuration

## Usage

### For Super Admins

1. **Access the Dashboard**
   - Navigate to `http://localhost:5173/superadmin`
   - Click on "LLM Config" in the sidebar

2. **Create an Ollama Configuration**
   ```
   Name: Production Ollama
   Provider: Ollama (Local)
   Ollama URL: http://localhost:11434
   Ollama Model: gemma3:1b
   Temperature: 0.7
   Max Tokens: 1000
   Top P: 0.9
   Set as active: ✓
   ```

3. **Create a Groq Configuration**
   ```
   Name: Groq Cloud
   Provider: Groq (Cloud)
   Groq API Key: gsk_xxxxxxxxxxxx
   Groq Model: mixtral-8x7b-32768
   Temperature: 0.7
   Max Tokens: 1000
   Top P: 0.9
   Set as active: ✓
   ```

4. **Switch Between Configurations**
   - Click "Activate" on any inactive configuration
   - The previously active config will be automatically deactivated
   - All AI operations will immediately use the new configuration

### For Developers

**Using the LLM Service:**

```javascript
import { callLLM, getLLMInfo } from '../services/llm.service.js';

// Call the active LLM
const response = await callLLM(prompt, maxTokens);

// Get current configuration info
const info = await getLLMInfo();
console.log(`Using ${info.provider} with model ${info.model}`);
```

**Database Access:**

```javascript
import prisma from './prisma.js';

// Get active configuration
const activeConfig = await prisma.lLMConfig.findFirst({
  where: { isActive: true }
});

// Create new configuration
const newConfig = await prisma.lLMConfig.create({
  data: {
    name: 'My Config',
    provider: 'OLLAMA',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama2',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    createdBy: userId
  }
});
```

## Configuration Options

### Ollama (Local)
- **URL**: Ollama server endpoint (default: http://localhost:11434)
- **Model**: Any pulled Ollama model (gemma3:1b, llama2, mistral, etc.)
- **Pros**: Free, private, no API limits
- **Cons**: Requires local setup, limited by hardware

### Groq (Cloud)
- **API Key**: Get from https://console.groq.com
- **Models Available**:
  - `mixtral-8x7b-32768` - Best for complex reasoning
  - `llama3-70b-8192` - Balanced performance
  - `llama3-8b-8192` - Fast and efficient
  - `gemma-7b-it` - Instruction tuned
- **Pros**: Fast inference, no local resources needed
- **Cons**: Requires API key, rate limits apply

### Common Parameters

- **Temperature** (0.0 - 2.0): Controls randomness
  - Lower (0.3): More focused and deterministic
  - Higher (0.7-1.0): More creative and varied
  
- **Max Tokens** (100 - 32000): Maximum response length
  - MCQ Generation: 1000-1500
  - Summarization: 250-1000
  
- **Top P** (0.0 - 1.0): Nucleus sampling threshold
  - Usually kept at 0.9 for good diversity

## Migration Steps

If you're upgrading from the old hardcoded configuration:

1. **Run database migration:**
   ```bash
   cd backend
   npx prisma db push
   ```

2. **Create your first configuration:**
   - Use the SuperAdmin dashboard
   - Or create programmatically via API

3. **The system will fall back to environment variables if no active config exists**

## Troubleshooting

**Problem: "No active LLM configuration found"**
- Solution: Create and activate a configuration in the SuperAdmin dashboard

**Problem: Ollama connection errors**
- Check if Ollama is running: `ollama list`
- Verify the URL is correct (usually http://localhost:11434)
- Ensure the model is pulled: `ollama pull your-model-name`

**Problem: Groq API errors**
- Verify your API key is valid
- Check you haven't exceeded rate limits
- Ensure the model name is correct

**Problem: Cannot delete active configuration**
- You must activate another configuration first
- Deactivate by activating a different config

## Environment Variables (Fallback)

If no database configuration is active, the system falls back to:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:1b
```

## Security Notes

- Groq API keys are stored in the database
- Only SUPER_ADMIN users can view/edit configurations
- API keys are partially masked in the UI (shows last 4 characters only)
- Consider encrypting API keys in production environments

## Future Enhancements

Potential improvements:
- Support for OpenAI, Anthropic, and other providers
- Configuration testing/validation before activation
- Usage analytics per configuration
- API key encryption at rest
- Configuration versioning and rollback
