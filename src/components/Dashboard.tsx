import { useChartData } from '../hooks/useChartData';
import { SummaryStats } from './SummaryStats';
import { TopContributors } from './TopContributors';
import { LeastParticipative } from './LeastParticipative';
import { OlympicPodium } from './OlympicPodium';
import { InactivePodium } from './InactivePodium';
import { MessageIntervals } from './MessageIntervals';
import { FilterControls } from './FilterControls';
import { InfractionsAnalysis } from './InfractionsAnalysis';
import { FilterProvider } from '../context/FilterContext';
import type { Message } from '../types';

interface DashboardProps {
  messages: Message[];
}

function DashboardContent({ messages }: DashboardProps) {
  const chartData = useChartData(messages);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <main id="dashboard-content" className="max-w-7xl mx-auto px-4 py-6">
        <FilterControls />

        <div className="chart-section">
          <SummaryStats data={chartData.summary} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="chart-section">
            <OlympicPodium data={chartData.userStats} />
          </div>
          <div className="chart-section">
            <InactivePodium data={chartData.userStats} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="chart-section">
            <TopContributors data={chartData.userStats} />
          </div>
          <div className="chart-section">
            <LeastParticipative data={chartData.userStats} />
          </div>
        </div>

        <div className="chart-section">
          <MessageIntervals data={chartData.messageIntervals} />
        </div>

        <div className="chart-section">
          <InfractionsAnalysis messages={messages} />
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

export function Dashboard({ messages }: DashboardProps) {
  return (
    <FilterProvider>
      <DashboardContent messages={messages} />
    </FilterProvider>
  );
}
