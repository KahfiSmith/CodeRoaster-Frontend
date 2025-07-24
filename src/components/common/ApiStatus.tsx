import { testOpenAISetup } from '@/lib/utils/apiTester';
import { openaiService } from '@/services/openaiService';
import { useEffect, useState } from 'react';

type ConnectionStatus = {
  isConnected: boolean;
  model?: string;
  maxTokens?: number;
};

type TestResult = {
  success: boolean;
  message: string;
  testResult?: unknown;
  error?: unknown;
} | null;

export const ApiStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>({ isConnected: false })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult>(null)

  useEffect(() => {
    const checkStatus = () => {
      const currentStatus = openaiService.getConnectionStatus()
      setStatus(currentStatus)
    }

    checkStatus()
    const interval = setInterval(checkStatus, 30000) // Check every 30s

    return () => clearInterval(interval)
  }, [])

  const handleTest = async () => {
    setTesting(true)
    try {
      const result = await testOpenAISetup()
      setTestResult(result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setTestResult({ success: false, message: errorMessage })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="api-status p-4 border rounded-lg">
      <h3 className="font-bold mb-2">🔑 OpenAI API Status</h3>
      
      <div className="status-info mb-4">
        <div className={`flex items-center gap-2 ${status.isConnected ? 'text-green-600' : 'text-red-600'}`}>
          <span className={`w-2 h-2 rounded-full ${status.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{status.isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {status.isConnected && (
          <div className="text-sm text-gray-600 mt-1">
            <div>Model: {status.model}</div>
            <div>Max Tokens: {status.maxTokens}</div>
          </div>
        )}
      </div>

      <button 
        onClick={handleTest}
        disabled={testing}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {testing ? '🔄 Testing...' : '🧪 Test API'}
      </button>

      {testResult && (
        <div className={`mt-4 p-3 rounded ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <div className="font-medium">
            {testResult.success ? '✅ Test Passed' : '❌ Test Failed'}
          </div>
          <div className="text-sm mt-1">{testResult.message}</div>
        </div>
      )}
    </div>
  )
}