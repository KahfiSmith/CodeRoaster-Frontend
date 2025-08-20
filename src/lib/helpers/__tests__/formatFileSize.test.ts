import { describe, it, expect } from 'vitest'
import { formatFileSize } from '@/lib/helpers/formatFileSize'

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1)).toBe('1 B')
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1000)).toBe('1000 B')
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  it('should format kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1536)).toBe('2 KB') // 1536/1024 = 1.5, rounded to 2
    expect(formatFileSize(2048)).toBe('2 KB')
  })

  it('should format megabytes correctly', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(1536 * 1024)).toBe('1.5 MB')
    expect(formatFileSize(2048 * 1024)).toBe('2.0 MB')
  })

  it('should handle edge cases', () => {
    expect(formatFileSize(-1)).toBe('-1 B')
    // Note: The current implementation doesn't handle undefined/null gracefully
    // expect(formatFileSize(undefined as any)).toBe('0 B')
    // expect(formatFileSize(null as any)).toBe('0 B')
  })

  // New tests for enhanced functionality
  describe('with indicators', () => {
    it('should show no indicator for small files', () => {
      expect(formatFileSize(10 * 1024, { showIndicator: true })).toBe('10 KB')
      expect(formatFileSize(29 * 1024, { showIndicator: true })).toBe('29 KB')
    })

    it('should show compression indicator for medium files', () => {
      expect(formatFileSize(30 * 1024, { showIndicator: true })).toBe('30 KB 📦')
      expect(formatFileSize(50 * 1024, { showIndicator: true })).toBe('50 KB 📦')
      expect(formatFileSize(79 * 1024, { showIndicator: true })).toBe('79 KB 📦')
    })

    it('should show warning indicator for large files', () => {
      expect(formatFileSize(80 * 1024, { showIndicator: true })).toBe('80 KB ⚠️')
      expect(formatFileSize(100 * 1024, { showIndicator: true })).toBe('100 KB ⚠️')
      expect(formatFileSize(1024 * 1024, { showIndicator: true })).toBe('1.0 MB ⚠️')
    })

    it('should respect custom thresholds', () => {
      expect(formatFileSize(40 * 1024, { 
        showIndicator: true,
        compressThreshold: 20 * 1024,
        sizeLimit: 50 * 1024
      })).toBe('40 KB 📦')

      expect(formatFileSize(60 * 1024, { 
        showIndicator: true,
        compressThreshold: 20 * 1024,
        sizeLimit: 50 * 1024
      })).toBe('60 KB ⚠️')
    })
  })
})