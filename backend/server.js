const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.static('public'));
app.use(cors());
app.use(express.json());

const userRoutes = require('./routes/user');

app.use('/api/users', userRoutes);


app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send('Our amazing food delivery app!');
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});