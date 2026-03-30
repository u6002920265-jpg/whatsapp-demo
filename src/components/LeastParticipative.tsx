import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { UserStats } from '../types';
import { useFilter } from '../context/FilterContext';
import { getUserColor } from '../utils/colorScale';

interface LeastParticipativeProps {
  data: UserStats[];
}

export function LeastParticipative({ data }: LeastParticipativeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toggleUser, selectedUsers } = useFilter();

  const bottom10 = [...data].sort((a, b) => a.messageCount - b.messageCount).slice(0, 10);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || bottom10.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const barHeight = 35;
    const margin = { top: 20, right: 60, bottom: 40, left: 150 };
    const height = Math.max(400, bottom10.length * barHeight + margin.top + margin.bottom);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const maxValue = d3.max(bottom10, d => d.messageCount) || 0;

    const xScale = d3.scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([0, chartWidth]);

    const yScale = d3.scaleBand()
      .domain(bottom10.map(d => d.name))
      .range([0, chartHeight])
      .padding(0.3);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .selectAll('text')
      .attr('class', 'fill-gray-600 dark:fill-gray-300');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .attr('class', 'fill-gray-600 dark:fill-gray-300 text-sm')
      .style('cursor', 'pointer')
      .on('click', (_, name) => toggleUser(name as string));

    g.selectAll('.bar')
      .data(bottom10)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', d => yScale(d.name)!)
      .attr('width', d => xScale(d.messageCount))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => getUserColor(d.name))
      .attr('opacity', d => selectedUsers.length === 0 || selectedUsers.includes(d.name) ? 1 : 0.3)
      .style('cursor', 'pointer')
      .on('click', (_, d) => toggleUser(d.name));

    g.selectAll('.label')
      .data(bottom10)
      .enter()
      .append('text')
      .attr('x', d => xScale(d.messageCount) + 5)
      .attr('y', d => yScale(d.name)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('class', 'fill-gray-700 dark:fill-gray-300 text-xs')
      .text(d => d.messageCount);

  }, [bottom10, selectedUsers, toggleUser]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Menos Participativos
      </h2>
      <div ref={containerRef} className="w-full overflow-x-auto">
        <svg ref={svgRef} className="w-full" />
      </div>
    </div>
  );
}
