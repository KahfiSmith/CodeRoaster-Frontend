import { openaiService } from '@/services/openaiService'

// Test samples for different languages
const TEST_SAMPLES = {
  javascript: `
function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}`,

  python: `
def calculate_total(items):
    total = 0
    for item in items:
        total += item['price'] * item['quantity']
    return total`,

  java: `
public class Calculator {
    public static double calculateTotal(List<Item> items) {
        double total = 0;
        for (Item item : items) {
            total += item.getPrice() * item.getQuantity();
        }
        return total;
    }
}`
}

export const testOpenAISetup = async () => {
  console.log('🧪 Testing OpenAI setup...')
  
  try {
    // Test connection
    const status = openaiService.getConnectionStatus()
    console.log('📊 Connection Status:', status)
    
    if (!status.isConnected) {
      throw new Error('OpenAI service not connected')
    }
    
    // Test code review
    const testCode = TEST_SAMPLES.javascript
    console.log('🔍 Testing code review with sample JavaScript...')
    
    const review = await openaiService.reviewCode(testCode, 'javascript', 'codeQuality')
    
    console.log('✅ Test successful!')
    console.log('📋 Review result:', {
      score: review.score,
      totalIssues: review.summary?.totalIssues,
      suggestions: review.suggestions?.length
    })
    
    return {
      success: true,
      message: 'OpenAI setup is working correctly',
      testResult: review
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Test failed:', errorMessage)
    return {
      success: false,
      message: `Test failed: ${errorMessage}`,
      error
    }
  }
}

// Quick test function for development
export const quickTest = async () => {
  const result = await testOpenAISetup()
  if (result.success) {
    alert('✅ OpenAI setup is working!')
  } else {
    alert(`❌ Setup failed: ${result.message}`)
  }
  return result
}