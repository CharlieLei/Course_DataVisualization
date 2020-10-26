// function TreeNode(data) {
//     this.data = data
//     this.depth = 0
//     this.height = 0
//     this.parent = null
// }

// function getChildrenFromData(d) {
//     return d.children;
// }
//
// function getValueFromData(d) {
//     return d.value
// }
//
// function getSumOfNodeValue(nodeList) {
//     let n = nodeList.length
//     let sum = 0
//     for (let i = 0; i < n; i++) {
//         sum += nodeList[i].data.value
//     }
//     return sum
// }
//
// function treeify(data) {
//     let root = new TreeNode(data)
//     let currNode, nodeQueue = [root]
//
//     // BFS
//     while (currNode = nodeQueue.pop()) {
//         let childList = getChildrenFromData(currNode.data)
//         if (childList) {
//             childList = Array.from(childList)
//             let n = childList.length
//             let sum = 0
//             for (let i = 0; i < n; i++) {
//                 sum += getValueFromData(childList[i])
//                 childList[i] = new TreeNode(childList[i])
//                 let currChild = childList[i]
//                 nodeQueue.push(currChild)
//                 currChild.parent = currNode
//                 currChild.depth = currNode.depth + 1
//             }
//             currNode.children = childList;
//             currNode.value = sum
//         }
//     }
//
//     return root
// }

// function getLeaves(root) {
//     let leaves = []
//     let currNode, nodeQueue = [root]
//     while (currNode = nodeQueue.pop()) {
//         if (!currNode.children) {
//             leaves.push(currNode)
//         } else {
//             for (let i = 0; i < currNode.children.length; i++)
//                 nodeQueue.push(currNode.children[i])
//         }
//     }
//     return leaves
// }

function Rect(x, y, dx, dy, value) {
  this.x0 = x
  this.y0 = y
  this.dx = dx
  this.dy = dy
  this.value = value
}

/**
 * 计算treemap中各个矩形的左上角坐标和长宽
 * @param sizes TreeNode列表，要求列表中的节点是倒序且每个node.value的和等于dx * dy
 * @param x 原点坐标
 * @param y 原点坐标
 * @param dx treemap的水平宽度
 * @param dy treemap的垂直高度
 * @return TreeNode列表
 */
function squarify (sizes, x, y, dx, dy) {
  let children = sizes.slice(0)
  // 归一化
  scaleWeights(children, dx, dy)
  // 逆序排列
  children.sort((n1, n2) => { return n2 - n1 })

  let res = []

  let isVertical = dx >= dy
  let w = isVertical ? dy : dx
  let row = []
  while (children.length > 0) {
    let c = children[0]
    let currValue = c
    let s = sum(row)
    let minR = min(row), maxR = max(row)
    let currWorst = worst(s, minR, maxR, w) // worst(row, w)
    let concatWorst = worst(s + currValue, Math.min(minR, currValue), Math.max(maxR, currValue), w) // worst(row++[c], w)
    if (row.length === 0 || currWorst > concatWorst) {
      row.push(c) // row++[c]
      children.shift() // tail(children)
    } else {
      //layoutrow(row)
      let rx = x, ry = y
      let z = s / w
      for (let j = 0; j < row.length; j++) {
        let d = row[j] / z
        if (isVertical) {
          res.push(new Rect(rx, ry, z, d, row[j]))
          ry = ry + d
        } else {
          res.push(new Rect(rx, ry, d, z, row[j]))
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
      w = isVertical? dy: dx
      row = []
    }
  }

  if (row.length > 0) {
    let rx = x, ry = y
    let s = sum(row)
    let z = s / w
    for (let j = 0; j < row.length; j++) {
      let d = row[j] / z
      if (isVertical) {
        res.push(new Rect(rx, ry, z, d, row[j]))
        ry = ry + d
      } else {
        res.push(new Rect(rx, ry, d, z, row[j]))
        rx = rx + d
      }
    }
  }
  return res
}

function worst (s, minR, maxR, w) {
  return Math.max((w * w * maxR) / (s * s), (s * s) / (w * w * minR))
}

function scaleWeights (sizes, dx, dy) {
  let scale = dx * dy / sum(sizes)
  for (let i = 0; i < sizes.length; i++) {
    sizes[i] = scale * sizes[i]
  }
}

function sum (sizes) {
  let total = 0
  for (let i = 0; i < sizes.length; i++) {
    total += sizes[i]
  }
  return total
}

function min (array) {
  return Math.min(...array)
}

function max (array) {
  return Math.max(...array)
}

d3.json('data/test.json').then(data => {
  const sizes = [1, 2, 2, 3, 4, 6, 6]
  const dx = 600, dy = 400
  const res = squarify(sizes, 0, 0, dx, dy)
  console.log(res)
  // const root = treeify(data)
  // console.log(root)
  // const leaves = getLeaves(root)
  // console.log(leaves)
  //
  // const result = squarify(leaves, 0, 0, 500, 500)
  // console.log(result)

  let canvas = d3.select("body")
    .append("svg")
    .attr("width", dx)
    .attr("height", dx)

  let cells = canvas.selectAll("g")
    .data(res)
    .enter()
    .append("g")
    .attr("transform", d => { return "translate(" + d.x0 + "," + d.y0 + ")" })

  cells.append("rect")
    .attr("width", d => { return d.dx - 10 })
    .attr("height", d => { return d.dy - 10 })
})
