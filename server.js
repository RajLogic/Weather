require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

// API endpoint to get weather data by coordinates
app.get('/api/weather', async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    if (!process.env.OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: 'API key not configured. Please add OPENWEATHER_API_KEY to .env file' });
    }

    try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                lat,
                lon,
                units: 'metric',
                appid: process.env.OPENWEATHER_API_KEY
            }
        });

        res.json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({
                error: error.response.data.message || 'Weather service error'
            });
        } else {
            res.status(500).json({ error: 'Failed to fetch weather data' });
        }
    }
});

// API endpoint to get weather data by city name
app.get('/api/weather/city', async (req, res) => {
    const { city } = req.query;

    if (!city) {
        return res.status(400).json({ error: 'City name is required' });
    }

    if (!process.env.OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: 'API key not configured. Please add OPENWEATHER_API_KEY to .env file' });
    }

    try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                q: city,
                units: 'metric',
                appid: process.env.OPENWEATHER_API_KEY
            }
        });

        res.json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({
                error: error.response.data.message || 'Weather service error'
            });
        } else {
            res.status(500).json({ error: 'Failed to fetch weather data' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Weather app running on http://localhost:${PORT}`);
    console.log(`API Key configured: ${process.env.OPENWEATHER_API_KEY ? 'Yes' : 'No'}`);
});