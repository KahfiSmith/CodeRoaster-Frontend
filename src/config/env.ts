// Environment variables configuration
export const ENV = {
  // OpenAI Settings
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  // Default review model set to gpt-5-mini (can be overridden via env)
  OPENAI_MODEL: import.meta.env.VITE_OPENAI_MODEL || 'gpt-5-mini',
  // Allow per-model defaults to kick in when env overrides are not provided
  OPENAI_MAX_TOKENS: import.meta.env.VITE_OPENAI_MAX_TOKENS !== undefined
    ? parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS)
    : undefined as unknown as number,
  OPENAI_TEMPERATURE: import.meta.env.VITE_OPENAI_TEMPERATURE !== undefined
    ? parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE)
    : undefined as unknown as number,
  
  // App Settings
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Code Roaster',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Environment Info
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE
}

// Validation function
export const validateEnvironment = () => {
  const errors = []
  const allowedModels = [
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'gpt-4o-mini',
    'o1-mini',
    'o4-mini'
  ]
  
  if (!ENV.OPENAI_API_KEY) {
    errors.push('❌ VITE_OPENAI_API_KEY is required in .env.local')
  }
  
  if (!ENV.OPENAI_API_KEY?.startsWith('sk-')) {
    errors.push('❌ Invalid OpenAI API key format. Should start with "sk-"')
  }

  if (!allowedModels.includes(ENV.OPENAI_MODEL)) {
    errors.push(`❌ VITE_OPENAI_MODEL must be one of: ${allowedModels.join(', ')}`)
  }
  
  if (ENV.OPENAI_MAX_TOKENS !== undefined && (ENV.OPENAI_MAX_TOKENS < 500 || ENV.OPENAI_MAX_TOKENS > 3000)) {
    errors.push('❌ OPENAI_MAX_TOKENS should be between 500-3000 for optimal performance')
  }
  
  if (ENV.OPENAI_TEMPERATURE !== undefined && (ENV.OPENAI_TEMPERATURE < 0 || ENV.OPENAI_TEMPERATURE > 2)) {
    errors.push('❌ OPENAI_TEMPERATURE should be between 0-2')
  }
  
  return errors
}

// Auto-validate on import
if (ENV.isDevelopment) {
  const errors = validateEnvironment()
  if (errors.length > 0) {
    console.error('🚨 Environment Configuration Errors:')
    errors.forEach(error => console.error(error))
    console.error('\n📝 Please check your .env.local file')
  } else {
    console.log('✅ Environment configuration is valid')
  }
}