const express = require('express');
const cors = require('cors');
const { Board, Column, Card, Message, ChecklistItem } = require('./models');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- System Routes ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const { sequelize } = require('./models');
app.get('/api/migrate', async (req, res) => {
  try {
    await sequelize.authenticate();
    console.log('Database connection OK!');
    await sequelize.sync({ alter: true });
    res.json({ status: 'Database synced successfully!' });
  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ 
        error: 'Migration failed',
        details: error.message,
        stack: error.stack 
    });
  }
});

// Test connection immediately to catch errors early
const { sequelize } = require('./models');
sequelize.authenticate().then(() => {
  console.log('Database connection OK!');
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});

// --- Routes ---
app.get('/api/debug/env', (req, res) => {
    res.json({
        node_env: process.env.NODE_ENV,
        has_postgres_url: !!process.env.POSTGRES_URL,
        dialect: require('./config/config.json').production?.dialect,
        use_env: require('./config/config.json').production?.use_env_variable
    });
});

// Get all boards
app.get('/api/boards', async (req, res) => {
  try {
    const boards = await Board.findAll();
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create board
app.post('/api/boards', async (req, res) => {
  try {
    const { title, description } = req.body;
    const board = await Board.create({ title, description });
    
    // Create default columns
    const defaultColumns = ['To Do', 'In Progress', 'Done'];
    for (let i = 0; i < defaultColumns.length; i++) {
      await Column.create({
        title: defaultColumns[i],
        order: i,
        boardId: board.id
      });
    }

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Column
app.post('/api/boards/:id/columns', async (req, res) => {
  try {
    const { title, order } = req.body;
    const column = await Column.create({
      title,
      order: order || 0,
      boardId: req.params.id
    });
    res.status(201).json(column);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Column
app.put('/api/columns/:id', async (req, res) => {
  try {
    const column = await Column.findByPk(req.params.id);
    if (!column) return res.status(404).json({ error: 'Column not found' });
    await column.update(req.body);
    res.json(column);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get board details
app.get('/api/boards/:id', async (req, res) => {
  try {
    const board = await Board.findByPk(req.params.id, {
      include: {
        model: Column,
        as: 'columns',
        include: {
          model: Card,
          as: 'cards',
          include: [
            { model: Message, as: 'messages' },
            { model: ChecklistItem, as: 'checklist' }
          ]
        }
      },
      order: [
        ['columns', 'order', 'ASC'],
        ['columns', 'cards', 'createdAt', 'ASC'],
        ['columns', 'cards', 'messages', 'createdAt', 'ASC'],
        ['columns', 'cards', 'checklist', 'createdAt', 'ASC']
      ]
    });
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Card
app.post('/api/cards', async (req, res) => {
  try {
    const card = await Card.create(req.body);
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Card
app.put('/api/cards/:id', async (req, res) => {
  try {
    const card = await Card.findByPk(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    await card.update(req.body);
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Messages Routes ---
app.post('/api/cards/:id/messages', async (req, res) => {
  try {
    const { content, authorType, authorName } = req.body;
    const message = await Message.create({
      content,
      authorType,
      authorName,
      cardId: req.params.id
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Checklist Routes ---
app.post('/api/cards/:id/checklist', async (req, res) => {
  try {
    const { content } = req.body;
    const item = await ChecklistItem.create({
      content,
      isCompleted: false,
      cardId: req.params.id
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/checklist/:id', async (req, res) => {
  try {
    const item = await ChecklistItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    
    // Toggle completion status if not provided, or update content
    if (req.body.isCompleted !== undefined) {
      await item.update({ isCompleted: req.body.isCompleted });
    } else if (req.body.content) {
      await item.update({ content: req.body.content });
    }
    
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/checklist/:id', async (req, res) => {
  try {
    const item = await ChecklistItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Analysis Proxy
app.post('/api/ai/analyze', async (req, res) => {
  try {
    // Forward to Python AI Service
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const aiResponse = await axios.post(`${aiServiceUrl}/analyze`, req.body);
    res.json(aiResponse.data);
  } catch (error) {
    console.error("AI Service Error:", error.message);
    res.status(500).json({ error: 'AI Service unavailable' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
