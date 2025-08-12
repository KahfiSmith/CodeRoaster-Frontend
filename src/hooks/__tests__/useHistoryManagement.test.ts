import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHistoryManagement } from '@/hooks/useHistoryManagement'
import type { HistoryItem } from '@/types'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('useHistoryManagement', () => {
  const mockHistoryItem: HistoryItem = {
    id: 'test-id-123',
    filename: 'test.ts',
    language: 'typescript',
    reviewResult: {
      score: 85,
      summary: {
        totalIssues: 0,
        critical: 0,
        warning: 0,
        info: 0
      },
      suggestions: [],
      metadata: {
        model: "gpt-4o-mini",
        reviewType: "codeQuality",
        language: "typescript",
        tokensUsed: 150,
        timestamp: new Date().toISOString()
      }
    },
    timestamp: '2025-01-01T00:00:00.000Z',
    fileSize: 1024,
    reviewType: 'codeQuality',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Return empty array instead of null to avoid sample data loading
    mockLocalStorage.getItem.mockReturnValue('[]')
  })

  it('should initialize with empty history when localStorage is empty', () => {
    const { result } = renderHook(() => useHistoryManagement())
    
    expect(result.current.historyItems).toEqual([])
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('codeRoaster_history')
  })

  it('should initialize with existing history from localStorage', () => {
    const existingHistory = [mockHistoryItem]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingHistory))
    
    const { result } = renderHook(() => useHistoryManagement())
    
    expect(result.current.historyItems).toEqual(existingHistory)
  })

  it('should handle corrupted localStorage data gracefully', () => {
    // Create a custom mock that throws for this test
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockLocalStorage.getItem.mockReturnValue('invalid-json')
    
    const { result } = renderHook(() => useHistoryManagement())
    
    // Should handle gracefully and not crash
    expect(result.current.historyItems).toBeDefined()
    
    consoleSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('should delete an item by id', () => {
    const initialHistory = [mockHistoryItem, { ...mockHistoryItem, id: 'test-id-456' }]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(initialHistory))
    
    const { result } = renderHook(() => useHistoryManagement())
    
    act(() => {
      result.current.deleteItem('test-id-123')
    })
    
    expect(result.current.historyItems).toHaveLength(1)
    expect(result.current.historyItems[0].id).toBe('test-id-456')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'codeRoaster_history',
      JSON.stringify([{ ...mockHistoryItem, id: 'test-id-456' }])
    )
  })

  it('should clear all history when skipConfirmation is true', () => {
    const initialHistory = [mockHistoryItem]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(initialHistory))
    
    const { result } = renderHook(() => useHistoryManagement())
    
    act(() => {
      result.current.clearAllHistory(true)
    })
    
    expect(result.current.historyItems).toEqual([])
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('codeRoaster_history')
  })

  it('should return callback function when skipConfirmation is false', () => {
    const initialHistory = [mockHistoryItem]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(initialHistory))
    
    const { result } = renderHook(() => useHistoryManagement())
    
    const callback = result.current.clearAllHistory(false)
    
    expect(typeof callback).toBe('function')
    expect(result.current.historyItems).toEqual(initialHistory) // Should not clear immediately
  })

  it('should refresh history from localStorage', () => {
    const { result } = renderHook(() => useHistoryManagement())
    
    const newHistory = [mockHistoryItem]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(newHistory))
    
    act(() => {
      result.current.refreshHistory()
    })
    
    expect(result.current.historyItems).toEqual(newHistory)
  })

  it('should export history as JSON', () => {
    const initialHistory = [mockHistoryItem]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(initialHistory))
    
    const { result } = renderHook(() => useHistoryManagement())
    
    // Mock URL.createObjectURL and document.createElement
    const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
    const mockRevokeObjectURL = vi.fn()
    const mockClick = vi.fn()
    const mockAppendChild = vi.fn()
    const mockRemoveChild = vi.fn()
    
    Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL })
    
    const mockAnchor: Partial<HTMLAnchorElement> = {
      href: '',
      download: '',
      click: mockClick,
    }
    
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as HTMLAnchorElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild)
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild)
    
    act(() => {
      result.current.exportHistory()
    })
    
    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalled()
  })
})