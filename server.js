import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Store participants (in a real app, you might want to use a database)
let participants = [];

// API endpoints
app.get('/api/participants', (req, res) => {
  res.json(participants);
});

app.post('/api/participants', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  participants.push(name);
  res.json(participants);
});

app.delete('/api/participants', (req, res) => {
  participants = [];
  res.json({ message: 'All participants removed' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 