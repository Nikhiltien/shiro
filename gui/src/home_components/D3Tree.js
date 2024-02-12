import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

function D3Tree({ moves }) {
    const d3Container = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Update dimensions based on the container size
    const updateSize = () => {
        if (d3Container.current) {
            const rect = d3Container.current.getBoundingClientRect();
            setDimensions({
                width: rect.width,
                height: rect.height
            });
            // console.log("Updated dimensions:", rect.width, rect.height);
        }
    };

    // Resize listener
    useEffect(() => {
        window.addEventListener('resize', updateSize);
        updateSize();

        return () => {
            window.removeEventListener('resize', updateSize);
        };
    }, []);

    useEffect(() => {
        if (moves && d3Container.current && dimensions.width && dimensions.height) {
            const margin = { top: 50, right: 120, bottom: 50, left: 120 },
                  width = dimensions.width - margin.left - margin.right,
                  height = dimensions.height - margin.top - margin.bottom;
    
            const tree = d3.tree().size([width, height]);
            const root = d3.hierarchy(moves, d => d.children);
            tree(root);
    
            d3.select(d3Container.current).selectAll("*").remove();
    
            const svg = d3.select(d3Container.current)
                          .append('svg')
                          .attr('width', width + margin.left + margin.right)
                          .attr('height', height + margin.top + margin.bottom)
                          .append('g')
                          .attr('transform', `translate(${margin.left},${margin.top})`);
    
            const zoom = d3.zoom()
                           .scaleExtent([0.5, 2])
                           .on('zoom', (event) => {
                             svg.attr('transform', event.transform);
                           });
    
            d3.select(d3Container.current).select('svg')
              .call(zoom)
              .call(zoom.transform, d3.zoomIdentity);
    
            // Draw links (lines)
            const link = svg.selectAll(".link")
                            .data(root.links())
                            .enter().append("path")
                            .attr("class", "link")
                            .attr("d", d3.linkVertical()
                                        .x(d => d.x)
                                        .y(d => d.y))
                            .style("stroke", "#555") // Stroke color
                            .style("stroke-width", "1.5px") // Stroke width
                            .style("fill", "none"); // No fill

    
            // Draw nodes
            const nodes = svg.selectAll('.node')
                             .data(root.descendants())
                             .enter().append('g')
                             .attr('class', 'node')
                             .attr('transform', d => `translate(${d.x},${d.y})`);
    
            nodes.append('circle')
                 .attr('r', 10);
    
            nodes.append('text')
                 .attr('dy', '0.35em')
                 .attr('x', d => d.children && d.children.length > 0 ? -13 : 13)
                 .style('text-anchor', d => d.children && d.children.length > 0 ? 'end' : 'start')
                 .text(d => d.data.name);
        }
    }, [moves, dimensions]);
    
    
    
    return (
        <div ref={d3Container} style={{ width: '100%', height: '100%' }} />
    );
}

export default D3Tree;