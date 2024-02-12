import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

function D3Tree({ moves }) {
    const d3Container = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 400 }); // Default dimensions

    // Resize listener and update dimensions
    useEffect(() => {
        const updateSize = () => {
            if (d3Container.current) {
                const rect = d3Container.current.getBoundingClientRect();
                setDimensions({
                    width: rect.width,
                    height: rect.height
                });
            }
        };

        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // D3 rendering and updating
    useEffect(() => {
        if (d3Container.current && moves) {
            const { width, height } = dimensions;
            const margin = { top: 20, right: 120, bottom: 20, left: 120 };

            // Clear existing SVG to prevent duplication
            d3.select(d3Container.current).selectAll("*").remove();

            const svg = d3.select(d3Container.current)
                          .append('svg')
                          .attr('viewBox', [0, 0, width, height])
                          .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

            // Enable zoom and drag
            svg.call(d3.zoom().on("zoom", (event) => {
                g.attr("transform", event.transform);
            }));

            const g = svg.append('g')
                         .attr('transform', `translate(${margin.left},${margin.top})`);

            // Create the tree layout
            const tree = d3.tree()
                           .size([height - margin.top - margin.bottom, width - margin.left - margin.right]) // Adjusted for vertical layout
                           .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

            updateTree(moves, g, tree, dimensions, margin); // Pass dimensions and margin
        }
    }, [moves, dimensions]);

    return <div ref={d3Container} style={{ width: '100%', height: '100%' }} />;
}

function updateTree(data, svg, treeLayout, dimensions, margin) {
    // Assign unique identifiers to each node
    let id = 0;
    const assignIds = (node, depth) => {
        node.id = `${depth}-${node.name}-${id++}`;
        if (node.children) {
            node.children.forEach(child => assignIds(child, depth + 1));
        }
    };
    assignIds(data, 0);

    const root = d3.hierarchy(data, d => d.children);

    // Use dimensions and margin here
    treeLayout.size([dimensions.height - margin.left - margin.right, dimensions.width - margin.bottom - margin.top]);

    treeLayout(root);

    // Update the nodes
    const nodes = svg.selectAll('.node')
                     .data(root.descendants(), d => d.data.id);

    // Enter selection for new nodes
    const nodeEnter = nodes.enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    nodeEnter.append('circle')
        .attr('fill', '#555')
        .attr('r', 5);

    nodeEnter.append('text')
        .attr('dy', '0.32em')
        .attr('x', d => d.children ? -8 : 8)
        .attr('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.name);

    // Update existing nodes
    const nodeUpdate = nodes.merge(nodeEnter);
    nodeUpdate.transition().duration(500)
        .attr('transform', d => `translate(${d.x},${d.y})`);

    nodeUpdate.select('circle')
        .attr('fill', '#555')
        .attr('r', 5);

    nodeUpdate.select('text')
        .text(d => d.data.name);

    // Remove any exiting nodes
    const nodeExit = nodes.exit().transition().duration(500)
        .attr('transform', d => `translate(${d.y},${d.x})`)
        .remove();

    nodeExit.select('circle')
        .attr('r', 1e-6);

    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // Links
    const links = svg.selectAll('.link')
                     .data(root.links(), d => d.target.data.id);

    // Enter any new links
    const linkEnter = links.enter().append('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#555') // Link color
        .attr('stroke-width', 1.5)
        .attr('d', d3.linkVertical() // Updated to linkVertical
                      .x(d => d.x) // Updated to use x for horizontal position
                      .y(d => d.y)); // Updated to use y for vertical position

    // Update existing links
    const linkUpdate = links.merge(linkEnter);
    linkUpdate.transition().duration(500)
        .attr('d', d3.linkVertical() // Updated to linkVertical
                     .x(d => d.x) // Updated to use x
                     .y(d => d.y)); // Updated to use y

    // Remove any exiting links
    links.exit().transition().duration(500).remove();
}

export default D3Tree;
