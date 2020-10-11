const mergeData = ([covidData, obesityData]) => {
  const dataset = [];
  covidData.forEach(data => {
    const state = obesityData.find(d => d["NAME"] === data["State"]);
    dataset.push({
      ...data,
      infectionRate: Number(data["Infected"] / data["Population"]),
      obesity: state["Obesity"],
    });
  });
  return dataset;
};

const createGraph = async (x, y) => {
  // 1. Access data
  const dataset = await Promise.all([
    await d3.csv("./covid19 state.csv"),
    await d3.csv("./National_Obesity_By_State.csv")
  ]).then(mergeData);

  const xAccessor = d => d[x];
  const yAccessor = d => d[y];

  // 2. Create chart dimensions
  /*
    Since we're creating a scatterplot graph, the width and height should be the same...
    We need to leave space for the x and y axis
  */
  let dimensions = {
    width: 600,
    height: 600,
    marginTop: 10,
    marginRight: 10,
    marginBottom: 50,
    marginLeft: 50
  };
  dimensions.boundedWidth = dimensions.width - dimensions.marginLeft - dimensions.marginRight;
  dimensions.boundedHeight = dimensions.height - dimensions.marginTop - dimensions.marginBottom;

  // 3. Draw canvas
  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

  const bounds = wrapper.append("g")
      .style("transform", `translate(${
        dimensions.marginLeft
      }px, ${
        dimensions.marginRight
      }px)`);

  // 4. Create scales
  const xScale = d3.scaleLinear()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);
  
  const yScale = d3.scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0]);
  
  // 5. Draw data
  const dots = bounds.selectAll("circle")
      .data(dataset)
    .enter().append("circle")
      .attr("cx", d => xScale(xAccessor(d)))
      .attr("cy", d => yScale(yAccessor(d)))
      .attr("r", 3)
      .attr("fill", "blue");

  // 6. Add peripherals
  const xAxisGenerator = d3.axisBottom()
    .scale(xScale);

  const xAxis = bounds.append("g")
    .call(xAxisGenerator)
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  const yAxisGenerator = d3.axisLeft()
    .scale(yScale)
    .ticks(10);
  
  const yAxis = bounds.append("g")
    .call(yAxisGenerator);

  // 7. Add interactions
  const delaunay = d3.Delaunay.from(
    dataset,
    d => xScale(xAccessor(d)),
    d => yScale(yAccessor(d)),
  );

  const voronoi = delaunay.voronoi();
  voronoi.xmax = dimensions.boundedWidth;
  voronoi.ymax = dimensions.boundedHeight;

  
  
  bounds.selectAll(".voronoi")
  .data(dataset)
  .enter().append("path")
  .attr("class", "voronoi")
  .attr("d", (d, i) => voronoi.renderCell(i))
  .attr("fill", "none")
  .on("mouseenter", onMouseEnter)
  .on("mouseleave", onMouseLeave);
  
  function onMouseEnter() {
    const datum = d3.select(this).datum();
    console.log(`You entered ${datum.State}`);
    const dayDot = bounds.append("circle")
    .attr("class", "tooltipDot")
    .attr("cx", xScale(xAccessor(datum)))
    .attr("cy", yScale(yAccessor(datum)))
    .attr("r", 7)
    .style("fill", "maroon")
    .style("pointer-events", "none");
  }

  function onMouseLeave() {}
};

createGraph("Income", "obesity");