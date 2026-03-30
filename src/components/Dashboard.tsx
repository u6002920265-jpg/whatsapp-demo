import { useEffect } from 'react';
import { useChartData } from '../hooks/useChartData';
import { SummaryStats } from './SummaryStats';
import { TopContributors } from './TopContributors';
import { LeastParticipative } from './LeastParticipative';
import { OlympicPodium } from './OlympicPodium';
import { InactivePodium } from './InactivePodium';
import { MessageIntervals } from './MessageIntervals';
import { FilterControls } from './FilterControls';
import { ThemeToggle } from './ThemeToggle';
import { LoadingProgress } from './LoadingProgress';
import { DataImportPanel } from './DataImportPanel';
import { useDataSource } from '../context/DataSourceContext';
import { useFilter } from '../context/FilterContext';

export function Dashboard() {
  const { messages, loading, error, progress, groupName, datasetId } = useDataSource();
  const { clearFilters } = useFilter();
  const chartData = useChartData(messages);

  useEffect(() => {
    clearFilters();
  }, [datasetId, clearFilters]);

  if (loading) {
    return <LoadingProgress progress={progress} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
            Erro ao carregar dados
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Grupo {groupName ? ` — ${groupName}` : ''}
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="dashboard-content" className="max-w-7xl mx-auto px-4 py-6">
        <DataImportPanel />
        <FilterControls />

        {/* SummaryStats — full width */}
        <div className="chart-section">
          <SummaryStats data={chartData.summary} />
        </div>

        {/* Podiums side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="chart-section">
            <OlympicPodium data={chartData.userStats} />
          </div>
          <div className="chart-section">
            <InactivePodium data={chartData.userStats} />
          </div>
        </div>

        {/* Bar charts side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="chart-section">
            <TopContributors data={chartData.userStats} />
          </div>
          <div className="chart-section">
            <LeastParticipative data={chartData.userStats} />
          </div>
        </div>

        {/* MessageIntervals — full width */}
        <div className="chart-section">
          <MessageIntervals data={chartData.messageIntervals} />
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          WhatsApp Group Analytics Dashboard
        </div>
      </footer>
    </div>
  );
}
