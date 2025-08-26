/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/utils/simple-test-utils';
import { Toaster } from '@/components/ui/Toaster';
import { UIProvider, useUI } from '@/contexts/UIContext';

// Test component to trigger toasts
const TestComponent = () => {
  const { showToast } = useUI();
  
  return (
    <div>
      <button 
        onClick={() => showToast({ 
          title: 'Success', 
          message: 'Operation completed',
          type: 'success' 
        })}
        data-testid="show-success"
      >
        Show Success
      </button>
      <button 
        onClick={() => showToast({ 
          title: 'Error', 
          type: 'error' 
        })}
        data-testid="show-error"
      >
        Show Error
      </button>
      <button 
        onClick={() => showToast({ 
          title: 'Warning', 
          message: 'Please check this',
          type: 'warning' 
        })}
        data-testid="show-warning"
      >
        Show Warning
      </button>
      <button 
        onClick={() => showToast({ 
          title: 'Info', 
          type: 'info' 
        })}
        data-testid="show-info"
      >
        Show Info
      </button>
      <Toaster />
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <UIProvider>
      {component}
    </UIProvider>
  );
};

describe('Toaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no toasts', () => {
    renderWithProvider(<Toaster />);
    
    const toastContainer = screen.queryByRole('alert');
    expect(toastContainer).not.toBeInTheDocument();
  });

  it('renders success toast', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('show-success'));
    
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('alert-success');
  });

  it('renders error toast', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('show-error'));
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('alert-error');
  });

  it('renders warning toast', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('show-warning'));
    
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Please check this')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('alert-warning');
  });

  it('renders info toast', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('show-info'));
    
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('alert-info');
  });

  it('handles toast dismissal', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('show-success'));
    expect(screen.getByText('Success')).toBeInTheDocument();
    
    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Success')).not.toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('show-success'));
    fireEvent.click(screen.getByTestId('show-error'));
    
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('handles toast without message', () => {
    renderWithProvider(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('show-error'));
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('Operation completed')).not.toBeInTheDocument();
  });
});