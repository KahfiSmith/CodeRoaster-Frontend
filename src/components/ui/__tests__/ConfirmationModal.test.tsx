import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { ConfirmationModalProps } from '@/types'

describe('ConfirmationModal', () => {
  const mockOnClose = vi.fn(() => {})
  const mockOnConfirm = vi.fn(() => {})

  const defaultProps: ConfirmationModalProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    title: 'Test Title',
    message: 'Test message',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when isOpen is true', () => {
    render(<ConfirmationModal {...defaultProps} />)
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should not render when isOpen is false', () => {
    render(<ConfirmationModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', () => {
    render(<ConfirmationModal {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Confirm'))
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when cancel button is clicked', () => {
    render(<ConfirmationModal {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when close button (×) is clicked', () => {
    render(<ConfirmationModal {...defaultProps} />)
    
    fireEvent.click(screen.getByText('×'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when backdrop is clicked', () => {
    render(<ConfirmationModal {...defaultProps} />)
    
    const backdrop = screen.getByRole('dialog')
    fireEvent.click(backdrop)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should handle keyboard events', () => {
    render(<ConfirmationModal {...defaultProps} />)
    
    const modal = screen.getByRole('dialog')
    
    // Test Escape key
    fireEvent.keyDown(modal, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
    
    // Test Enter key
    fireEvent.keyDown(modal, { key: 'Enter' })
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  it('should render different variants correctly', () => {
    const { rerender } = render(
      <ConfirmationModal {...defaultProps} variant="danger" icon="trash" />
    )
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    
    rerender(
      <ConfirmationModal {...defaultProps} variant="warning" icon="warning" />
    )
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should use default props when not provided', () => {
    const minimalProps: Pick<ConfirmationModalProps, 'isOpen' | 'onClose' | 'onConfirm'> = {
      isOpen: true,
      onClose: mockOnClose,
      onConfirm: mockOnConfirm,
    }
    
    render(<ConfirmationModal {...minimalProps} />)
    
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })
})