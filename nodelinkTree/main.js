const width = 860
const height = 400

const canvas = d3.select('body')
  .append('svg')
  .attr('width', 960)
  .attr('height', 960)

const diagonal = (p, n) => {
  return 'M' + n.y + ',' + n.x
    + 'C' + n.y + ',' + (n.x + p.x) / 2
    + ' ' + p.y + ',' + (n.x + p.x) / 2
    + ' ' + p.y + ',' + p.x
}

let dataRoot = {}

d3.json('../data/tree.json').then(data => {
  // 将数据转成一棵树
  dataRoot = treeify(data)
  update(dataRoot)
})

function update (root) {
  root = TreeLayout(root, 20, 120)
  let nodes = listify(root)
  console.log(nodes)

  let node = canvas.selectAll('g.node')
    .data(nodes)

  // ****************** 结点 ***************************
  let nodeExit = node.exit()
    .remove()

  let nodeEnter = node.enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => { return 'translate(' + (50 + d.y) + ',' + (450 + d.x) + ')' })
    .on('click', click)
  nodeEnter.append('circle')
    .attr('r', 10)
    .attr('fill', d => {
      return d._children? 'blue' : 'lightsteelblue'
    })
  nodeEnter.append('text')
    .attr('dy', '0.35em')
    .attr('dx', '0.5em')
    .attr('text-anchor', 'start')
    .text(d => {return d.data.name})

  let nodeUpdate = nodeEnter
    .merge(node)
    .attr('transform', function (event, i, arr) {
      const d = d3.select(this).datum()
      return 'translate(' + (50 + d.y) + ',' + (450 + d.x) + ')'
    })
  nodeUpdate.select('circle')
    .attr('r', 10)
    .style("fill", function(d) {
      return d._children? 'blue' : 'lightsteelblue'
    })
  nodeUpdate.select('text')
    .attr('dy', '0.35em')
    .attr('dx', '0.5em')
    .attr('text-anchor', 'start')
    .text(d => {return d.data.name})

  let link = canvas.selectAll('path.node')
    .data(nodes)

  let linkExit = link.exit()
    .remove()

  let linkEnter = link.enter()
    .append('path')
    .attr('class', 'node')
    .attr('transform', d => { return 'translate(' + 50 + ',' + 450 + ')' })
    .attr('d', d => {
      return d.parent ? diagonal(d.parent, d) : ''
    })
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .attr('stroke-width', '2px')

  let linkUpdate = linkEnter
    .merge(link)
    .attr('d', d => {
      return d.parent ? diagonal(d.parent, d) : ''
    })
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .attr('stroke-width', '2px')
    .attr('transform', d => { return 'translate(' + 50 + ',' + 450 + ')' })
}

function click (event, d) {
  if (!d._children) {
    if (d.children.length > 0) {
      d._children = d.children
      d.children = []
    }
  } else {
    d.children = d._children
    d._children = null
  }
  update(dataRoot)
}

const distance = 1

function TreeLayout (root, x, y, dx, dy) {
  // 初始化结点
  InitNodes(root)

  FirstWalk(root)
  // 根据mod值计算最终的x值
  SecondWalk(root, -root.prelim)
  // 根据大小对树进行放缩
  ScaleTree(root, x, y, dx, dy)

  return root
}

function InitNodes (root) {
  // BFS
  let currNode, nodeQueue = [root]
  while (currNode = nodeQueue.pop()) {
    currNode.ancestor = currNode
    currNode.prelim = 0
    currNode.mod = 0
    currNode.change = 0
    currNode.shift = 0
    currNode.thread = null

    let n = currNode.children.length
    for (let i = 0; i < n; i++) {
      let child = currNode.children[i]
      child.parent = currNode
      child.number = i
      nodeQueue.push(child)
    }
  }
}

function FirstWalk (v) {
  let w = GetPrevSibling(v)
  if (IsLeaf(v)) {
    if (w === null) v.prelim = 0
    else v.prelim = w.prelim + distance
  } else {
    let defaultAncestor = GetLeftmostChild(v)
    for (let i = 0; i < v.children.length; i++) {
      let w = v.children[i]
      FirstWalk(w)
      defaultAncestor = Apportion(w, defaultAncestor)
    }
    ExecuteShifts(v)
    let midpoint = (GetLeftmostChild(v).prelim + GetRightmostChild(v).prelim) / 2
    if (w !== null) {
      v.prelim = w.prelim + distance
      v.mod = v.prelim - midpoint
    } else {
      v.prelim = midpoint
    }
  }
}

function Apportion (v, defaultAncestor) {
  let w = GetPrevSibling(v)
  if (w !== null) {
    let vip = v, vop = v
    let vin = w, von = GetLeftmostSibling(vip)
    let sip = vip.mod, sop = vop.mod
    let sin = vin.mod, son = von.mod
    while (NextRight(vin) !== null && NextLeft(vip) !== null) {
      vin = NextRight(vin)
      vip = NextLeft(vip)
      von = NextLeft(von)
      vop = NextRight(vop)
      vop.ancestor = v
      let shift = (vin.prelim + sin) - (vip.prelim + sip) + distance
      if (shift > 0) {
        MoveSubtree(Ancestor(vin, v, defaultAncestor), v, shift)
        sip += shift
        sop += shift
      }
      sin += vin.mod
      sip += vip.mod
      son += von.mod
      sop += vop.mod
    }

    if (NextRight(vin) !== null && NextRight(vop) === null) {
      vop.thread = NextRight(vin)
      vop.mod += sin - sop
    }

    if (NextLeft(vip) !== null && NextLeft(von) === null) {
      von.thread = NextLeft(vip)
      von.mod += sip - son
      defaultAncestor = v
    }
  }
  return defaultAncestor
}

function NextLeft (v) {
  if (v.children.length > 0) return v.children[0]
  else return v.thread
}

function NextRight (v) {
  if (v.children.length > 0) return v.children[v.children.length - 1]
  else return v.thread
}

function MoveSubtree (wn, wp, shift) {
  let subtrees = wp.number - wn.number
  wp.change -= shift / subtrees
  wp.shift += shift
  wn.change += shift / subtrees
  wp.prelim += shift
  wp.mod += shift
}

function ExecuteShifts (v) {
  let shift = 0
  let change = 0
  // 是从右到左遍历子结点
  for (let i = v.children.length - 1; i >= 0; i--) {
    let w = v.children[i]
    w.prelim += shift
    w.mod += shift
    change += w.change
    shift += w.shift + change
  }
}

function Ancestor (vin, v, defaultAncestor) {
  if (IsSibling(v, vin.ancestor)) return vin.ancestor
  else return defaultAncestor
}

function SecondWalk (v, m) {
  v.x = v.prelim + m
  v.y = v.depth
  for (let i = 0; i < v.children.length; i++) {
    let w = v.children[i]
    SecondWalk(w, m + v.mod)
  }
}

function ScaleTree (root, dx, dy) {
  let nodes = listify(root)
  nodes.forEach((node) => {
    node.x *= dx
    node.y = node.depth * dy
  })
  // if (nodeSize) {
  //   nodes.forEach((node) => {
  //     node.x *= nodeSize[0];
  //     node.y = node.depth * nodeSize[1];
  //   })
  // } else {
  //   let leftmost = root, rightmost = root, bottommost = root
  //   nodes.forEach((node) => {
  //     if (node.x < leftmost.x) leftmost = node
  //     if (node.x > rightmost.x) rightmost = node
  //     if (node.depth > bottommost.depth) bottommost = node
  //   })
  //
  //   let tx = distance - leftmost.x // 给左边留出空间，让最左边的点的x为1
  //   let kx = dx / (rightmost.x - leftmost.x + 2 * distance) // 给两边留出空间
  //   let ky = dy / (bottommost.y - root.y + 2 * distance)
  //   nodes.forEach((node) => {
  //     node.x0 = (node.x + tx) * kx
  //     node.y0 = (node.y) * ky
  //   })
  // }
}

function TreeNode (data) {
  this.data = data
  this.depth = 0
  this.parent = null
  this.children = null

  this.ancestor = this
  this.prelim = 0
  this.mod = 0
  this.change = 0
  this.shift = 0
  this.thread = null
  this.number = -1
}

function treeify (data) {
  let root = new TreeNode(data)
  let currNode, nodeQueue = [root]

  // BFS
  while (currNode = nodeQueue.pop()) {
    let childList = (currNode.data.children)
    childList = (childList) ? Array.from(childList) : []
    let n = childList.length
    for (let i = 0; i < n; i++) {
      childList[i] = new TreeNode(childList[i])
      let currChild = childList[i]
      nodeQueue.push(currChild)
      currChild.parent = currNode
      currChild.depth = currNode.depth + 1
    }
    currNode.children = childList
  }

  return root
}

function listify (root) {
  let res = []
  let node, nodeQueue = [root]
  while (node = nodeQueue.pop()) {
    res.push(node)
    let n = node.children.length
    for (let i = 0; i < n; i++) {
      let child = node.children[i]
      nodeQueue.push(child)
    }
  }
  return res
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

function IsSibling (node, sibling) {
  return node.parent === sibling.parent
}

function GetPrevSibling (node) {
  if (node.parent === null || IsLeftMost(node)) return null
  else return node.parent.children[node.parent.children.indexOf(node) - 1]
}

function GetLeftmostSibling (node) {
  if (node.parent === null) return null
  else return node.parent.children[0]
}

function GetLeftmostChild (node) {
  if (node.children.length === 0) return null
  else return node.children[0]
}

function GetRightmostChild (node) {
  if (node.children.length === 0) return null
  else return node.children[node.children.length - 1]
}
