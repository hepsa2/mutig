const SUPABASE_URL = 'https://nttkpnecsiewambsmvty.supabase.co'
const SUPABASE_KEY = 'sb_publishable_4Vs5cy9n0VPN8y8ZFYi9Eg_3vWfmKk7'

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

const roomId = new URLSearchParams(location.search).get('room')
const playerId = localStorage.playerId || crypto.randomUUID()
localStorage.playerId = playerId

let roomData = null

// 订阅房间变化
supabase.channel('room-' + roomId)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'rps_rooms',
    filter: `id=eq.${roomId}`
  }, payload => {
    roomData = payload.new
    updateUI()
  })
  .subscribe()

async function joinRoom() {
  const { data } = await supabase
    .from('rps_rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (!data.player1) {
    await supabase.from('rps_rooms').update({ player1: playerId }).eq('id', roomId)
  } else if (!data.player2 && data.player1 !== playerId) {
    await supabase.from('rps_rooms').update({ player2: playerId, status: 'playing' }).eq('id', roomId)
  }

  roomData = data
  updateUI()
}

joinRoom()

async function play(choice) {
  if (!roomData) return

  if (roomData.player1 === playerId && !roomData.p1_choice) {
    await supabase.from('rps_rooms')
      .update({ p1_choice: choice })
      .eq('id', roomId)
  }

  if (roomData.player2 === playerId && !roomData.p2_choice) {
    await supabase.from('rps_rooms')
      .update({ p2_choice: choice })
      .eq('id', roomId)
  }

  await checkResult()
}

async function checkResult() {
  if (roomData.p1_choice && roomData.p2_choice && !roomData.result) {
    const r = judge(roomData.p1_choice, roomData.p2_choice)
    await supabase.from('rps_rooms')
      .update({ result: r, status: 'finished' })
      .eq('id', roomId)
  }
}

function judge(a, b) {
  if (a === b) return '平局'
  if (
    (a === 'rock' && b === 'scissors') ||
    (a === 'scissors' && b === 'paper') ||
    (a === 'paper' && b === 'rock')
  ) return '玩家1胜'
  return '玩家2胜'
}

function updateUI() {
  const status = document.getElementById('status')

  if (!roomData.player2) {
    status.innerText = '等待另一位玩家加入…'
    return
  }

  if (roomData.result) {
    status.innerText = `结果：${roomData.result}`
    return
  }

  status.innerText = '已出招，等待对手…'
}

