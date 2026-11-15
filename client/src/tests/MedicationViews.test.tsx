import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TodayDoses } from '../pages/TodayDoses';
import { StockView } from '../pages/StockView';
import { Adherence } from '../pages/Adherence';
import { apiClient } from '../api/client';
import '../i18n';

expect.extend(toHaveNoViolations);

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'elder1', email: 'elder@silversync.demo' },
    profile: { name: 'Elder Person', seniorMode: false },
    currentCircle: { id: 'circle-1', name: "Mom's Care Circle", role: 'ELDER', elderUid: 'elder1', createdAt: '2026-01-01' },
    seniorMode: false,
    toggleSeniorMode: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
  }),
}));

describe('Phase 2 Medication Views & Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TodayDoses View', () => {
    const mockDoses = [
      {
        id: 'dose-1',
        circleId: 'circle-1',
        medicineId: 'med-1',
        scheduledAt: '2026-03-01T08:00:00.000Z',
        status: 'pending',
        loggedAt: null,
        loggedBy: null,
        escalationStep: 0,
        medicineName: 'Metformin',
        dosage: '500mg',
        form: 'Tablet',
      },
    ];

    it('renders dose card with Color, Icon, and Text and big action buttons', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDoses);

      render(
        <BrowserRouter>
          <TodayDoses />
        </BrowserRouter>
      );

      await waitForElementToBeRemoved(() => screen.queryByRole('status'));

      expect(screen.getByText('Metformin')).toBeInTheDocument();
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mark Metformin as taken/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Skip dose of Metformin/i })).toBeInTheDocument();
    });

    it('has zero accessibility violations on TodayDoses screen according to axe', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockDoses);

      const { container } = render(
        <BrowserRouter>
          <TodayDoses />
        </BrowserRouter>
      );

      await waitForElementToBeRemoved(() => screen.queryByRole('status'));

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('StockView Screen', () => {
    const mockStock = [
      {
        id: 'med-1',
        circleId: 'circle-1',
        name: 'Amlodipine',
        dosage: '5mg',
        form: 'Tablet',
        schedule: { times: ['09:00'], daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startDate: '2026-01-01' },
        asNeeded: false,
        quantityRemaining: 15,
        refillThresholdDays: 7,
        lastRefillAlertLevel: 0,
        active: true,
        dosesPerDay: 1,
        daysLeft: 15,
        runOutDate: '2026-03-16',
        alertLevel: 0,
      },
    ];

    it('renders medication stock table with zero axe accessibility violations', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockStock);

      const { container } = render(
        <BrowserRouter>
          <StockView />
        </BrowserRouter>
      );

      await waitForElementToBeRemoved(() => screen.queryByRole('status'));

      expect(screen.getByText('Amlodipine')).toBeInTheDocument();
      expect(screen.getByText('15 units')).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Adherence Screen', () => {
    const mockAdherence = {
      sevenDayPercentage: 90,
      thirtyDayPercentage: 85,
      currentStreak: 5,
      totalScheduled30d: 60,
      totalTaken30d: 51,
      totalSkipped30d: 3,
      totalMissed30d: 6,
      dailyBreakdown: [
        {
          date: '2026-03-01',
          total: 2,
          taken: 2,
          missed: 0,
          skipped: 0,
          percentage: 100,
        },
      ],
      medicineBreakdown: [
        {
          medicineId: 'm1',
          medicineName: 'Metformin',
          total: 30,
          taken: 28,
          percentage: 93,
        },
      ],
    };

    it('renders accessible data table alternative for 30-day analytics', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockAdherence);

      const { container } = render(
        <BrowserRouter>
          <Adherence />
        </BrowserRouter>
      );

      await waitForElementToBeRemoved(() => screen.queryByRole('status'));

      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('🔥 5 Days')).toBeInTheDocument();
      expect(screen.getByRole('table', { name: /30-day adherence daily records/i })).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
