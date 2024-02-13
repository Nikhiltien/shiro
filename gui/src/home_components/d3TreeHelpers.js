import * as d3 from 'd3';

export function initializeTree(data, svg, dimensions) {
    // Assign unique identifiers to each node
    let id = 0;
    const assignIds = (node, depth) => {
        node.id = `${depth}-${node.name}-${id++}`;
        if (node.children) {
            node.children.forEach(child => assignIds(child, depth + 1));
        }
    };
    assignIds(data, 0);

    // Define the tree layout
    const tree = d3.tree()
                   .size([dimensions.width, dimensions.height]);

    const root = d3.hierarchy(data, d => d.children);
    tree(root);

    // Pass the root to update functions
    updateNodes(root, svg);
    updateLinks(root, svg);
}

export function updateNodes(root, svg) {
    const nodes = svg.selectAll('.node')
                     .data(root.descendants(), d => d.data.id);

    const nodeEnter = nodes.enter().append('g')
                         .attr('class', 'node')
                         .attr('transform', d => `translate(${d.x},${d.y})`); // Swap x and y

    nodeEnter.append('circle')
             .attr('r', 5) // Set the radius of nodes
             .attr('fill', d => d.depth === 0 ? 'gray' : d.depth % 2 === 1 ? 'white' : 'black')
             .attr('stroke', '#000');

    nodeEnter.append('text')
             .attr('dy', '0.32em')
             .attr('x', d => d.children ? -6 : 6)
             .attr('text-anchor', d => d.children ? 'end' : 'start')
             .attr('paint-order', 'stroke')
             .attr('stroke', '#fff') // Halo effect
             .attr('stroke-width', 3) // Halo width
             .text(d => d.data.name);


    // Update existing nodes
    const nodeUpdate = nodes.merge(nodeEnter);
    nodeUpdate.transition().duration(500)
              .attr('transform', d => `translate(${d.x},${d.y})`);

    nodeUpdate.select('circle').attr('r', 5);
    nodeUpdate.select('text').style('font-size', '10px');

    // Remove any exiting nodes
    nodes.exit().transition().duration(500)
        .attr('transform', d => `translate(${d.y},${d.x})`)
        .remove();
}

export function updateLinks(root, svg) {
    const links = svg.selectAll('.link')
                     .data(root.links(), d => d.target.data.id);

    links.enter().append('path')
         .attr('class', 'link')
         .attr('fill', 'none')
         .attr('stroke', '#e0e1dd') // Set the stroke color
         .attr('stroke-width', 1.5) // Set the stroke width
         .attr('stroke-opacity', 0.4) // Set the stroke opacity
         .attr('d', d3.linkVertical()
                      .x(d => d.x)
                      .y(d => d.y));

    // Update existing links
    links.transition().duration(500)
         .attr('d', d3.linkVertical() // Change to linkVertical
                      .x(d => d.x)
                      .y(d => d.y));

    // Remove any exiting links
    links.exit().transition().duration(500).remove();
}