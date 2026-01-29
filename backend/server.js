const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'trackers.json');

app.use(cors());
app.use(bodyParser.json());

// Helper to read data
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading file:", err);
        return [];
    }
};

// Helper to write data
const writeData = (data) => {
    try {
        // Ensure directory exists
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error("Error writing file:", err);
        return false;
    }
};

// GET Trackers
app.get('/api/trackers', (req, res) => {
    const trackers = readData();
    res.json(trackers);
});

// POST Trackers (Sync/Update All)
app.post('/api/trackers', (req, res) => {
    const trackers = req.body;
    if (!Array.isArray(trackers)) {
        return res.status(400).json({ error: "Expected an array of trackers" });
    }
    if (writeData(trackers)) {
        res.json({ success: true, count: trackers.length });
    } else {
        res.status(500).json({ error: "Failed to save data" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    // Initialize file if not exists
    if (!fs.existsSync(DATA_FILE)) {
        writeData([]);
    }
});
