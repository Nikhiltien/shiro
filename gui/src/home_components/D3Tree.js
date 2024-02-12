import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

function parseMoves(moves) {
    if (!moves) {
        return { name: "Start", children: [] }; // Return a default structure if moves is not provided
    }

    const moveList = moves.split(/\d+\./).map(move => move.trim()).filter(move => move);
    const root = { name: "Start", children: [] };
    let currentNode = root;

    moveList.forEach(move => {
        const variations = move.split(/\(\s*|\s*\)/).map(variation => variation.trim()).filter(variation => variation);
        const mainMove = variations.shift(); // First element is the main move

        currentNode.children = [{ name: mainMove }];
        currentNode = currentNode.children[0]; // Move to the new main move node

        variations.forEach(variation => {
            if (!currentNode.children) {
                currentNode.children = [];
            }
            currentNode.children.push({ name: variation });
        });
    });

    return root;
}

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
        const data = parseMoves(moves);
        if (data && d3Container.current && dimensions.width && dimensions.height) {
            const margin = { top: 20, right: 20, bottom: 20, left: 20 },
                  width = dimensions.width - margin.left - margin.right,
                  height = dimensions.height - margin.top - margin.bottom; 

            const tree = d3.tree().size([height, width]);
            const root = d3.hierarchy(data);
            tree(root);

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
            }, [moves, dimensions]);
        
            return (
                <div ref={d3Container} style={{ width: '100%', height: '100%' }} />
            );
        }
        
        export default D3Tree;
