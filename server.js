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

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle question broadcasting
    socket.on('start-question', (question, timer) => {
      console.log('Broadcasting question:', question, 'Timer:', timer);
      
      // Store current question state
      currentQuestion = question;
      currentTimer = timer;
      questionAnswers = {};
      
      // Clear any existing timer
      if (questionTimer) {
        clearTimeout(questionTimer);
      }
      
      // Broadcast question to all clients
      io.emit('broadcast-question', question, timer);
      
      // Set timer to end question automatically
      questionTimer = setTimeout(() => {
        endQuestionAndCalculateScores();
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
      io.emit('reveal-correct', correctAnswer);
    });

    // Handle ending question manually
    socket.on('end-question', () => {
      console.log('Question ended manually');
      endQuestionAndCalculateScores();
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Function to end question and calculate scores
  function endQuestionAndCalculateScores() {
    if (!currentQuestion) {
      console.log('No current question to end');
      return;
    }
    
    console.log('=== ENDING QUESTION AND CALCULATING SCORES ===');
    console.log('Current question:', currentQuestion);
    console.log('Question answers received:', questionAnswers);
    
    // Clear the timer
    if (questionTimer) {
      clearTimeout(questionTimer);
      questionTimer = null;
    }
    
    // Calculate scores for this round
    const roundWinners = [];
    
    Object.keys(questionAnswers).forEach(player => {
      const playerAnswer = questionAnswers[player];
      console.log(`Checking ${player}: answered "${playerAnswer.answer}" vs correct "${currentQuestion.answer}"`);
      
      if (playerAnswer.answer === currentQuestion.answer) {
        // Player got it right
        playerScores[player] = (playerScores[player] || 0) + 1;
        roundWinners.push(player);
        console.log(`✓ ${player} got it right! New score: ${playerScores[player]}`);
      } else {
        console.log(`✗ ${player} got it wrong`);
      }
    });
    
    console.log('=== FINAL RESULTS ===');
    console.log('Round winners:', roundWinners);
    console.log('Updated player scores:', playerScores);
    console.log('Emitting update-scores event...');
    
    // Emit score updates
    io.emit('update-scores', playerScores);
    
    // Emit round results
    if (roundWinners.length > 0) {
      console.log('Emitting round-results event...');
      io.emit('round-results', roundWinners);
    }
    
    // Reveal correct answer
    console.log('Emitting reveal-correct event...');
    io.emit('reveal-correct', currentQuestion.answer);
    
    // End the question after a delay
    setTimeout(() => {
      console.log('Emitting question-ended event...');
      io.emit('question-ended');
      currentQuestion = null;
      questionAnswers = {};
    }, 3000); // 3 second delay to show results
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
      
      const answerRecord = {
        ...answerData,
        timestamp: new Date().toISOString()
      };
      
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