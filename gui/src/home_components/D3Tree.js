import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

function D3Tree({ data }) {
  const d3Container = useRef(null);

  useEffect(() => {
    if (data && d3Container.current) {
      const margin = { top: 10, right: 120, bottom: 10, left: 40 },
            width = 960 - margin.right - margin.left,
            height = 500 - margin.top - margin.bottom;

      const tree = d3.tree().size([height, width]);
      const root = d3.hierarchy(data);

      tree(root);

      d3.select(d3Container.current).selectAll("*").remove(); // Clear the container first

      const svg = d3.select(d3Container.current)
                    .append('svg')
                    .attr('width', width + margin.right + margin.left)
                    .attr('height', height + margin)
                    .append('g')
                    .attr('transform', `translate(${margin.left},${margin.top})`);

      // Create the links between the nodes
      const links = svg.selectAll('.link')
                       .data(root.descendants().slice(1))
                       .enter().append('path')
                       .attr('class', 'link')
                       .attr('d', d => `M${d.y},${d.x}C${(d.y + d.parent.y) / 2},${d.x} ${(d.y + d.parent.y) / 2},${d.parent.x} ${d.parent.y},${d.parent.x}`);

      // Create the node circles
      const nodes = svg.selectAll('.node')
                       .data(root.descendants())
                       .enter().append('g')
                       .attr('class', d => `node${d.children ? ' node--internal' : ' node--leaf'}`)
                       .attr('transform', d => `translate(${d.y},${d.x})`);

      nodes.append('circle')
           .attr('r', 10);

      nodes.append('text')
           .attr('dy', '.35em')
           .attr('x', d => d.children ? -13 : 13)
           .style('text-anchor', d => d.children ? 'end' : 'start')
           .text(d => d.data.name);
    }
  }, [data]);

  return (
    <div ref={d3Container} />
  );
}

export default D3Tree;
