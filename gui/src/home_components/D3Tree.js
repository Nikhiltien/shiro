import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { initializeTree } from './d3TreeHelpers';

function D3Tree({ moves }) {
    const d3Container = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 300, height: 400 });

    // Debounced resize listener
    useEffect(() => {
        const debounceResize = debounce(() => {
            if (d3Container.current) {
                const rect = d3Container.current.getBoundingClientRect();
                setDimensions({
                    width: rect.width,
                    height: rect.height
                });
            }
        }, 250);

        window.addEventListener('resize', debounceResize);
        return () => window.removeEventListener('resize', debounceResize);
    }, []);

    // D3 rendering and updating
    useEffect(() => {
        if (d3Container.current && moves) {
            // Select the SVG, or append one if it doesn't exist
            const svg = d3.select(d3Container.current)
                          .selectAll('svg')
                          .data([null]);
            const svgEnter = svg.enter().append('svg')
                          .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
                          .attr("font-family", "sans-serif")
                          .attr("font-size", 10);

            // Create or select the 'g' element which will contain the tree
            const g = svgEnter.append('g')
                         .merge(svg.select('g'));

            // Define the zoom behavior
            const zoom = d3.zoom()
                           .scaleExtent([0.5, 2]) // Limit the zoom scale
                           .on("zoom", (event) => {
                               g.attr("transform", event.transform);
                           });

            // Apply the zoom behavior to the SVG
            svgEnter.merge(svg)
                .attr('viewBox', [0, 0, dimensions.width, dimensions.height])
                .call(zoom);

            // Initialize or update the tree
            initializeTree(moves, g, dimensions);
        }
    }, [moves, dimensions]);

    return <div ref={d3Container} style={{ width: '100%', height: '100%' }} />;
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

export default D3Tree;
