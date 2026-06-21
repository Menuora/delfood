require('dotenv').config();
const express = require('express');
const path = require('path');
const api = require('./api/index');

const app = express();
const port = process.env.PORT || 3000;

app.use('/api', api);
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.use(express.static(__dirname));
app.listen(port, () => console.log('Delfood template running at http://localhost:' + port));
