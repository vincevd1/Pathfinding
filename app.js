var grid = []
var points = []
var walls = []

var mouseDown = false
var draggingPoint = false
var cancelled = false
var started = false
var currentTool = null

window.onload = function() {
    ResetCanvas()
}

function SetTool(e) {
    currentTool = e.target.getAttribute('type')
}

function DrawNodes(nodeElement, node) {
    switch(currentTool) {
        case 'pencil': 
            nodeElement.style.backgroundColor = 'black'
            node.walkable = false

            if(walls.indexOf(node) == -1) walls.push(node);
        break;

        case 'eraser': 
            nodeElement.style.backgroundColor = 'white'
            node.walkable = true

            if(points.indexOf(node) != -1) {
                points.splice(points.indexOf(node), 1)
            } else if(walls.indexOf(node) != -1) {
                walls.splice(walls.indexOf(node), 1)
            }
        break;

        case 'pointplacer': 
            if(points.length < 2) {
                nodeElement.style.backgroundColor = 'rgb(49, 154, 180)'
                node.walkable = true

                points.push(node)
            }
        break;

        default: 
            return;
    }
}

function ResetCanvas() {
    grid = []
    points = []
    walls = []
    cancelled = true
    started = false

    document.getElementsByTagName('body')[0].removeChild(document.getElementById('grid'))
    let gridElement = document.createElement('div')
    gridElement.setAttribute('id', 'grid')
    document.getElementsByTagName('body')[0].prepend(gridElement)

    for(let i = 1; i <= 33; i++) {
        grid.push(new Array(68))

        for(let nodes = 1; nodes <= 68; nodes++) {
            grid[i-1][nodes-1] = new Node(nodes, i)
        }
    }
}

function GetNeighbours(node) {
    let neighbours = []

    if (grid[node.coords.y] != undefined) neighbours.push(grid[node.coords.y][node.coords.x - 1]);
    if (grid[node.coords.y] != undefined) neighbours.push(grid[node.coords.y][node.coords.x + 1]);
    if (grid[node.coords.y + 1] != undefined) neighbours.push(grid[node.coords.y + 1][node.coords.x]);
    if (grid[node.coords.y - 1] != undefined) neighbours.push(grid[node.coords.y - 1][node.coords.x]);
    if (grid[node.coords.y - 1] != undefined) neighbours.push(grid[node.coords.y - 1][node.coords.x - 1]);
    if (grid[node.coords.y - 1] != undefined) neighbours.push(grid[node.coords.y - 1][node.coords.x + 1]);
    if (grid[node.coords.y + 1] != undefined) neighbours.push(grid[node.coords.y + 1][node.coords.x - 1]);
    if (grid[node.coords.y + 1] != undefined) neighbours.push(grid[node.coords.y + 1][node.coords.x + 1]);

    for(let i = 0; i < neighbours.length; i++) {
        if(neighbours[i] == undefined) {
            neighbours.splice(i, 1)
        }
    }

    return neighbours
}

function StartPathfinding(instant) {
    if (!started) {
        points.sort((a, b) => (a.coords.x > b.coords.x) ? 1 : ((b.coords.x > a.coords.x) ? -1 : 0))
        for (let i = 0; i < points.length; i++) {
            if (points[i + 1] != undefined) {
                FindPath(points[i], points[i + 1], instant);
            }
        }
    }
}

async function FindPath(startNode, endNode, instant) {
    cancelled = false
    started = true

    let openSet = []
    let closedSet = []

    openSet.push(startNode)

    while(openSet.length > 0 && !cancelled) {
        let currentNode = openSet[0]

        for(let i = 0; i < openSet.length; i++) {
            document.getElementById(currentNode.id).style.backgroundColor = 'rgb(140, 38, 38)'

            if(openSet[i].fCost < currentNode.fCost || openSet[i].fCost == currentNode.fCost && openSet[i].hCost < currentNode.hCost) {
                currentNode = openSet[i]
            }
        }

        openSet.splice(openSet.indexOf(currentNode), 1)
        closedSet.push(currentNode)

        if(currentNode == endNode) {
            ReturnPath(startNode, endNode, instant)
            return;
        }

        for(let i = 0; i < GetNeighbours(currentNode).length; i++) {
            let neighbour = GetNeighbours(currentNode)[i]

            if(!neighbour.walkable || closedSet.indexOf(neighbour) != -1) {
                continue;
            }

            let movementCostToNeighbour = currentNode.gCost + GetDistanceBetweenNodes(currentNode, neighbour)

            if(movementCostToNeighbour < neighbour.gCost || openSet.indexOf(neighbour) == -1) {
                neighbour.gCost = movementCostToNeighbour
                neighbour.hCost = GetDistanceBetweenNodes(neighbour, endNode)
                neighbour.parent = currentNode

                if(openSet.indexOf(neighbour) == -1) {
                    openSet.push(neighbour)
                }
            }
        }

        if(instant == null || instant == false)
        await new Promise(r => setTimeout(r, 10)); 
    }
}

function ReturnPath(startNode, endNode, instant) {
    let path = [];
    let currentNode = endNode;
    
    while(currentNode != startNode) {
        path.push(currentNode)
        currentNode = currentNode.parent
    }

    path.push(startNode)

    path.reverse()

    path.forEach((node, time) => {
        if(!instant) {
            setTimeout(() => {
                if(cancelled) {
                    return
                }

                document.getElementById(node.id).style.backgroundColor = 'rgb(49, 154, 180)'
            }, time * 50)
        } else {
            document.getElementById(node.id).style.backgroundColor = 'rgb(49, 154, 180)'
        }
    })

    started = false
}

function GetDistanceBetweenNodes(nodeA, nodeB) {
    let dstX = Math.abs(nodeA.coords.x - nodeB.coords.x)
    let dstY = Math.abs(nodeA.coords.y - nodeB.coords.y)

    if(dstX > dstY) 
        return 14*dstY + 10*(dstX - dstY)
    return 14*dstX + 10*(dstY - dstX)
}

function dragStart(e) {
    e.preventDefault()
}

class Node {
    constructor(x, y) {
        this._coords = {x: x - 1, y: y - 1}
        this._id = (y-1)*68 + x;
        this._walkable = true;
        this._parent;

        this._gCost = 0;
        this._hCost = 0;

        let node = document.createElement('div');
        node.setAttribute('id', this._id)
        node.setAttribute('ondragstart', 'dragStart(event)')
        node.className = 'node';

        node.addEventListener('mousemove', (e) => {
            if(mouseDown && points.indexOf(this) == -1) {
                if(!draggingPoint) {
                    DrawNodes(node, this)
                } else if(draggingPoint) {
                    if(this != draggingPoint && walls.indexOf(this) == -1) {
                        node.style.backgroundColor = 'rgb(49, 154, 180)'
                        document.getElementById(draggingPoint.id).style.backgroundColor = 'white'
                        points.splice(points.indexOf(draggingPoint), 1)
                        draggingPoint = this
                        points.push(this)

                        for(let i = 0; i < grid.length; i++) {
                            for(let it = 0; it < grid[i].length; it++) {
                                if(walls.indexOf(grid[i][it]) == -1) {
                                    document.getElementById(grid[i][it].id).style.backgroundColor = 'white'
                                }
                            }
                        }
                
                        
                        StartPathfinding(true)
                    }
                }
            }
        })

        node.addEventListener('mousedown', () => {
            if(points.indexOf(this) == -1) {
                DrawNodes(node, this)
            } else {
                draggingPoint = this 
            }

            mouseDown = true
        })

        document.getElementById('grid').appendChild(node);
    }

    get id() {
        return this._id
    }

    get coords() {
        return this._coords;
    }

    get walkable() {
        return this._walkable
    }

    get gCost() {
        return this._gCost
    }

    set gCost(v) {
        this._gCost = v
    }

    get hCost() {
        return this._hCost
    }

    set hCost(v) {
        this._hCost = v
    }

    get fCost() {
        return this._gCost + this._hCost
    }

    get parent() {
        return this._parent
    }

    set parent(v) {
        this._parent = v
    }

    get walkable() {
        return this._walkable
    }

    set walkable(v) {
        this._walkable = v
    }
}

window.addEventListener('mouseup', () => {
    // if(draggingPoint && started) {
    //     for(let i = 0; i < grid.length; i++) {
    //         for(let it = 0; it < grid[i].length; it++) {
    //             if(walls.indexOf(grid[i][it]) == -1) {
    //                 document.getElementById(grid[i][it].id).style.backgroundColor = 'white'
    //             }
    //         }
    //     }

    //     StartPathfinding(true)
    // }

    mouseDown = false
    draggingPoint = false
})

