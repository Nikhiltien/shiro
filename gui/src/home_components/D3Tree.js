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
        // console.log("Received moves data:", moves);
        if (moves && d3Container.current && dimensions.width && dimensions.height) {
            const margin = { top: 20, right: 20, bottom: 20, left: 20 },
                  width = dimensions.width - margin.left - margin.right,
                  height = dimensions.height - margin.top - margin.bottom; 

            // console.log("Setting up tree with dimensions:", width, height);

            const tree = d3.tree().size([height, width]);
            const root = d3.hierarchy(moves);
            tree(root);

            // console.log("D3 hierarchy root:", root);

            d3.select(d3Container.current).selectAll("*").remove(); // Clear the container first

            const svg = d3.select(d3Container.current)
                          .append('svg')
                          .attr('width', width + margin.right + margin.left)
                          .attr('height', height + margin.top + margin.bottom)
                          .append('g')
                          .attr('transform', `translate(${margin.left},${margin.top})`);

            // Add zoom functionality
            const zoom = d3.zoom()
                           .scaleExtent([0.5, 2]) // Limit the zoom scale
                           .on('zoom', (event) => {
                             svg.attr('transform', event.transform);
                           });
            
            d3.select(d3Container.current).select('svg')
              .call(zoom)
              .call(zoom.transform, d3.zoomIdentity); // Set initial zoom state

            // Create the node circles
            const nodes = svg.selectAll('.node')
                             .data(root.descendants())
                             .enter().append('g')
                             .attr('class', d => `node${d.children ? ' node--internal' : ' node--leaf'}`)
                             .attr('transform', d => `translate(${d.y},${d.x})`);

            // console.log("Nodes data:", nodes);

            nodes.append('circle')
                 .attr('r', 10);

            nodes.append('text')
                 .attr('dy', '.35em')
                 .attr('x', d => d.children ? -13 : 13)
                 .style('text-anchor', d => d.children ? 'end' : 'start')
                 .text(d => d.data.name);

            // console.log("SVG after nodes and text:", d3Container.current.innerHTML);
        } // else {
        //     console.log("Data, container, or dimensions not valid.");
        // }
    }, [moves, dimensions]);
    
    return (
        <div ref={d3Container} style={{ width: '100%', height: '100%' }} />
    );
}

export default D3Tree;