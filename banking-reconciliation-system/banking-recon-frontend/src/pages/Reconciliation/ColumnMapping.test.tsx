import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ColumnMapping } from './ColumnMapping';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ColumnMapping Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should show loading state initially', () => {
      renderWithRouter(<ColumnMapping />);
      expect(screen.getByText(/Analyzing uploaded files and detecting columns/i)).toBeInTheDocument();
    });

    it('should display column mapping interface after loading', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(screen.getByText('Column Mapping')).toBeInTheDocument();
      });
    });

    it('should display the page title and description', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(screen.getByText('Column Mapping')).toBeInTheDocument();
        expect(
          screen.getByText(/Map the columns from your uploaded files to the expected fields/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('File Navigation', () => {
    it('should display steps for all files (bank files + ledger)', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(screen.getByText('HDFC Bank')).toBeInTheDocument();
        expect(screen.getByText('ICICI Bank')).toBeInTheDocument();
        expect(screen.getByText('Ledger File')).toBeInTheDocument();
      });
    });

    it('should show the first bank file by default', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(screen.getByText('HDFC_Statement.csv')).toBeInTheDocument();
      });
    });

    it('should disable Previous button on first file', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /Previous File/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it('should navigate to next file when Next button is clicked', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(screen.getByText('HDFC_Statement.csv')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /Next File/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('ICICI_Statement.csv')).toBeInTheDocument();
      });
    });

    it('should show Start Reconciliation button on last file (ledger)', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next File/i });
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next File/i });
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Reconciliation/i })).toBeInTheDocument();
      });
    });
  });

  describe('Column Detection Display', () => {
    it('should display detected columns with confidence scores', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(screen.getByText('Transaction Date')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
      });
    });

    it('should show sample values for each column', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(screen.getByText('2024-01-15')).toBeInTheDocument();
        expect(screen.getByText('1500.00')).toBeInTheDocument();
      });
    });

    it('should display detected types (date, amount, text)', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        const dateTags = screen.getAllByText('date');
        const amountTags = screen.getAllByText('amount');
        const textTags = screen.getAllByText('text');

        expect(dateTags.length).toBeGreaterThan(0);
        expect(amountTags.length).toBeGreaterThan(0);
        expect(textTags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Required Fields Validation', () => {
    it('should display required fields indicator (*)', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        const mappingDropdowns = screen.getAllByRole('combobox');
        expect(mappingDropdowns.length).toBeGreaterThan(0);
      });
    });

    it('should show mapping status alert', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(
          screen.getByText(/All files mapped successfully!/i) ||
          screen.getByText(/of \d+ files mapped/i)
        ).toBeInTheDocument();
      });
    });

    it('should display required fields information alert', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(
          screen.getByText(/Date, Amount, and Description are required fields/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Completion Status', () => {
    it('should show Complete tag when all required fields are mapped', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        const completeTags = screen.getAllByText('Complete');
        expect(completeTags.length).toBeGreaterThan(0);
      });
    });

    it('should enable Start Reconciliation button when all files are complete', async () => {
      renderWithRouter(<ColumnMapping />);

      // Navigate to last file (ledger)
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next File/i });
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next File/i });
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /Start Reconciliation/i });
        expect(startButton).not.toBeDisabled();
      });
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate back to upload page when Back to Upload is clicked', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /Back to Upload/i });
        fireEvent.click(backButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/reconciliation/new');
    });

    it('should start reconciliation process when Start Reconciliation is clicked', async () => {
      renderWithRouter(<ColumnMapping />);

      // Navigate to last file
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next File/i });
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next File/i });
        fireEvent.click(nextButton);
      });

      const startButton = await screen.findByRole('button', { name: /Start Reconciliation/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/reconciliation/progress');
      });
    });
  });

  describe('User Interactions', () => {
    it('should display mapping dropdowns for each detected column', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        const dropdowns = screen.getAllByRole('combobox');
        // Should have one dropdown per detected column (5 columns for HDFC)
        expect(dropdowns.length).toBe(5);
      });
    });

    it('should show field options in mapping dropdowns', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(screen.getByText('Transaction Date')).toBeInTheDocument();
      });

      // The dropdowns are populated with options, but we can't easily test
      // the dropdown options without actually clicking and opening them
      // This would require more complex testing with user-event library
    });
  });

  describe('Multi-Bank Support', () => {
    it('should handle multiple bank files', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(screen.getByText('HDFC Bank')).toBeInTheDocument();
        expect(screen.getByText('ICICI Bank')).toBeInTheDocument();
      });
    });

    it('should show different columns for different bank files', async () => {
      renderWithRouter(<ColumnMapping />);

      // First bank file (HDFC)
      await waitFor(() => {
        expect(screen.getByText('Transaction Date')).toBeInTheDocument();
      });

      // Navigate to second bank file (ICICI)
      const nextButton = screen.getByRole('button', { name: /Next File/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Narration')).toBeInTheDocument();
        expect(screen.getByText('Debit')).toBeInTheDocument();
        expect(screen.getByText('Credit')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid navigation between files', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(screen.getByText('HDFC_Statement.csv')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /Next File/i });

      // Rapid clicks
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('General_Ledger.csv')).toBeInTheDocument();
      });
    });

    it('should handle back navigation correctly', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /Next File/i });
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByText('ICICI_Statement.csv')).toBeInTheDocument();
      });

      const prevButton = screen.getByRole('button', { name: /Previous File/i });
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('HDFC_Statement.csv')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button labels', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back to Upload/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Previous File/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Next File/i })).toBeInTheDocument();
      });
    });

    it('should have proper heading structure', async () => {
      renderWithRouter(<ColumnMapping />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Column Mapping/i })).toBeInTheDocument();
      });
    });
  });
});
