import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import type { UserInfractions, Infraction } from '../types';
import { getUserColor } from '../utils/colorScale';

interface InfractionsChartProps {
  data: UserInfractions[];
}

const SEVERITY_LABEL: Record<Infraction['severity'], string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

const SEVERITY_COLOR: Record<Infraction['severity'], string> = {
  low: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export function InfractionsChart({ data }: InfractionsChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const sorted = [...data]
    .filter((u) => u.infractions.length > 0)
    .sort((a, b) => b.infractions.length - a.infractions.length);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || sorted.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const barHeight = 35;
    const margin = { top: 20, right: 60, bottom: 40, left: 150 };
    const height = Math.max(200, sorted.length * barHeight + margin.top + margin.bottom);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const maxValue = d3.max(sorted, (d) => d.infractions.length) ?? 0;

    const xScale = d3.scaleLinear().domain([0, maxValue * 1.15]).range([0, chartWidth]);
    const yScale = d3
      .scaleBand()
      .domain(sorted.map((d) => d.user))
      .range([0, chartHeight])
      .padding(0.3);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(Math.min(maxValue, 6)).tickFormat(d3.format('d')))
      .selectAll('text')
      .attr('class', 'fill-gray-600 dark:fill-gray-300');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .attr('class', 'fill-gray-600 dark:fill-gray-300 text-sm')
      .style('cursor', 'pointer')
      .on('click', (_, name) =>
        setExpandedUser((prev) => (prev === name ? null : (name as string))),
      );

    g.selectAll('.bar')
      .data(sorted)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.user)!)
      .attr('width', (d) => xScale(d.infractions.length))
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => getUserColor(d.user))
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('click', (_, d) =>
        setExpandedUser((prev) => (prev === d.user ? null : d.user)),
      );

    g.selectAll('.label')
      .data(sorted)
      .enter()
      .append('text')
      .attr('x', (d) => xScale(d.infractions.length) + 5)
      .attr('y', (d) => yScale(d.user)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('class', 'fill-gray-700 dark:fill-gray-300 text-xs')
      .text((d) => d.infractions.length);
  }, [sorted]);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm">
        Nenhuma infração detetada nos dados analisados.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="w-full overflow-x-auto">
        <svg ref={svgRef} className="w-full" />
      </div>

      {expandedUser && (
        <InfractionDetail
          user={expandedUser}
          infractions={sorted.find((u) => u.user === expandedUser)?.infractions ?? []}
          onClose={() => setExpandedUser(null)}
        />
      )}
    </div>
  );
}

function InfractionDetail({
  user,
  infractions,
  onClose,
}: {
  user: string;
  infractions: Infraction[];
  onClose: () => void;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {user} — {infractions.length} infração{infractions.length !== 1 ? 'ões' : ''}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
        {infractions.map((inf, i) => (
          <div key={i} className="px-4 py-3 space-y-1">
            <div className="flex items-start gap-2">
              <span
                className={`shrink-0 mt-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${SEVERITY_COLOR[inf.severity]}`}
              >
                {SEVERITY_LABEL[inf.severity]}
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {inf.rule}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic pl-1">
              "{inf.message}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
