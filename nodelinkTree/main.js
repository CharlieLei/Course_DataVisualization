let width = 600
let height = 400

let canvas = d3.select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height)

let treemap = d3.treemap()
  .tile(d3.treemapResquarify)
  .size([width, height])
  .round(true)
  .paddingInner(10)

d3.json('../data/tree.json').then(data => {
  var tree = d3.tree()
    .size([height, width - 160]);
  var nodes = tree.nodes(data),
    links = tree.links(nodes);
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

const distance = 1

function TreeLayout (root) {
  // 初始化结点的 x，y 和 mod 值
  let currNode, nodeQueue = [root]
  while (currNode = nodeQueue.pop()) {
    currNode.mod = 0
    currNode.thread = null
    currNode.ancestor = currNode
    currNode.shift = 0
    currNode.change = 0

    let n = currNode.children.length
    for (let i = 0; i < n; i++) {
      nodeQueue.push(currNode.children[i])
    }
  }

  FirstWalk(root)
  // 根据mod值计算最终的x值
  SecondWalk(root, -root.prelim)
  return root
}

function FirstWalk (node) {
  if (IsLeaf(node)) {
    node.prelim = 0
  } else {
    let defaultAncestor = GetLeftmostChild(node)
    node.children.forEach((w, i) => {
      FirstWalk(w)
      Approtion(w, defaultAncestor)
    })
    ExecuteShifts(node)
    let midpoint = (GetLeftmostChild(node).prelim + GetRightmostChild(node).prelim) / 2
    let prevSibling = GetPrevSibling(node)
    if (prevSibling !== null) {
      node.prelim = prevSibling.prelim + distance
      node.mod = node.prelim - midpoint
    } else {
      node.prelim = midpoint
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
        sip = sip + shift
        sop = sop + shift
      }
      sin = sin + vin.mod
      sip = sip + vip.mod
      son = son + von.mod
      sop = sop + vop.mod
    }

    if (NextRight(vin) !== null && NextRight(vop) === null) {
      vop.thread = NextRight(vin)
      vop.mod = vop.mod + sin - sop
    }

    if (NextLeft(vip) !== null && NextLeft(von) === null) {
      von.thread = NextLeft(vip)
      von.mod = von.mod + sip - son
      defaultAncestor = v
    }
  }
}

function NextLeft (node) {
  if (node.children.length > 0) return node.children[0]
  else return node.thread
}

function NextRight (node) {
  if (node.children.length > 0) return node.children[node.children.length - 1]
  else return node.thread
}

function MoveSubtree (wNeg, wPlus, shift) {
  let subtrees = wPlus.number - wNeg.number
  wPlus.change = wPlus.change - shift / subtrees
  wPlus.shift = wPlus.shift + shift
  wNeg.change = wNeg.change + shift / subtrees
  wPlus.prelim = wPlus.prelim + shift
  wPlus.mod = wPlus.mod + shift
}

function ExecuteShifts (node) {
  let shift = 0
  let change = 0
  for (let i = 0; i < node.children.length; i++) {
    let w = node.children[i]
    w.prelim = w.prelim + shift
    w.mod = w.mod + shift
    change = change + w.change
    shift = shift + w.shift + change
  }
}

function Ancestor (vin, v, defaultAncestor) {
  if (IsSibling(v, vin.ancestor)) return vin.ancestor
  else return defaultAncestor
}

function SecondWalk (v, m) {
  v.x = v.prelim + m
  v.y = v.depth
  v.children.forEach((w, i) => {
    SecondWalk(w, m + v.mod)
  })
}

function CalcFinalPositions (node, modSum) {
  node.x += modSum // modSum不包含当前节点的mod值
  modSum += node.mod

}

function TreeNode (data) {
  this.data = data
  this.depth = 0
  this.parent = null
  this.children = null
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
  if (node.parent === null) return false
  else {
    let i = node.parent.children.indexOf(sibling)
    return i !== -1
  }
}

function GetPrevSibling (node) {
  if (node.parent === null || IsLeftMost(node)) return null
  else return node.parent.children[node.parent.children.indexOf(node) - 1]
}

function GetNextSibling (node) {
  if (node.parent === null || IsRightMost(node)) return null
  else return node.parent.children[node.parent.children.indexOf(node) + 1]
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
