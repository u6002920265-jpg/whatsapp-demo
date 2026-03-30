import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { MessageIntervalData } from '../types';
import { useFilter } from '../context/FilterContext';
import { getUserColor } from '../utils/colorScale';

interface MessageIntervalsProps {
  data: MessageIntervalData[];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.round((seconds % 86400) / 3600);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

export function MessageIntervals({ data }: MessageIntervalsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toggleUser, selectedUsers } = useFilter();

  const top10 = data.slice(0, 10);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || top10.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const barHeight = 35;
    const margin = { top: 20, right: 100, bottom: 40, left: 150 };
    const height = Math.max(400, top10.length * barHeight + margin.top + margin.bottom);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const maxValue = d3.max(top10, d => d.avgInterval) || 0;

    const xScale = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([0, chartWidth]);

    const yScale = d3.scaleBand()
      .domain(top10.map(d => d.name))
      .range([0, chartHeight])
      .padding(0.3);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => formatDuration(d as number)))
      .selectAll('text')
      .attr('class', 'fill-gray-600 dark:fill-gray-300');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .attr('class', 'fill-gray-600 dark:fill-gray-300 text-sm')
      .style('cursor', 'pointer')
      .on('click', (_, name) => toggleUser(name as string));

    g.selectAll('.bar')
      .data(top10)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', d => yScale(d.name)!)
      .attr('width', d => xScale(d.avgInterval))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => getUserColor(d.name))
      .attr('opacity', d => selectedUsers.length === 0 || selectedUsers.includes(d.name) ? 1 : 0.3)
      .style('cursor', 'pointer')
      .on('click', (_, d) => toggleUser(d.name));

    g.selectAll('.label')
      .data(top10)
      .enter()
      .append('text')
      .attr('x', d => xScale(d.avgInterval) + 5)
      .attr('y', d => yScale(d.name)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('class', 'fill-gray-700 dark:fill-gray-300 text-xs')
      .text(d => formatDuration(d.avgInterval));

  }, [top10, selectedUsers, toggleUser]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Intervalo Médio entre Mensagens
      </h2>
      <div ref={containerRef} className="w-full overflow-x-auto">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  );
}
