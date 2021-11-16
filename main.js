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