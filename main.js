let width = 600
let height = 400

let canvas = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)

let treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([width, height])
    .round(true)
    .paddingInner(10);

d3.json("data/test.json").then(data => {
    // 将数据转成一棵树
    const root = d3.hierarchy(data)
        .sum( d => { return d.value } )
    console.log(root)

    treemap(root);

    console.log(root)
    console.log(root.leaves())


    let cells = canvas.selectAll("g")
        .data(root.leaves())
        .enter()
        .append("g")
        .attr("transform", d => { return "translate(" + d.x0 + "," + d.y0 + ")" })

    cells.append("rect")
        .attr("width", d => { return d.x1 - d.x0 })
        .attr("height", d => { return d.y1 - d.y0 })

})