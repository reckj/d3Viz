console.log('... setup ...');

const data = [
  {
    size: 100,
    color: '#FFDE17',
  },
  {
    size: 210,
    color: '#FFD520',
  },
  {
    size: 140,
    color: '#FAB545',
  },
  {
    size: 57,
    color: '#FFD877',
  },
];

const distance = 160;

// creating an svg within the div with id #d3
const svg = d3
  .select('.sky-svg');

const line = svg
  // using the same svg selection from before and adding a line
  .append('line')
    // adding a class attribute for stroke styling (see style.css)
    .attr('class', 'axis')
    // and adding line specific attributes to define the line
    .attr('x1', 10)
    .attr('y1', 20)
    .attr('x2', 743) // svg has more or less the width of 753px (viewBox="0 0 753.3 798.3") - we stop 10px before 753
    .attr('y2', 20);
  
svg 
  // selecting is necessary, but we can add a random selector here ('whatever')
  // the return value is an empty selection:
  // https://github.com/d3/d3-selection/blob/v3.0.0/README.md#selectAll
  // if you ask yourself why:
  // https://stackoverflow.com/questions/17452508/what-is-the-point-of-calling-selectall-when-there-are-no-existing-nodes-yet-on-d
  .selectAll('whatever')
  .data(data)
  .enter()
  .append('circle')
    .attr('cx', (d, currentIndex) => currentIndex * distance + distance)
    // is the same as:
    // .attr('cx', function(d, currentIndex) { return currentIndex * distance + distance })
    // but a bit more new school
    .attr('cy', (d) =>  300)
    .attr('r', (d) => d.size / 2)
    .attr('fill', (d) => d.color);


// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/sunburst
function Sunburst(data, { // data is either tabular (array of objects) or hierarchy (nested objects)
  path, // as an alternative to id and parentId, returns an array identifier, imputing internal nodes
  id = Array.isArray(data) ? d => d.id : null, // if tabular data, given a d in data, returns a unique identifier (string)
  parentId = Array.isArray(data) ? d => d.parentId : null, // if tabular data, given a node d, returns its parent’s identifier
  children, // if hierarchical data, given a d in data, returns its children
  value, // given a node d, returns a quantitative value (for area encoding; null for count)
  sort = (a, b) => d3.descending(a.value, b.value), // how to sort nodes prior to layout
  label, // given a node d, returns the name to display on the rectangle
  title, // given a node d, returns its hover text
  link, // given a node d, its link (if any)
  linkTarget = "_blank", // the target attribute for links (if any)
  width = 640, // outer width, in pixels
  height = 400, // outer height, in pixels
  margin = 1, // shorthand for margins
  marginTop = margin, // top margin, in pixels
  marginRight = margin, // right margin, in pixels
  marginBottom = margin, // bottom margin, in pixels
  marginLeft = margin, // left margin, in pixels
  padding = 1, // separation between arcs
  radius = Math.min(width - marginLeft - marginRight, height - marginTop - marginBottom) / 2, // outer radius
  color = d3.interpolateRainbow, // color scheme, if any
  fill = "#ccc", // fill for arcs (if no color encoding)
  fillOpacity = 0.6, // fill opacity for arcs
} = {}) {

  // If a path accessor is specified, we can impute the internal nodes from the slash-
  // separated path; otherwise, the tabular data must include the internal nodes, not
  // just leaves. TODO https://github.com/d3/d3-hierarchy/issues/33
  if (path != null) {
    const D = d3.map(data, d => d);
    const I = d3.map(data, path).map(d => (d = `${d}`).startsWith("/") ? d : `/${d}`);
    const paths = new Set(I);
    for (const path of paths) {
      const parts = path.split("/");
      while (parts.pop(), parts.length) {
        const path = parts.join("/") || "/";
        if (paths.has(path)) continue;
        paths.add(path), I.push(path), D.push(null);
      }
    }
    id = (_, i) => I[i];
    parentId = (_, i) => I[i] === "/" ? "" : I[i].slice(0, I[i].lastIndexOf("/")) || "/";
    data = D;
  }

  // If id and parentId options are specified (perhaps implicitly via the path option),
  // use d3.stratify to convert tabular data to a hierarchy; otherwise we assume that
  // the data is specified as an object {children} with nested objects (a.k.a. the
  // “flare.json” format), and use d3.hierarchy.
  const root = id == null && parentId == null
      ? d3.hierarchy(data, children)
      : d3.stratify().id(id).parentId(parentId)(data);

  // Compute the values of internal nodes by aggregating from the leaves.
  value == null ? root.count() : root.sum(value);

  // Sort the leaves (typically by descending value for a pleasing layout).
  if (sort != null) root.sort(sort);

  // Compute the partition layout. Note polar coordinates: x is angle and y is radius.
  d3.partition().size([2 * Math.PI, radius])(root);

  // Construct a color scale.
  if (color != null) {
    color = d3.scaleSequential([0, root.children.length - 1], color).unknown(fill);
    root.children.forEach((child, i) => child.index = i);
  }

  // Construct an arc generator.
  const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 2 * padding / radius))
      .padRadius(radius / 2)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 - padding);

  const svg = d3.create("svg")
      .attr("viewBox", [-marginLeft - radius, -marginTop - radius, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "middle");

  const cell = svg
    .selectAll("a")
    .data(root.descendants())
    .join("a")
      .attr("xlink:href", link == null ? null : d => link(d.data, d))
      .attr("target", link == null ? null : linkTarget);

  cell.append("path")
      .attr("d", arc)
      .attr("fill", color ? d => color(d.ancestors().reverse()[1]?.index) : fill)
      .attr("fill-opacity", fillOpacity);

  if (label != null) cell
    .filter(d => (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10)
    .append("text")
      .attr("transform", d => {
        if (!d.depth) return;
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "0.32em")
      .text(d => label(d.data, d));

  if (title != null) cell.append("title")
      .text(d => title(d.data, d));

  return svg.node();
}