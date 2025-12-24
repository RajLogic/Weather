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

    const { q } = req.query;

    if (!q || q.length < 2) {
        return res.status(400).json({
            error: 'Search query must be at least 2 characters'
        });
    }

    if (!process.env.OPENWEATHER_API_KEY) {
        return res.status(500).json({
            error: 'API key not configured'
        });
    }

    try {
        const response = await axios.get('http://api.openweathermap.org/geo/1.0/direct', {
            params: {
                q: q,
                limit: 5,
                appid: process.env.OPENWEATHER_API_KEY
            }
        });

        res.status(200).json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({
                error: error.response.data.message || 'Geocoding service error'
            });
        } else {
            res.status(500).json({
                error: 'Failed to fetch location data'
            });
        }
    }
}