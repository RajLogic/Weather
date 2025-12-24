let debounceTimer;
const dropdown = document.getElementById('dropdown');
const cityInput = document.getElementById('cityInput');

function renderLoading() {
    return '<div class="loading">Loading weather data...</div>';
}

function renderError(message) {
    return `
        <div class="error">
            <p><strong>Error:</strong> ${message}</p>
            <button onclick="getWeatherByLocation()">Try Again</button>
        </div>
    `;
}

function getWeatherIcon(code) {
    const icons = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };
    return icons[code] || '🌤️';
}

function renderWeather(data) {
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const icon = getWeatherIcon(data.weather[0].icon);

    return `
        <div class="location-info">
            <span>📍</span>
            <span>${data.name}, ${data.sys.country}</span>
        </div>
        
        <div class="weather-main">
            <div class="weather-icon">${icon}</div>
            <div class="temperature">${temp}°C</div>
            <div class="description">${data.weather[0].description}</div>
            <div class="feels-like">Feels like ${feelsLike}°C</div>
        </div>

        <div class="weather-details">
            <div class="detail-card">
                <div class="detail-label">Humidity</div>
                <div class="detail-value">${data.main.humidity}%</div>
            </div>
            <div class="detail-card">
                <div class="detail-label">Wind Speed</div>
                <div class="detail-value">${Math.round(data.wind.speed * 3.6)} km/h</div>
            </div>
            <div class="detail-card">
                <div class="detail-label">Pressure</div>
                <div class="detail-value">${data.main.pressure} hPa</div>
            </div>
            <div class="detail-card">
                <div class="detail-label">Visibility</div>
                <div class="detail-value">${(data.visibility / 1000).toFixed(1)} km</div>
            </div>
        </div>

        <button class="refresh-btn" onclick="getWeatherByLocation()">
            🔄 Refresh Weather
        </button>
    `;
}

function render(html) {
    document.getElementById('app').innerHTML = html;
}

async function fetchWeather(lat, lon) {
    try {
        const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Weather service error: ${response.status}`);
        }

        const data = await response.json();
        render(renderWeather(data));
    } catch (error) {
        render(renderError(error.message));
    }
}

async function fetchWeatherByCity(city) {
    try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Weather service error: ${response.status}`);
        }

        const data = await response.json();
        render(renderWeather(data));
    } catch (error) {
        render(renderError(error.message));
    }
}

async function searchLocations(query) {
    if (query.length < 2) {
        hideDropdown();
        return;
    }

    try {
        const response = await fetch(`/api/geocoding?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
            hideDropdown();
            return;
        }

        const locations = await response.json();
        displayDropdown(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        hideDropdown();
    }
}

function displayDropdown(locations) {
    if (!locations || locations.length === 0) {
        hideDropdown();
        return;
    }

    dropdown.innerHTML = locations.map(loc => {
        const state = loc.state ? `, ${loc.state}` : '';
        return `
            <div class="dropdown-item" data-lat="${loc.lat}" data-lon="${loc.lon}" data-name="${loc.name}, ${loc.country}">
                <span class="location-name">${loc.name}${state}, ${loc.country}</span>
            </div>
        `;
    }).join('');

    dropdown.style.display = 'block';

    // Add click handlers to dropdown items
    const items = dropdown.querySelectorAll('.dropdown-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const lat = item.dataset.lat;
            const lon = item.dataset.lon;
            const name = item.dataset.name;

            cityInput.value = name;
            hideDropdown();
            render(renderLoading());
            fetchWeather(lat, lon);
        });
    });
}

function hideDropdown() {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
}

function getWeatherByLocation() {
    render(renderLoading());

    if (!navigator.geolocation) {
        render(renderError('Geolocation is not supported by your browser'));
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeather(latitude, longitude);
        },
        (error) => {
            let message = 'Unable to retrieve your location';
            if (error.code === 1) {
                message = 'Location permission denied. Please enable location access in your browser settings.';
            } else if (error.code === 2) {
                message = 'Location information is unavailable.';
            } else if (error.code === 3) {
                message = 'Location request timed out.';
            }
            render(renderError(message));
        }
    );
}

// Initialize app
getWeatherByLocation();

// Event listeners
document.getElementById('searchBtn').addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        hideDropdown();
        render(renderLoading());
        fetchWeatherByCity(city);
    }
});

cityInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        searchLocations(query);
    }, 300);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            hideDropdown();
            render(renderLoading());
            fetchWeatherByCity(city);
        }
    }
});

document.getElementById('locationBtn').addEventListener('click', () => {
    getWeatherByLocation();
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
        hideDropdown();
    }
});