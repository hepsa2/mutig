const SIZE = 5

let selected = null

const state = {
  player: createBoard(),
  ai: createBoard()
}

function createBoard() {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => null)
  )
}

/* 初始化：随便放几个棋子 */
state.player[4][2] = { owner: 'player', type: 'attack' }
state.player[3][1] = { owner: 'player', type: 'attack' }

state.ai[0][2] = { owner: 'ai', type: 'unknown' }
state.ai[1][3] = { owner: 'ai', type: 'unknown' }

render()

function render() {
  renderBoard('player')
  renderBoard('ai')
}

function renderBoard(owner) {
  const boardEl = document.getElementById(owner + '-board')
  boardEl.innerHTML = ''

  state[owner].forEach((row, y) => {
    row.forEach((cell, x) => {
      const div = document.createElement('div')
      div.className = 'cell'

      if (selected && selected.x === x && selected.y === y && selected.owner === owner) {
        div.classList.add('selected')
      }

      if (cell) {
        const piece = document.createElement('div')
        piece.className = 'piece'
        piece.textContent = owner === 'player' ? '⚔️' : '❓'
        div.appendChild(piece)
      }

      div.onclick = () => onCellClick(owner, x, y)
      boardEl.appendChild(div)
    })
  })
}

function onCellClick(owner, x, y) {
  if (owner !== 'player') {
    // 攻击
    if (selected) {
      resolveAttack(selected, { owner, x, y })
      selected = null
      render()
    }
    return
  }

  const cell = state.player[y][x]

  if (cell) {
    selected = { owner, x, y }
  } else if (selected) {
    movePiece(selected, { owner, x, y })
    selected = null
  }

  render()
}

function movePiece(from, to) {
  const piece = state.player[from.y][from.x]
  state.player[from.y][from.x] = null
  state.player[to.y][to.x] = piece
}

function resolveAttack(from, to) {
  // 第 1 阶段：攻击即同归于尽
  state.player[from.y][from.x] = null
  state.ai[to.y][to.x] = null

  log('发生战斗，双方作废')
}

function log(text) {
  document.getElementById('log').textContent = text
}

