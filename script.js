/**
 * SUDOKU ENGINE & BACKTRACKING AI APPLICATION ARCHITECTURE
 */
class SudokuGame {
    constructor() {
        this.gridElement = document.getElementById('grid');
        this.cells = [];
        this.initialBoard = Array(9).fill().map(() => Array(9).fill(0));
        this.currentBoard = Array(9).fill().map(() => Array(9).fill(0));
        this.solutionBoard = Array(9).fill().map(() => Array(9).fill(0));
        
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.isAIPlaying = false;

        this.initDOM();
        this.setupEventListeners();
        this.startNewGame();
        this.loadLeaderboard();
    }

    // Initialize HTML inputs dynamically inside the 9x9 matrix grid
    initDOM() {
        this.gridElement.innerHTML = '';
        this.cells = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('input');
                cell.type = 'text';
                cell.maxLength = 1;
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                // Track typing input event
                cell.addEventListener('input', (e) => this.handleCellInput(e, r, c));
                this.gridElement.appendChild(cell);
                this.cells.push(cell);
            }
        }
    }

    setupEventListeners() {
        document.getElementById('btn-new').addEventListener('click', () => this.startNewGame());
        document.getElementById('btn-check').addEventListener('click', () => this.checkUserSolution());
        document.getElementById('btn-hint').addEventListener('click', () => this.giveHint());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetToInitial());
        document.getElementById('btn-solve').addEventListener('click', () => this.triggerAISolver());
        document.getElementById('btn-save').addEventListener('click', () => this.saveGame());
        document.getElementById('btn-load').addEventListener('click', () => this.loadGame());
        
        // Theme color toggler switch 
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    // --- PUZZLE GENERATION LAYER ---
    startNewGame() {
        if (this.isAIPlaying) return;
        clearInterval(this.timerInterval);
        
        const difficulty = document.getElementById('difficulty-select').value;
        document.getElementById('current-diff').innerText = difficulty.toUpperCase();
        
        this.generateFullSolution();
        this.createPuzzleByDifficulty(difficulty);
        
        this.moves = 0;
        document.getElementById('move-count').innerText = this.moves;
        this.startTime = new Date();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
        
        this.renderBoard();
    }

    // Generate a complete fully valid board layout via random seed blocks
    generateFullSolution() {
        this.solutionBoard = Array(9).fill().map(() => Array(9).fill(0));
        // Fill 3 independent diagonal 3x3 grids first to optimize randomness safely
        for (let i = 0; i < 9; i += 3) {
            this.fillBox(i, i);
        }
        this.solveBoardBasic(this.solutionBoard);
    }

    fillBox(row, col) {
        let num;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                do {
                    num = Math.floor(Math.random() * 9) + 1;
                } while (!this.isUnusedInBox(row, col, num));
                this.solutionBoard[row + i][col + j] = num;
            }
        }
    }

    isUnusedInBox(rowStart, colStart, num) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.solutionBoard[rowStart + i][colStart + j] === num) return false;
            }
        }
        return true;
    }

    // Core synchronous processing engine to finish generating solution boards
    solveBoardBasic(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValidPlacement(board, row, col, num)) {
                            board[row][col] = num;
                            if (this.solveBoardBasic(board)) return true;
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    isValidPlacement(board, row, col, num) {
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num || board[x][col] === num) return false;
        }
        let startRow = row - row % 3, startCol = col - col % 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i + startRow][j + startCol] === num) return false;
            }
        }
        return true;
    }

    // Clear cells based on selected difficulty constraints
    createPuzzleByDifficulty(difficulty) {
        let attempts = 0;
        switch(difficulty) {
            case 'easy': attempts = 30; break;
            case 'medium': attempts = 42; break;
            case 'hard': attempts = 54; break;
        }
        
        this.initialBoard = this.solutionBoard.map(row => [...row]);
        
        while (attempts > 0) {
            let cellIndex = Math.floor(Math.random() * 81);
            let r = Math.floor(cellIndex / 9);
            let c = cellIndex % 9;
            if (this.initialBoard[r][c] !== 0) {
                this.initialBoard[r][c] = 0;
                attempts--;
            }
        }
        this.currentBoard = this.initialBoard.map(row => [...row]);
    }

    // Mirror current array records to HTML layout nodes
    renderBoard() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = this.getCellElement(r, c);
                cell.className = 'cell';
                cell.value = this.currentBoard[r][c] === 0 ? '' : this.currentBoard[r][c];
                
                if (this.initialBoard[r][c] !== 0) {
                    cell.classList.add('initial');
                    cell.disabled = true;
                } else {
                    cell.disabled = false;
                }
            }
        }
    }

    // --- GAMEPLAY INTERACTIONS & USER ENTRY CONTROLS ---
    handleCellInput(e, r, c) {
        const val = e.target.value;
        if (/^[1-9]$/.test(val)) {
            this.currentBoard[r][c] = parseInt(val);
            this.moves++;
            document.getElementById('move-count').innerText = this.moves;
            
            // Immediate real-time feedback loop verification
            if(this.currentBoard[r][c] !== this.solutionBoard[r][c]) {
                e.target.classList.add('incorrect');
            } else {
                e.target.classList.remove('incorrect');
                this.checkGameCompletion();
            }
        } else {
            e.target.value = '';
            this.currentBoard[r][c] = 0;
            e.target.classList.remove('incorrect');
        }
    }

    resetToInitial() {
        if (this.isAIPlaying) return;
        this.currentBoard = this.initialBoard.map(row => [...row]);
        this.renderBoard();
    }

    giveHint() {
        if (this.isAIPlaying) return;
        let unassignedCells = [];
        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                if(this.currentBoard[r][c] === 0) unassignedCells.push({r, c});
            }
        }
        if(unassignedCells.length > 0) {
            let choice = unassignedCells[Math.floor(Math.random() * unassignedCells.length)];
            this.currentBoard[choice.r][choice.c] = this.solutionBoard[choice.r][choice.c];
            this.renderBoard();
            this.checkGameCompletion();
        }
    }

    checkUserSolution() {
        let accurate = true;
        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                const el = this.getCellElement(r, c);
                if(this.currentBoard[r][c] !== this.solutionBoard[r][c]) {
                    el.classList.add('incorrect');
                    accurate = false;
                }
            }
        }
        if(accurate) alert("Perfect game! Everything is correct!");
        else alert("There are tracking conflicts or validation errors inside your entries.");
    }

    checkGameCompletion() {
        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                if(this.currentBoard[r][c] !== this.solutionBoard[r][c]) return;
            }
        }
        clearInterval(this.timerInterval);
        alert(`🎉 Congratulations! You solved the puzzle in ${document.getElementById('timer').innerText}!`);
        this.saveLeaderboardRecord(document.getElementById('timer').innerText);
    }

    // --- ANIMATED RECURSIVE BACKTRACKING AI ENGINE ---
    async triggerAISolver() {
        if (this.isAIPlaying) return;
        this.isAIPlaying = true;
        this.disableAllInputs(true);
        
        // Reset dynamic board states back to structural foundation before running simulation
        this.currentBoard = this.initialBoard.map(row => [...row]);
        this.renderBoard();

        const visualize = document.getElementById('chk-visualize').checked;
        const solved = await this.solveWithBacktrackingAnimated(visualize);
        
        this.isAIPlaying = false;
        this.disableAllInputs(false);
        clearInterval(this.timerInterval);
        
        if (solved) {
            alert("The Backtracking AI algorithm successfully solved the matrix grid!");
        }
    }

    async solveWithBacktrackingAnimated(visualize) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.currentBoard[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValidPlacement(this.currentBoard, row, col, num)) {
                            
                            this.currentBoard[row][col] = num;
                            if (visualize) {
                                await this.updateVisualCell(row, col, num, 'ai-evaluating');
                            }

                            if (await this.solveWithBacktrackingAnimated(visualize)) {
                                if (visualize) {
                                    await this.updateVisualCell(row, col, num, 'ai-solved');
                                }
                                return true;
                            }

                            // Trigger structural backtrack step
                            this.currentBoard[row][col] = 0;
                            if (visualize) {
                                await this.updateVisualCell(row, col, '', 'ai-incorrect');
                            }
                        }
                    }
                    return false; // Triggers loop timeline backtrack
                }
            }
        }
        return true;
    }

    // Utilizes a Promise delay to slow the AI down to a human-visible speed
    updateVisualCell(row, col, value, cssClass) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const cell = this.getCellElement(row, col);
                cell.value = value;
                cell.className = `cell ${cssClass}`;
                resolve();
            }, 10); // Frame adjustment timing delay control latency (10ms steps)
        });
    }

    // --- PERSISTENT DISK STORAGE STATES ---
    saveGame() {
        const gameState = {
            initial: this.initialBoard,
            current: this.currentBoard,
            solution: this.solutionBoard,
            moves: this.moves,
            difficulty: document.getElementById('difficulty-select').value,
            elapsedSecs: Math.floor((new Date() - this.startTime) / 1000)
        };
        localStorage.setItem('sudoku_save_state', JSON.stringify(gameState));
        alert("Game snapshot saved to local storage.");
    }

    loadGame() {
        const raw = localStorage.getItem('sudoku_save_state');
        if (!raw) return alert("No snapshot found inside local storage.");
        
        const state = JSON.parse(raw);
        this.initialBoard = state.initial;
        this.currentBoard = state.current;
        this.solutionBoard = state.solution;
        this.moves = state.moves;
        
        document.getElementById('difficulty-select').value = state.difficulty;
        document.getElementById('current-diff').innerText = state.difficulty.toUpperCase();
        document.getElementById('move-count').innerText = this.moves;
        
        clearInterval(this.timerInterval);
        this.startTime = new Date(new Date().getTime() - (state.elapsedSecs * 1000));
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
        
        this.renderBoard();
    }

    // --- HIGH SCORE RECORD MANAGEMENT ---
    saveLeaderboardRecord(timeStr) {
        let records = JSON.parse(localStorage.getItem('sudoku_leaderboard') || '[]');
        records.push({ time: timeStr, date: new Date().toLocaleDateString() });
        records.sort((a,b) => a.time.localeCompare(b.time));
        records = records.slice(0, 5); // Keep top 5
        localStorage.setItem('sudoku_leaderboard', JSON.stringify(records));
        this.loadLeaderboard();
    }

    loadLeaderboard() {
        let records = JSON.parse(localStorage.getItem('sudoku_leaderboard') || '[]');
        const container = document.getElementById('leaderboard-list');
        if(records.length === 0) {
            container.innerHTML = "<li>No records yet!</li>";
            return;
        }
        container.innerHTML = records.map(r => `<li><strong>${r.time}</strong> - <small>${r.date}</small></li>`).join('');
    }

    updateTimer() {
        const diff = Math.floor((new Date() - this.startTime) / 1000);
        const mins = String(Math.floor(diff / 60)).padStart(2, '0');
        const secs = String(diff % 60).padStart(2, '0');
        document.getElementById('timer').innerText = `${mins}:${secs}`;
    }

    getCellElement(r, c) {
        return this.cells[r * 9 + c];
    }

    disableAllInputs(bool) {
        this.cells.forEach(cell => { if(!cell.classList.contains('initial')) cell.disabled = bool; });
    }
}

// Global runtime execution instantiator on DOM ready state
window.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});