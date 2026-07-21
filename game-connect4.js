// game-connect4.js - Logika Game Connect 4 (Realtime Firebase)
import { doc, getDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const ROWS = 6;
const COLS = 7;
let activeMatchRef = null;
let currentSymbol = '🔴'; // 🔴 untuk Player 1, 🟡 untuk Player 2

export function initConnect4(db, matchId, symbol) {
  currentSymbol = symbol; // '🔴' or '🟡'
  activeMatchRef = doc(db, "matches", matchId);

  const modal = document.getElementById('c4-arena-modal');
  modal.classList.remove('hidden');

  renderBoardGrid();

  onSnapshot(activeMatchRef, (docSnap) => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();

    // Update UI Board
    const cells = document.querySelectorAll('.c4-cell');
    data.board.forEach((val, i) => {
      cells[i].innerText = val || '';
      cells[i].className = 'c4-cell' + (val === '🔴' ? ' red' : val === '🟡' ? ' yellow' : '');
    });

    const statusEl = document.getElementById('c4-game-status');
    if (data.winner) {
      if (data.winner === 'SERI') {
        statusEl.innerText = '🤝 Permainan Seri!';
      } else {
        statusEl.innerText = `🎉 Pemenang: ${data.winner === currentSymbol ? 'Kamu Win!' : 'Lawan Win!'}`;
      }
    } else {
      statusEl.innerText = data.turn === currentSymbol ? '⚡ Giliran Kamu!' : '⏳ Menunggu Giliran Lawan...';
    }
  });
}

function renderBoardGrid() {
  const boardEl = document.getElementById('c4-board');
  boardEl.innerHTML = '';
  
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      const cell = document.createElement('div');
      cell.className = 'c4-cell';
      cell.onclick = () => dropDisc(c);
      boardEl.appendChild(cell);
    }
  }
}

async function dropDisc(colIndex) {
  const matchSnap = await getDoc(activeMatchRef);
  if (!matchSnap.exists()) return;
  const data = matchSnap.data();

  if (data.winner || data.turn !== currentSymbol) return;

  const board = [...data.board];
  
  // Cari baris terendah yang masih kosong di kolom tersebut
  let targetRow = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r * COLS + colIndex]) {
      targetRow = r;
      break;
    }
  }

  if (targetRow === -1) {
    if (window.showToast) window.showToast('Kolom ini sudah penuh!', 'error');
    return;
  }

  const targetIdx = targetRow * COLS + colIndex;
  board[targetIdx] = currentSymbol;

  let winner = checkConnect4Winner(board);
  let nextTurn = currentSymbol === '🔴' ? '🟡' : '🔴';

  await updateDoc(activeMatchRef, {
    board: board,
    turn: nextTurn,
    winner: winner
  });
}

function checkConnect4Winner(b) {
  // Horizontal Check
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      let i = r * COLS + c;
      if (b[i] && b[i] === b[i+1] && b[i] === b[i+2] && b[i] === b[i+3]) return b[i];
    }
  }

  // Vertical Check
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      let i = r * COLS + c;
      if (b[i] && b[i + COLS] === b[i] && b[i + COLS*2] === b[i] && b[i + COLS*3] === b[i]) return b[i];
    }
  }

  // Diagonal Down-Right
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      let i = r * COLS + c;
      if (b[i] && b[i + COLS + 1] === b[i] && b[i + (COLS + 1)*2] === b[i] && b[i + (COLS + 1)*3] === b[i]) return b[i];
    }
  }

  // Diagonal Up-Right
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      let i = r * COLS + c;
      if (b[i] && b[i - COLS + 1] === b[i] && b[i - (COLS - 1)*2] === b[i] && b[i - (COLS - 1)*3] === b[i]) return b[i];
    }
  }

  if (b.every(c => c !== null)) return 'SERI';
  return null;
}