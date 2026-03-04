/**
 * LLM Configuration Controller
 * Manage AI/LLM configurations for the platform
 */

import prisma from '../prisma.js';

/**
 * Get all LLM configurations
 */
export const getAllConfigs = async (req, res) => {
  try {
    const configs = await prisma.lLMConfig.findMany({
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      count: configs.length,
      data: configs
    });
  } catch (error) {
    console.error('Error fetching LLM configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch LLM configurations'
    });
  }
};

/**
 * Get active LLM configuration
 */
export const getActiveConfig = async (req, res) => {
  try {
    const activeConfig = await prisma.lLMConfig.findFirst({
      where: { isActive: true }
    });

    if (!activeConfig) {
      return res.status(404).json({
        success: false,
        error: 'No active LLM configuration found'
      });
    }

    res.json({
      success: true,
      data: activeConfig
    });
  } catch (error) {
    console.error('Error fetching active LLM config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active LLM configuration'
    });
  }
};

/**
 * Get single LLM configuration by ID
 */
export const getConfigById = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await prisma.lLMConfig.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'LLM configuration not found'
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching LLM config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch LLM configuration'
    });
  }
};

/**
 * Create new LLM configuration
 */
export const createConfig = async (req, res) => {
  try {
    const {
      name,
      provider,
      isActive,
      ollamaUrl,
      ollamaModel,
      groqApiKey,
      groqModel,
      temperature,
      maxTokens,
      topP
    } = req.body;

    // Validation
    if (!name || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Name and provider are required'
      });
    }

    if (!['OLLAMA', 'GROQ'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Provider must be either OLLAMA or GROQ'
      });
    }

    // Provider-specific validation
    if (provider === 'OLLAMA' && (!ollamaUrl || !ollamaModel)) {
      return res.status(400).json({
        success: false,
        error: 'Ollama URL and model are required for OLLAMA provider'
      });
    }

    if (provider === 'GROQ' && (!groqApiKey || !groqModel)) {
      return res.status(400).json({
        success: false,
        error: 'Groq API key and model are required for GROQ provider'
      });
    }

    // If this config should be active, deactivate all others
    if (isActive) {
      await prisma.lLMConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const config = await prisma.lLMConfig.create({
      data: {
        name,
        provider,
        isActive: isActive || false,
        ollamaUrl,
        ollamaModel,
        groqApiKey,
        groqModel,
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 1000,
        topP: topP || 0.9,
        createdBy: req.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'LLM configuration created successfully',
      data: config
    });
  } catch (error) {
    console.error('Error creating LLM config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create LLM configuration'
    });
  }
};

/**
 * Update LLM configuration
 */
export const updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      provider,
      isActive,
      ollamaUrl,
      ollamaModel,
      groqApiKey,
      groqModel,
      temperature,
      maxTokens,
      topP
    } = req.body;

    // Check if config exists
    const existingConfig = await prisma.lLMConfig.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        error: 'LLM configuration not found'
      });
    }

    // Provider-specific validation
    if (provider === 'OLLAMA' && (!ollamaUrl || !ollamaModel)) {
      return res.status(400).json({
        success: false,
        error: 'Ollama URL and model are required for OLLAMA provider'
      });
    }

    if (provider === 'GROQ' && (!groqApiKey || !groqModel)) {
      return res.status(400).json({
        success: false,
        error: 'Groq API key and model are required for GROQ provider'
      });
    }

    // If this config should be active, deactivate all others
    if (isActive && !existingConfig.isActive) {
      await prisma.lLMConfig.updateMany({
        where: { 
          isActive: true,
          id: { not: parseInt(id) }
        },
        data: { isActive: false }
      });
    }

    const updatedConfig = await prisma.lLMConfig.update({
      where: { id: parseInt(id) },
      data: {
        name,
        provider,
        isActive,
        ollamaUrl,
        ollamaModel,
        groqApiKey,
        groqModel,
        temperature,
        maxTokens,
        topP
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'LLM configuration updated successfully',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating LLM config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update LLM configuration'
    });
  }
};

/**
 * Delete LLM configuration
 */
export const deleteConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await prisma.lLMConfig.findUnique({
      where: { id: parseInt(id) }
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'LLM configuration not found'
      });
    }

    // Prevent deletion of active config
    if (config.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete active configuration. Please activate another configuration first.'
      });
    }

    await prisma.lLMConfig.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'LLM configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting LLM config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete LLM configuration'
    });
  }
};

/**
 * Activate a specific LLM configuration
 */
export const activateConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await prisma.lLMConfig.findUnique({
      where: { id: parseInt(id) }
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'LLM configuration not found'
      });
    }

    // Deactivate all configs
    await prisma.lLMConfig.updateMany({
      data: { isActive: false }
    });

    // Activate the selected config
    const activatedConfig = await prisma.lLMConfig.update({
      where: { id: parseInt(id) },
      data: { isActive: true },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'LLM configuration activated successfully',
      data: activatedConfig
    });
  } catch (error) {
    console.error('Error activating LLM config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate LLM configuration'
    });
  }
};
