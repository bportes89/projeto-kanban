const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const pg = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Database Connection (Single File Strategy) ---
let sequelize;
let Board, Column, Card, Message, ChecklistItem;
let dbInitError = null;

try {
  const dbConfig = {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectModule: pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  };

  if (process.env.POSTGRES_URL) {
    console.log('Using POSTGRES_URL environment variable');
    console.log(`POSTGRES_URL type: ${typeof process.env.POSTGRES_URL}, length: ${process.env.POSTGRES_URL.length}`);
    
    try {
         console.log('Using POSTGRES_URL environment variable');
         // Clean connection string - remove quotes if they exist
         let connectionString = String(process.env.POSTGRES_URL).trim();
         if (connectionString.startsWith('"') && connectionString.endsWith('"')) {
             connectionString = connectionString.slice(1, -1);
         }
         
         // Special handling for psql command format (common mistake)
         // e.g., "psql 'postgres://...'"
         if (connectionString.startsWith("psql '")) {
             connectionString = connectionString.replace("psql '", "").replace("'", "");
         }
         
         const { protocol, ...cleanDbConfig } = dbConfig;
         
         // Try manual parsing with better error handling
         let url;
         try {
            url = new URL(connectionString);
         } catch (e) {
            // If URL parsing fails, maybe it's missing the protocol?
            if (!connectionString.includes('://')) {
                 console.log('URL missing protocol, adding postgres://');
                 url = new URL('postgres://' + connectionString);
            } else {
                 throw e;
            }
         }
         
         console.log('Parsed URL host:', url.hostname);
         
         sequelize = new Sequelize(url.pathname.substring(1), url.username, url.password, {
             host: url.hostname,
             port: url.port || 5432,
             dialect: 'postgres',
             dialectModule: pg,
             logging: false,
             pool: {
                max: 1, // Keep low for serverless
                min: 0,
                acquire: 120000, // Increase acquire timeout to 120s for cold starts and sync
                idle: 10000
            },
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                },
                keepAlive: true,
                connectionTimeoutMillis: 60000, // Increase connection timeout to 60s
                statement_timeout: 60000 // Ensure long queries/syncs don't fail prematurely
            }
         });
     } catch (err) {
         // Enhance error message with more details about what failed
         const errorDetails = err.original ? `Original Error: ${err.original.message}` : err.message;
         const debugInfo = `URL_Type=${typeof process.env.POSTGRES_URL}, URL_Len=${process.env.POSTGRES_URL ? process.env.POSTGRES_URL.length : 0}`;
         
         // Don't just set the error, log it comprehensively
         console.error('CRITICAL DATABASE INITIALIZATION ERROR:', err);
         
         dbInitError = new Error(`Failed to initialize Sequelize: ${errorDetails}. Debug: ${debugInfo}`);
         
         // DO NOT THROW here if we want the server to start and report the error via API
         // throwing here causes the serverless function to crash immediately
     }
 } else {
    // Fallback for local development or if env var is missing
    const env = process.env.NODE_ENV || 'development';
    console.log(`Using config.json for environment: ${env}`);
    
    try {
        const config = require('./config/config.json')[env];
        if (!config) {
            throw new Error(`Configuration for environment "${env}" not found in config.json`);
        }

        if (config.use_env_variable) {
            const envVarName = config.use_env_variable;
            const envVarValue = process.env[envVarName];
            
            if (!envVarValue) {
                // IMPORTANT: If env var is missing in production, DO NOT try to connect with null
                // Just throw error immediately
                throw new Error(`CRITICAL: Environment variable "${envVarName}" is missing! Cannot connect to database.`);
            }
            
            console.log(`Using env variable from config: ${envVarName}`);
            sequelize = new Sequelize(envVarValue, dbConfig);
        } else {
            console.log('Using direct credentials from config');
            sequelize = new Sequelize(config.database, config.username, config.password, {
                ...config,
                ...dbConfig
            });
        }
    } catch (configError) {
        console.error('Config loading error:', configError);
        throw configError;
    }
  }

  // --- Model Definitions ---
  Board = sequelize.define('Board', {
    title: DataTypes.STRING,
    description: DataTypes.TEXT
  });

  Column = sequelize.define('Column', {
    title: DataTypes.STRING,
    order: DataTypes.INTEGER,
    boardId: DataTypes.INTEGER
  });

  Card = sequelize.define('Card', {
    title: DataTypes.STRING,
    menteeName: DataTypes.STRING,
    menteeContext: DataTypes.TEXT,
    menteeGoal: DataTypes.TEXT,
    mentorPerception: DataTypes.TEXT,
    mentorResistance: DataTypes.TEXT,
    mentorAttention: DataTypes.TEXT,
    mentorEmotion: DataTypes.TEXT,
    phase: DataTypes.STRING,
    energyMentee: DataTypes.INTEGER,
    energyMentor: DataTypes.INTEGER,
    decisionsTaken: DataTypes.TEXT,
    decisionsOpen: DataTypes.TEXT,
    reflections: DataTypes.TEXT,
    columnId: DataTypes.INTEGER,
    type: { type: DataTypes.STRING, defaultValue: 'generic' }
  });

  Message = sequelize.define('Message', {
    content: DataTypes.TEXT,
    authorType: DataTypes.STRING,
    authorName: DataTypes.STRING,
    cardId: DataTypes.INTEGER
  });

  ChecklistItem = sequelize.define('ChecklistItem', {
    content: DataTypes.STRING,
    isCompleted: DataTypes.BOOLEAN,
    cardId: DataTypes.INTEGER
  });

  // --- Associations ---
  Board.hasMany(Column, { foreignKey: 'boardId', as: 'columns' });
  Column.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });
  
  Column.hasMany(Card, { foreignKey: 'columnId', as: 'cards' });
  Card.belongsTo(Column, { foreignKey: 'columnId', as: 'column' });
  
  Card.hasMany(Message, { foreignKey: 'cardId', as: 'messages' });
  Message.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });
  
  Card.hasMany(ChecklistItem, { foreignKey: 'cardId', as: 'checklist' });
  ChecklistItem.belongsTo(Card, { foreignKey: 'cardId', as: 'card' });

} catch (err) {
  console.error('Critical Database Initialization Error:', err);
  dbInitError = err;
}

// Middleware to check DB status
const checkDb = (req, res, next) => {
    if (dbInitError) {
        // Return JSON error that frontend can parse, not just a string
        return res.status(500).json({
            error: 'Database initialization failed',
            message: dbInitError.message,
            details: dbInitError.toString(),
            stack: process.env.NODE_ENV === 'development' ? dbInitError.stack : undefined
        });
    }
    if (!Board) {
        return res.status(500).json({
            error: 'Models not initialized',
            details: 'Database connection failed silently or is pending.'
        });
    }
    next();
};

// --- System Routes ---
app.get('/', (req, res) => {
    res.json({ 
        status: 'Backend running', 
        env: process.env.NODE_ENV,
        db_initialized: !!sequelize && !dbInitError,
        timestamp: new Date().toISOString() 
    });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/migrate', async (req, res) => {
  try {
    if (dbInitError) throw dbInitError;
    if (!sequelize) throw new Error('Database not initialized');
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

// Test connection immediately
if (sequelize) {
    sequelize.authenticate().then(() => {
      console.log('Database connection OK!');
      // Sync removed from startup to prevent timeouts. Use /api/migrate endpoint instead.
    }).catch(err => {
      console.error('Unable to connect to the database:', err);
      dbInitError = err;
    });
}

// --- Routes ---
app.get('/api/debug/env', (req, res) => {
    res.json({
        node_env: process.env.NODE_ENV,
        has_postgres_url: !!process.env.POSTGRES_URL,
        dialect: 'postgres',
        db_init_error: dbInitError ? dbInitError.message : null
    });
});

// Get all boards
app.get('/api/boards', checkDb, async (req, res) => {
  try {
    const boards = await Board.findAll();
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create board
app.post('/api/boards', checkDb, async (req, res) => {
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
app.post('/api/boards/:id/columns', checkDb, async (req, res) => {
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
