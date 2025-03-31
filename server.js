const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const dataFolderPath = path.join(__dirname, 'DATA');

// Create the DATA folder if it doesn't exist
if (!fs.existsSync(dataFolderPath)) {
    fs.mkdirSync(dataFolderPath);
}

// Route to list available JSON files in the DATA folder
app.get('/list-files', (req, res) => {
    fs.readdir(dataFolderPath, (err, files) => {
        if (err) {
            console.error('Error reading DATA folder:', err);
            return res.status(500).send({ error: 'Could not read saved trees.' });
        }
        const jsonFiles = files.filter(file => path.extname(file) === '.json');
        res.json(jsonFiles);
    });
});

// Route to load a specific JSON file from the DATA folder
app.get('/load', (req, res) => {
    const filename = req.query.filename;
    if (!filename) {
        return res.status(400).send({ error: 'Filename is required.' });
    }
    const filePath = path.join(dataFolderPath, filename);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(404).send({ error: 'File not found.' });
        }
        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).send({ error: 'Error parsing JSON data.' });
        }
    });
});

// Route to save JSON data to a file in the DATA folder using the main relative's name
app.post('/save', (req, res) => {
    const { filename: requestedFilename, data } = req.body;
    if (!data || !data.name) {
        return res.status(400).send({ error: 'Family data with a main relative name is required.' });
    }

    // Sanitize the main relative's name to create a safe filename
    const baseFilename = data.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFilename = `${baseFilename}.json`;
    const filePath = path.join(dataFolderPath, finalFilename);

    fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
        if (err) {
            console.error('Error saving file:', err);
            return res.status(500).send({ error: 'Could not save family tree.' });
        }
        res.json({ success: true, filename: finalFilename });
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
