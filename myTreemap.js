function TreeNode(data) {
    this.data = data
    this.depth = 0
    this.height = 0
    this.parent = null
}

function getChildrenFromData(d) {
    return d.children;
}

function getValueFromData(d) {
    return d.value
}

function getSumOfNodeValue(nodeList) {
    let n = nodeList.length
    let sum = 0
    for (let i = 0; i < n; i++) {
        sum += getValueFromData(nodeList[i])
    }
    return sum
}

function treeify(data) {
    let root = new TreeNode(data)
    let currNode, nodeQueue = [root]

    // BFS
    while ( currNode = nodeQueue.pop() ) {
        let childList = getChildrenFromData(currNode.data)
        if ( childList ) {
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
            currNode.value = getSumOfNodeValue(childList)
        }
    }

    return root
}

function getLeaves(root) {
    let leaves = []
    let currNode, nodeQueue = [root]
    while ( currNode = nodeQueue.pop() ) {
        if ( !currNode.children ) {
            leaves.push(currNode)
        } else {
            for (let i = 0; i < currNode.children.length; i++)
                nodeQueue.push(currNode.children[i])
        }
    }
    return leaves
}

/**
 * 计算treemap中各个矩形的左上角坐标和长宽
 * @param sizes TreeNode列表，要求列表中的节点是倒序且每个node.value的和等于dx * dy
 * @param x 原点坐标
 * @param y 原点坐标
 * @param dx treemap的长度
 * @param dy treemap的宽度
 * @return TreeNode列表
 */
function squarify(sizes, x, y, dx, dy) {
    let nodeList = JSON.parse(JSON.stringify(sizes)) // 深拷贝
    // 节点的value归一化
    let totalArea = dx * dy
    nodeList.forEach((node, i) => {
        node.value /= totalArea
    })
    // 逆序排序
    nodeList.sort((node1, node2) => {
        return node2.value - node1.value
    })


}

function worstRatio(nodeList, x, y, dx, dy) {
    let list = JSON.parse(JSON.stringify(nodeList)) // 深拷贝
    list = layout(list, x, y, dx, dy)
    let res = 0
    list.forEach((node, i) => {
        let temp = Math.max( node.dx / node.dy, node.dy / node.dx );
        res = Math.max(res, temp)
    })
    return res
}

/**
 * 对某一行或列进行布局
 * @param nodeList
 * @param x
 * @param y
 * @param dx
 * @param dy
 */
function layout(nodeList, x, y, dx, dy) {
    if (dx >= dy) return layoutRow(nodeList, x, y, dx, dy)
    else return layoutCol(nodeList, x, y, dx, dy)
}

/**
 * 按行布局
 */
function layoutRow(nodeList, x, y, dx, dy) {
    let coveredArea = getSumOfNodeValue(nodeList); // 矩形占据当前空间的面积
    let width = coveredArea / dy                   // 上下填满的情况下的宽度

    nodeList.forEach((node , i) => {
        node.x0 = x
        node.y0 = y + node.value / width
        node.dx = width
        node.dy = node.value / width
    })

    return nodeList
}

/**
 * 按列布局
 */
function layoutCol(nodeList, x, y, dx, dy) {
    let coveredArea = getSumOfNodeValue(nodeList); // 矩形占据当前空间的面积
    let height = coveredArea / dx                  // 左右填满的情况下的高度

    nodeList.forEach((node, i) => {
        node.x0 = x + node.value / height
        node.y0 = y
        node.dx = node.value / height
        node.dy = height
    })

    return nodeList
}

d3.json("data/test.json").then(data => {
    const root = treeify(data)
    console.log(root)
    const leaves = getLeaves(root)
    console.log(leaves)
})