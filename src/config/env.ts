// Environment variables configuration
export const ENV = {
  // OpenAI Settings
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  OPENAI_MODEL: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
  OPENAI_MAX_TOKENS: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS) || 4000,
  OPENAI_TEMPERATURE: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE) || 0.1,
  
  // App Settings
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Code Reviewer AI',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Environment Info
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE
}

// Validation function
export const validateEnvironment = () => {
  const errors = []
  
  if (!ENV.OPENAI_API_KEY) {
    errors.push('❌ VITE_OPENAI_API_KEY is required in .env.local')
  }
  
  if (!ENV.OPENAI_API_KEY?.startsWith('sk-')) {
    errors.push('❌ Invalid OpenAI API key format. Should start with "sk-"')
  }
  
  if (ENV.OPENAI_MAX_TOKENS < 100 || ENV.OPENAI_MAX_TOKENS > 8000) {
    errors.push('❌ OPENAI_MAX_TOKENS should be between 100-8000 for detailed reviews')
  }
  
  if (ENV.OPENAI_TEMPERATURE < 0 || ENV.OPENAI_TEMPERATURE > 2) {
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