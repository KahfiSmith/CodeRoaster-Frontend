import { useEffect } from 'react';
import { ENV, validateEnvironment } from '@/config/env';

export const useOpenAIValidation = () => {
  useEffect(() => {
    const errors = validateEnvironment();
    
    if (errors.length > 0) {
      console.error('❌ OpenAI Configuration Issues:');
      errors.forEach(error => console.error(error));
    } else {
      console.log('✅ OpenAI Configuration Valid');
      console.log(`🤖 Model: ${ENV.OPENAI_MODEL}`);
      console.log(`🎯 Max Tokens: ${ENV.OPENAI_MAX_TOKENS}`);
      console.log(`🌡️ Temperature: ${ENV.OPENAI_TEMPERATURE}`);
    }
  }, []);

  return {
    isConfigured: !!ENV.OPENAI_API_KEY,
    model: ENV.OPENAI_MODEL,
    maxTokens: ENV.OPENAI_MAX_TOKENS,
    temperature: ENV.OPENAI_TEMPERATURE
  };
};
