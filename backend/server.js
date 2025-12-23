const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.static('public'));
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin')
const customerRoutes = require('./routes/customer')
const restaurantOwnerRoutes = require('./routes/restaurantOwner');
const check_auth = require('./check_auth');

app.use('/auth', authRoutes);
app.use('/admin', check_auth, adminRoutes);
app.use('/customer', check_auth, customerRoutes);
app.use('/owner', check_auth, restaurantOwnerRoutes);


app.get("/", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send('Our amazing food delivery app!');
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});