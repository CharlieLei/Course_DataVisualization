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

d3.json("../data/tree.json").then(data => {
  // 将数据转成一棵树
  const root = treeify(data)
  console.log(root)
  const res = CalcNodePositions(root)
  console.log(res)
  // let cells = canvas.selectAll("g")
  //   .data(root.leaves())
  //   .enter()
  //   .append("g")
  //   .attr("transform", d => { return "translate(" + d.x0 + "," + d.y0 + ")" })
  //
  // cells.append("rect")
  //   .attr("width", d => { return d.x1 - d.x0 })
  //   .attr("height", d => { return d.y1 - d.y0 })

})

function CalcNodePositions(root) {
  InitNodes(root)
  CalcInitialX(root)
  CalcFinalPositions(root, 0)
  return root
}

function InitNodes(node) {

}

function CalcInitialX(node) {

}

function CalcFinalPositions(node, modSum) {

}


function TreeNode (data) {
  this.data = data
  this.depth = 0
  this.parent = null
  this.children = null
}

function treeify(data) {
  let root = new TreeNode(data)
  let currNode, nodeQueue = [root]

  // BFS
  while (currNode = nodeQueue.pop()) {
    let childList = (currNode.data.children)
    if (childList) {
      childList = Array.from(childList)
      let n = childList.length
      for (let i = 0; i < n; i++) {
        childList[i] = new TreeNode(childList[i])
        let currChild = childList[i]
        nodeQueue.push(currChild)
        currChild.parent = currNode
        currChild.depth = currNode.depth + 1
      }
      currNode.children = childList;
    }
  }

  return root
}

function IsLeaf (node) {
  return node.children.length === 0
}

function IsLeftMost (node) {
  if (node.parent === null) return true
  else return node.parent.children[0] === node
}

function IsRightMost (node) {
  if (node.parent === null) return true
  else return node.parent.children[node.parent.children.length - 1] === node
}

function GetPrevSibling(node) {
  if ( node.parent === null || IsLeftMost(node) ) return null
  else return node.parent.children[node.parent.children.indexOf(node) - 1]
}

function GetNextSibling(node) {
  if ( node.parent === null || IsRightMost(node) ) return null
  else return node.parent.children[node.parent.children.indexOf(node) + 1]
}

function GetLeftmostSibling(node) {
  if (node.parent === null) return null
  else return node.parent.children[0]
}

function GetLeftmostChild(node) {
  if (node.children) return null
  else return node.children[0]
}

function GetRightmostChild(node) {
  if (node.children) return null
  else return node.children[node.children.length - 1]
}
