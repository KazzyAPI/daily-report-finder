import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  font-family: 'Poppins', sans-serif;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
`;

const Timer = styled.div`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${props => props.$timeRunningOut ? '#ef4444' : '#10b981'};
`;

const GameArea = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  height: 80vh;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  position: relative;
  overflow: hidden;
  margin: 20px 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.2);
`;

const Ball = styled(motion.div)`
  position: absolute;
  padding: 15px 25px;
  background: ${props => props.$color};
  border-radius: 25px;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  white-space: nowrap;
  z-index: 2;
  transform-origin: center center;
`;

const Obstacle = styled(motion.div)`
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  z-index: 1;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Input = styled.input`
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 25px;
  margin-right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  outline: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Button = styled(motion.button)`
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 25px;
  background: ${props => props.$secondary ? '#ef4444' : '#10b981'};
  color: white;
  cursor: pointer;
  margin: 0.5rem;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WinnerDisplay = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(16, 185, 129, 0.9);
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  z-index: 10;
  backdrop-filter: blur(10px);
`;

const colors = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#ef4444', // red
];

const getRandomPosition = () => ({
  x: Math.random() * 700 + 50, // Random x between 50 and 750
  y: 0, // Start at the top
  velocity: {
    x: (Math.random() - 0.5) * 4, // Initial horizontal velocity
    y: 0 // Initial vertical velocity
  },
  rotation: Math.random() * 360,
  rotationVelocity: (Math.random() - 0.5) * 10,
  startDelay: Math.random() * 2000, // Random delay between 0-2 seconds
  lastUpdate: performance.now()
});

const generateObstacles = () => {
  const obstacles = [];
  const gameHeight = window.innerHeight * 0.8;
  const numSections = 8;
  const sectionHeight = gameHeight / numSections;
  
  for (let i = 1; i < numSections; i++) {
    // Add horizontal platforms
    obstacles.push({
      x: Math.random() * 600 + 100,
      y: i * sectionHeight,
      width: Math.random() * 200 + 200,
      height: 15,
      angle: (Math.random() - 0.5) * 30 // Random angle between -15 and 15 degrees
    });
    
    // Add some vertical obstacles
    if (Math.random() > 0.5) {
      obstacles.push({
        x: Math.random() * 600 + 100,
        y: i * sectionHeight - sectionHeight/2,
        width: 15,
        height: 100,
        angle: 90 + (Math.random() - 0.5) * 30
      });
    }
  }
  
  return obstacles;
};

function App() {
  const [participants, setParticipants] = useState([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [winner, setWinner] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positions, setPositions] = useState({});
  const [timeLeft, setTimeLeft] = useState(30);
  const [obstacles] = useState(generateObstacles());
  const gameAreaRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updatePositions);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const updatePositions = () => {
    if (!isPlaying) return;

    const currentTime = performance.now();

    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      const gameHeight = gameAreaRef.current?.clientHeight || 800;
      const deltaTime = 1/60; // Fixed time step for consistent physics

      for (let participant of participants) {
        if (!newPositions[participant]) continue;

        // Check if it's time to start falling (based on random delay)
        if (currentTime < newPositions[participant].startDelay) {
          continue;
        }

        // Update velocity with gravity
        newPositions[participant].velocity.y += 9.8 * deltaTime; // Gravity acceleration

        // Update position based on velocity
        newPositions[participant].x += newPositions[participant].velocity.x;
        newPositions[participant].y += newPositions[participant].velocity.y;

        // Update rotation
        newPositions[participant].rotation += newPositions[participant].rotationVelocity;

        // Keep within horizontal bounds with bouncing
        if (newPositions[participant].x < 0) {
          newPositions[participant].x = 0;
          newPositions[participant].velocity.x *= -0.8; // Bounce with energy loss
        }
        if (newPositions[participant].x > 750) {
          newPositions[participant].x = 750;
          newPositions[participant].velocity.x *= -0.8;
        }

        // Check collisions with obstacles
        for (const obstacle of obstacles) {
          // Convert obstacle angle to radians
          const angleRad = (obstacle.angle || 0) * Math.PI / 180;
          
          // Calculate obstacle bounds considering rotation
          const obstacleLeft = obstacle.x;
          const obstacleRight = obstacle.x + obstacle.width;
          const obstacleTop = obstacle.y;
          const obstacleBottom = obstacle.y + obstacle.height;

          // Simple AABB collision check (can be improved for rotated obstacles)
          if (newPositions[participant].x >= obstacleLeft &&
              newPositions[participant].x <= obstacleRight &&
              newPositions[participant].y >= obstacleTop - 25 &&
              newPositions[participant].y <= obstacleBottom + 25) {
            
            // Determine if collision is more vertical or horizontal
            const fromTop = Math.abs(newPositions[participant].y - obstacleTop);
            const fromBottom = Math.abs(newPositions[participant].y - obstacleBottom);
            
            if (fromTop < 25 || fromBottom < 25) {
              // Vertical collision
              newPositions[participant].y = fromTop < fromBottom ? obstacleTop - 25 : obstacleBottom + 25;
              newPositions[participant].velocity.y *= -0.6; // Bounce with energy loss
              
              // Add some random horizontal velocity on bounce
              newPositions[participant].velocity.x += (Math.random() - 0.5) * 2;
            } else {
              // Horizontal collision
              newPositions[participant].velocity.x *= -0.8;
            }

            // Add some spin on collision
            newPositions[participant].rotationVelocity = (Math.random() - 0.5) * 20;
          }
        }

        // Check if reached bottom
        if (newPositions[participant].y >= gameHeight - 50) {
          newPositions[participant].y = gameHeight - 50;
          if (Math.abs(newPositions[participant].velocity.y) < 0.1) {
            setIsPlaying(false);
            setWinner(participant);
            return prevPositions; // Stop the game
          }
          newPositions[participant].velocity.y *= -0.5; // Bounce with more energy loss at bottom
        }

        // Apply air resistance
        newPositions[participant].velocity.x *= 0.99;
        newPositions[participant].velocity.y *= 0.99;
      }
      return newPositions;
    });

    animationFrameRef.current = requestAnimationFrame(updatePositions);
  };

  const startGame = () => {
    if (participants.length < 2) return;
    
    setWinner(null);
    setIsPlaying(true);
    setTimeLeft(30);
    
    // Initialize positions for all participants with proper physics properties
    const initialPositions = {};
    participants.forEach((participant, index) => {
      initialPositions[participant] = {
        x: (index + 1) * (700 / (participants.length + 1)) + 50,
        y: 0,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: 0
        },
        rotation: Math.random() * 360,
        rotationVelocity: (Math.random() - 0.5) * 10,
        startDelay: Math.random() * 2000,
        lastUpdate: performance.now()
      };
    });
    setPositions(initialPositions);
  };

  const addParticipant = (e) => {
    e.preventDefault();
    if (!newParticipant.trim()) return;
    
    setParticipants(prev => [...prev, newParticipant.trim()]);
    setNewParticipant('');
  };

  const resetGame = () => {
    setParticipants([]);
    setWinner(null);
    setIsPlaying(false);
    setPositions({});
    setTimeLeft(30);
  };

  return (
    <Container>
      <Title>Race to the Bottom!</Title>
      
      {!isPlaying && (
        <form onSubmit={addParticipant} style={{ margin: '1rem 0' }}>
          <Input
            type="text"
            value={newParticipant}
            onChange={(e) => setNewParticipant(e.target.value)}
            placeholder="Enter participant name"
            disabled={isPlaying}
          />
          <Button type="submit" disabled={isPlaying || !newParticipant.trim()}>
            Add Participant
          </Button>
        </form>
      )}

      {participants.length > 0 && (
        <div style={{ margin: '1rem 0' }}>
          <Button
            onClick={startGame}
            disabled={isPlaying || participants.length < 2}
          >
            Start Race!
          </Button>
          <Button
            $secondary
            onClick={resetGame}
            disabled={isPlaying}
          >
            Reset
          </Button>
        </div>
      )}

      {isPlaying && (
        <Timer $timeRunningOut={timeLeft <= 10}>
          Time Left: {timeLeft}s
        </Timer>
      )}

      <GameArea ref={gameAreaRef}>
        {obstacles.map((obstacle, index) => (
          <Obstacle
            key={index}
            style={{
              left: obstacle.x,
              top: obstacle.y,
              width: obstacle.width,
              height: obstacle.height,
              transform: `rotate(${obstacle.angle}deg)`
            }}
          />
        ))}
        
        {participants.map((participant, index) => (
          positions[participant] && (
            <Ball
              key={participant}
              $color={colors[index % colors.length]}
              style={{
                left: positions[participant].x,
                top: positions[participant].y,
                transform: `translate(-50%, -50%) rotate(${positions[participant].rotation || 0}deg)`
              }}
            >
              {participant}
            </Ball>
          )
        ))}
      </GameArea>

      <AnimatePresence>
        {winner && (
          <WinnerDisplay
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <h2>🎉 Winner! 🎉</h2>
            <p>{winner}</p>
          </WinnerDisplay>
        )}
      </AnimatePresence>
    </Container>
  );
}

export default App; 