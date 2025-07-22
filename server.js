const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Game state
  let currentQuestion = null;
  let currentTimer = 0;
  let playerScores = {};
  let questionAnswers = {};
  let questionTimer = null;
  let readyPlayers = new Set();
  let connectedPlayers = new Set();
  let scoresCalculated = false;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    connectedPlayers.add(socket.id);

    // Handle showing question without starting timer
    socket.on('show-question', (question) => {
      console.log('Showing question without starting timer:', question);
      
      // Store current question state
      currentQuestion = question;
      questionAnswers = {};
      readyPlayers.clear(); // Reset ready players for new question
      scoresCalculated = false;
      
      // Clear any existing timer
      if (questionTimer) {
        clearTimeout(questionTimer);
        questionTimer = null;
      }
      
      // Broadcast question to all clients with 0 timer to indicate no timer
      io.emit('broadcast-question', question, 0);
    });

    // Handle question broadcasting with timer
    socket.on('start-question', (question, timer) => {
      console.log('Broadcasting question:', question, 'Timer:', timer);
      
      // Store current question state
      currentQuestion = question;
      currentTimer = timer;
      questionAnswers = {};
      readyPlayers.clear(); // Reset ready players for new question
      scoresCalculated = false;
      
      // Clear any existing timer
      if (questionTimer) {
        clearTimeout(questionTimer);
      }
      
      // Broadcast question to all clients
      io.emit('broadcast-question', question, timer);
      
      // Set timer to emit timer-ended event (not to end question automatically)
      questionTimer = setTimeout(() => {
        console.log('Timer ended, emitting timer-ended event');
        io.emit('timer-ended');
      }, timer * 1000);
    });

    // Handle answer submission
    socket.on('submit-answer', (data) => {
      console.log('Answer submitted:', data);
      
      if (!currentQuestion) {
        console.log('No active question for answer submission');
        return;
      }
      
      // Store the answer
      questionAnswers[data.player] = {
        answer: data.answer,
        timestamp: Date.now()
      };
      
      // Check if answer is correct
      const isCorrect = data.answer === currentQuestion.answer;
      
      // Save answer to file system
      saveAnswerToFile({
        questionId: data.questionId,
        player: data.player,
        answer: data.answer,
        correct: isCorrect
      });
      
      // Broadcast that answer was submitted (for real-time feedback)
      io.emit('answer-submitted', {
        ...data,
        correct: isCorrect
      });
      
      console.log(`${data.player} answered "${data.answer}" - ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
    });

    // Handle revealing correct answer
    socket.on('reveal-answer', (correctAnswer) => {
      console.log('Revealing correct answer:', correctAnswer);
      calculateAndEmitScores();
      io.emit('reveal-correct', correctAnswer);
    });

    // Handle ending question manually
    socket.on('end-question', () => {
      console.log('Question ended manually');
      endQuestionAndCalculateScores();
    });

    // Handle player ready
    socket.on('player-ready', (playerName) => {
      console.log(`Player ${playerName} is ready (socket: ${socket.id})`);
      readyPlayers.add(socket.id);
      
      console.log(`Ready players: ${readyPlayers.size}, Connected players: ${connectedPlayers.size}`);
      
      // Check if all connected players are ready
      if (readyPlayers.size >= connectedPlayers.size && connectedPlayers.size > 0) {
        console.log('All players are ready, emitting all-players-ready and question-ended events');
        io.emit('all-players-ready');
        
        // End the question when all players are ready
        setTimeout(() => {
          console.log('Emitting question-ended event after all players ready');
          io.emit('question-ended');
        }, 1000); // 1 second delay to allow UI updates
        
        readyPlayers.clear(); // Reset for next question
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      connectedPlayers.delete(socket.id);
      readyPlayers.delete(socket.id);
    });
  });

  function calculateAndEmitScores() {
    if (!currentQuestion || scoresCalculated) {
      return;
    }

    console.log('=== CALCULATING SCORES ===');
    const roundWinners = [];
    
    // Get points based on difficulty
    const pointsValue = currentQuestion.points || 10; // Default to 10 if not specified
    
    Object.keys(questionAnswers).forEach(player => {
      const playerAnswer = questionAnswers[player];
      if (playerAnswer.answer === currentQuestion.answer) {
        // Use points value instead of fixed 1 point
        playerScores[player] = (playerScores[player] || 0) + pointsValue;
        roundWinners.push(player);
      }
    });

    console.log('Updated player scores with points value:', pointsValue, playerScores);
    io.emit('update-scores', playerScores);

    if (roundWinners.length > 0) {
      io.emit('round-results', roundWinners);
    }
    scoresCalculated = true;
  }

  // Function to end question and calculate scores
  function endQuestionAndCalculateScores() {
    if (!currentQuestion) {
      console.log('No current question to end');
      return;
    }
    
    console.log('=== ENDING QUESTION ===');
    
    calculateAndEmitScores();

    // Clear the timer
    if (questionTimer) {
      clearTimeout(questionTimer);
      questionTimer = null;
    }
    
    // Reveal correct answer
    io.emit('reveal-correct', currentQuestion.answer);
    
    // Reset current question state but don't emit question-ended yet
    currentQuestion = null;
    questionAnswers = {};
  }

  // Function to save answer to file
  function saveAnswerToFile(answerData) {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const answersFile = path.join(process.cwd(), 'data', 'answers.txt');
      const dataDir = path.join(process.cwd(), 'data');
      
      // Ensure data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Get points based on difficulty
      const pointsValue = currentQuestion && currentQuestion.points ? currentQuestion.points : 10;
      
      const answerRecord = {
        ...answerData,
        points: answerData.correct ? pointsValue : 0,
        difficulty: currentQuestion ? (currentQuestion.difficulty || 'medium') : 'medium',
        timestamp: new Date().toISOString()
      };
      
      console.log('Saving answer record with points:', answerRecord);
      fs.appendFileSync(answersFile, JSON.stringify(answerRecord) + '\n');
    } catch (error) {
      console.error('Error saving answer to file:', error);
    }
  }

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> Socket.io server initialized');
    });
});