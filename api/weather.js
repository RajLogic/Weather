import axios from 'axios';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { lat, lon, city } = req.query;

    if (!process.env.OPENWEATHER_API_KEY) {
        return res.status(500).json({
            error: 'API key not configured. Please add OPENWEATHER_API_KEY to environment variables'
        });
    }

    try {
        let params = {
            units: 'metric',
            appid: process.env.OPENWEATHER_API_KEY
        };

        // Check if searching by city or coordinates
        if (city) {
            params.q = city;
        } else if (lat && lon) {
            params.lat = lat;
            params.lon = lon;
        } else {
            return res.status(400).json({
                error: 'Either city name or latitude/longitude are required'
            });
        }

        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params
        });

        res.status(200).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({
                error: error.response.data.message || 'Weather service error'
            });
        } else {
            res.status(500).json({
                error: 'Failed to fetch weather data'
            });
        }
    }
}