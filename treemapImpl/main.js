let width = 800
let height = 600

let GetChildrenFromData = (data) => {
  if (data.citylist) return data.citylist
  else if (data.c) return data.c
  else if (data.a) return data.a
}

let GetNodeName = (node) => {
  if (node.data.p) return node.data.p
  else if (node.data.n) return node.data.n
  else if (node.data.s) return node.data.s
}

let GetValueFromNode = (node) => {
  return node.children? 0: 1
}

let color = d3.scaleOrdinal(d3.schemeCategory10)

let canvas = d3.select("div")
  .append("svg")
  .attr("width", width)
  .attr("height", height)

d3.json('../data/China.json').then(data => {
  const root = treeify(data)
  console.log(root)
  const leaves = root.children//getLeaves(root)
  console.log(leaves)

  const nodes = squarify(leaves, 0, 0, width, height)
  console.log(leaves)

  let cells = canvas.selectAll('g')
    .data(nodes)
    .enter()
    .append('g')

  cells.append('rect')
    .attr('x', d => { return d.x0 })
    .attr('y', d => { return d.y0 })
    .attr('width', d => {return d.dx })
    .attr('height', d => {return d.dy })
    .attr('fill', d => { return color(GetNodeName(d))})

  cells.append('text')
    .attr('x', d => { return d.x0 + d.dx / 2 })
    .attr('y', d => { return d.y0 + d.dy / 2 })
    .attr('text-anchor', 'middle')
    .text(d => { return GetNodeName(d) })
})


function TreeNode (data) {
  this.data = data
  this.depth = 0
  this.height = 0
  this.parent = null
  this.children = null
}

/**
 * 计算treemap中各个矩形的左上角坐标和长宽
 * @param leaves TreeNode列表
 * @param x 原点坐标
 * @param y 原点坐标
 * @param dx treemap的水平宽度
 * @param dy treemap的垂直高度
 * @return TreeNode列表
 */
function squarify (leaves, x, y, dx, dy) {
  let width = dx, height = dy, ss = sum(leaves, 0, leaves.length)
  let nodes = leaves.slice(0)
  // 归一化
  scaleWeights(nodes, dx, dy)
  // 逆序排列
  nodes.sort((n1, n2) => {
    return n2.value - n1.value
  })

  let isVertical = dx >= dy
  let w = isVertical ? dy : dx
  let start = 0, end = start // row = nodes[start,...,end-1]
  while (end < nodes.length) {
    let c = nodes[end]
    let currValue = c.value
    let s = sum(nodes, start, end)
    let minR = min(nodes, start, end), maxR = max(nodes, start, end)

    let currWorst = worst(s, minR, maxR, w) // worst(row, w)
    let concatWorst = worst(s + currValue, Math.min(minR, currValue), Math.max(maxR, currValue), w) // worst(row++[c], w)

    if (end - start === 0 || currWorst > concatWorst) {
      end++ // row++[c]
    } else {
      //layoutrow(row)
      let rx = x, ry = y
      let z = s / w
      for (let j = start; j < end; j++) {
        let d = nodes[j].value / z
        if (isVertical) {
          nodes[j].x0 = rx
          nodes[j].y0 = ry
          nodes[j].dx = z
          nodes[j].dy = d

          ry = ry + d
        } else {
          nodes[j].x0 = rx
          nodes[j].y0 = ry
          nodes[j].dx = d
          nodes[j].dy = z

          rx = rx + d
        }
      }

      if (isVertical) {
        x = x + z
        dx = dx - z
      } else {
        y = y + z
        dy = dy - z
      }

      // squarify( children, [], width() )
      isVertical = dx >= dy
      w = isVertical ? dy : dx
      start = end                // row = []
    }
  }

  // 避免数组row中还剩最后一个node
  if (end - start > 0) {
    let rx = x, ry = y
    let s = sum(nodes, start, end)
    let z = s / w
    for (let j = start; j < end; j++) {
      let d = nodes[j].value / z
      if (isVertical) {
        nodes[j].x0 = rx
        nodes[j].y0 = ry
        nodes[j].dx = z
        nodes[j].dy = d

        ry = ry + d
      } else {
        nodes[j].x0 = rx
        nodes[j].y0 = ry
        nodes[j].dx = d
        nodes[j].dy = z

        rx = rx + d
      }
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    nodes[i].value = nodes[i].value * ss / (width * height)
  }

  return nodes
}

function worst (s, minR, maxR, w) {
  return Math.max((w * w * maxR) / (s * s), (s * s) / (w * w * minR))
}

function scaleWeights (nodes, dx, dy) {
  let scale = dx * dy / sum(nodes, 0, nodes.length)
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].value = scale * nodes[i].value
  }
}

function sum (nodes, start, end) {
  let total = 0
  for (let i = start; i < end; i++) {
    total += nodes[i].value
  }
  return total
}

function min (nodes, start, end) {
  let res = Infinity
  for (let i = start; i < end; i++) {
    res = Math.min(res, nodes[i].value)
  }
  return res
}

function max (nodes, start, end) {
  let res = -Infinity
  for (let i = start; i < end; i++) {
    res = Math.max(res, nodes[i].value)
  }
  return res
}

function treeify(data) {
  let root = new TreeNode(data)
  let currNode, nodeQueue = [root]

  // BFS
  while (currNode = nodeQueue.pop()) {
    let childList = GetChildrenFromData(currNode.data)
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

  initNodeValues(root)

  return root
}

function getLeaves(root) {
  let leaves = []
  let currNode, nodeQueue = [root]
  while (currNode = nodeQueue.pop()) {
    if (!currNode.children) {
      leaves.push(currNode)
    } else {
      for (let i = 0; i < currNode.children.length; i++)
        nodeQueue.push(currNode.children[i])
    }
  }
  return leaves
}

function initNodeValues(root) {
  if (!root.children) {
    root.value = GetValueFromNode(root)
    return root.value
  }

  let sum = 0
  for (let i = 0; i < root.children.length; i++) {
    sum += initNodeValues(root.children[i])
  }
  root.value = sum
  return root.value
}