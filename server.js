const express = require('express');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {ILike} = require('typeorm');
const UserSchema = require('./entities/user');
const AppDataSource = require('./db');
const NoteSchema = require('./entities/note');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
app.use(express.json());

AppDataSource.initialize()
    .then(() => {
        console.log('Data Source has been initialized!');
    })
    .catch((error) => {
        console.error('Error during Data Source initialization:', error);
    });

    //1-Register 
 app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const userRepository = AppDataSource.getRepository(UserSchema);

    try {
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = userRepository.create({ username, email, password: hashedPassword });
        await userRepository.save(newUser);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    
    }
});
//2-login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userRepository = AppDataSource.getRepository(UserSchema);
    try {
        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//3-get current user (protected)
app.get('/auth/me', authMiddleware, async (req, res) => {
    const userRepository = AppDataSource.getRepository(UserSchema);
    try {
            const user = await userRepository.findOne({ where: { id: req.userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ id: user.id, username: user.username, email: user.email });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//4-create note (protected)
 app.post('/notes', authMiddleware, async (req, res) => {
    const { title, content } = req.body;
    const noteRepository = AppDataSource.getRepository(NoteSchema);
    const userRepository = AppDataSource.getRepository(UserSchema);
    try {
        const user = await userRepository.findOne({ where: { id: req.userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const newNote = noteRepository.create({ title, content, user });
        await noteRepository.save(newNote);
        res.status(201).json({ message: 'Note created successfully', note: newNote });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//5-get all notes (protected)
app.get('/notes', authMiddleware, async (req, res) => {
    const noteRepository = AppDataSource.getRepository(NoteSchema); 
    try {
        const notes = await noteRepository.find({ where: { user: { id: req.userId } },order: { id: 'DESC' } });
        return res.status(200).json({message: 'Notes retrieved successfully', data: notes });

    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//6-search notes by title (protected)
app.get('/notes/search', authMiddleware, async (req, res) => {
    try {
        const {title} = req.query;

        if(typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ message: 'Invalid title parameter' });
        }

        const noteRepository = AppDataSource.getRepository(NoteSchema);
        const notes = await noteRepository.find({
            where: {user: { id: req.userId }, title: ILike(`%${title}%`)},
            order: { id: 'DESC' }
        });
        return res.status(200).json({ message: 'Notes retrieved successfully', data: notes });
    } catch (error) {
        console.error('Error searching notes:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//7-update note (put) (protected)
app.put('/notes/:id', authMiddleware, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { title, content } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'Invalid note ID' });
        }

        if(typeof title !== 'string' || title.trim() === '' || typeof content !== 'string' || content.trim() === '') {
            return res.status(400).json({ message: 'Title and content are required' });
        }
        const noteRepository = AppDataSource.getRepository(NoteSchema);
        const note = await noteRepository.findOne({ where: { id, user: { id: req.userId } } });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        note.title = title;
        note.content = content;

         const updatedNote = await noteRepository.save(note);
        res.status(200).json({ message: 'Note updated successfully', note: updatedNote });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//8-delete note (protected)
app.delete('/notes/:id', authMiddleware, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'Invalid note ID' });
        }

        const noteRepository = AppDataSource.getRepository(NoteSchema);
        const note = await noteRepository.findOne({ where: { id, user: { id: req.userId } } });

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        await noteRepository.remove(note);
        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

   

 
