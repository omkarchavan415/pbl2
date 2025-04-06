const apiKey = "97b424e976ac4105b8f125207252303";
let tempChart, humidityWindChart, pressureChart;
let lastForecast = null; // For analytics
let map; // Leaflet map

function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("login-error");

  if (user === "omkar@123" && pass === "1234") {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("weather-container").style.display = "block";
    showSection('home');
    errorMsg.innerText = "";
  } else {
    errorMsg.innerText = "Invalid username or password!";
  }
}

function getWeather() {
  const city = document.getElementById("city").value.trim();
  if (!city) {
    document.getElementById("weather").innerHTML = "Please enter a city.";
    return;
  }

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=3&aqi=no&alerts=no`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        document.getElementById("weather").innerHTML = `❌ Error: ${data.error.message}`;
        return;
      }
      renderWeatherData(data);
    })
    .catch(error => {
      document.getElementById("weather").innerHTML = `❌ Error: ${error.message}`;
    });
}

function getWeatherByLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=3&aqi=no&alerts=no`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            document.getElementById("weather").innerHTML = `❌ Error: ${data.error.message}`;
            return;
          }
          renderWeatherData(data);
        });
    }, () => {
      document.getElementById("weather").innerHTML = "❌ Location access denied.";
    });
  } else {
    document.getElementById("weather").innerHTML = "❌ Geolocation is not supported by this browser.";
  }
}

function renderWeatherData(data) {
  const current = data.current;
  const forecast = data.forecast.forecastday;
  lastForecast = forecast;

  // Dynamic background
  const condition = current.condition.text.toLowerCase();
  let bgUrl = "";
  if (condition.includes("rain")) bgUrl = "url('rain.png')";
  else if (condition.includes("cloud")) bgUrl = "url('cloudy.png')";
  else if (condition.includes("sun") || condition.includes("clear")) bgUrl = "url('sunny.png')";
  else if (condition.includes("snow")) bgUrl = "url('snow.png')";
  else bgUrl = "url('overcast.jpg')";
  document.body.style.backgroundImage = bgUrl;

  // Weather info
  let html = `
    <h2>📍 Weather in ${data.location.name}, ${data.location.country}</h2>
    <p>🌡 <strong>Temp:</strong> ${current.temp_c}°C</p>
    <p>🤒 <strong>Feels Like:</strong> ${current.feelslike_c}°C</p>
    <p>💨 <strong>Wind:</strong> ${current.wind_kph} km/h (${current.wind_dir})</p>
    <p>🌡 <strong>Pressure:</strong> ${current.pressure_mb} mb</p>
    <p>💧 <strong>Humidity:</strong> ${current.humidity}%</p>
    <p>🌥 <strong>Condition:</strong> ${current.condition.text}</p>
    <p>🌅 <strong>Sunrise:</strong> ${forecast[0].astro.sunrise} | 🌇 <strong>Sunset:</strong> ${forecast[0].astro.sunset}</p>
    <hr><h3>📆 3-Day Forecast:</h3>
  `;
  forecast.forEach(day => {
    html += `<p><strong>${day.date}:</strong> 🌡 Max: ${day.day.maxtemp_c}°C, Min: ${day.day.mintemp_c}°C, ☁ ${day.day.condition.text}</p>`;
  });
  document.getElementById("weather").innerHTML = html;

  updateCharts(forecast);
}

function updateCharts(forecast) {
  const labels = forecast.map(day => day.date);
  const tempMax = forecast.map(day => day.day.maxtemp_c);
  const tempMin = forecast.map(day => day.day.mintemp_c);
  const humidity = forecast.map(day => day.day.avghumidity);
  const wind = forecast.map(day => day.day.maxwind_kph);
  const pressure = forecast.map(day => day.day.avgtemp_c + 1000); // Simulated pressure

  if (tempChart) tempChart.destroy();
  if (humidityWindChart) humidityWindChart.destroy();
  if (pressureChart) pressureChart.destroy();

  const ctx1 = document.getElementById('tempChart').getContext('2d');
  tempChart = new Chart(ctx1, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Max Temp (°C)', data: tempMax, borderColor: 'red', fill: false },
        { label: 'Min Temp (°C)', data: tempMin, borderColor: 'blue', fill: false }
      ]
    }
  });

  const ctx2 = document.getElementById('humidityWindChart').getContext('2d');
  humidityWindChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Humidity (%)', data: humidity, backgroundColor: 'rgba(0, 123, 255, 0.6)' },
        { label: 'Wind (km/h)', data: wind, backgroundColor: 'rgba(40, 167, 69, 0.6)' }
      ]
    }
  });

  const ctx3 = document.getElementById('pressureChart').getContext('2d');
  pressureChart = new Chart(ctx3, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Pressure Trend (Simulated)', data: pressure, borderColor: 'purple', fill: false }
      ]
    }
  });
}

// Navigation Bar Logic
function showSection(section) {
  document.getElementById("home-section").style.display = "none";
  document.getElementById("analytics-section").style.display = "none";
  document.getElementById("map-section").style.display = "none";
  document.getElementById("about-section").style.display = "none";

  if (section === "analytics") {
    if (!lastForecast) {
      document.getElementById("analytics-section").style.display = "block";
      document.getElementById("analytics-section").innerHTML = "<p style='color:white;'>❗ Please get weather data first from Home section.</p>";
      return;
    }
  }

  document.getElementById(`${section}-section`).style.display = "block";

  if (section === "map") initMap();
  if (section === "analytics") {
    document.getElementById("analytics-section").innerHTML = `
      <h2>📊 Weather Analytics</h2>
      <canvas id="tempChart"></canvas>
      <canvas id="humidityWindChart"></canvas>
      <canvas id="pressureChart"></canvas>
    `;
    updateCharts(lastForecast);
  }
}

// Interactive Map
function initMap() {
  if (map) return; // prevent re-initializing

  map = L.map('map').setView([20.5937, 78.9629], 5); // India by default
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  map.on('click', function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          L.popup()
            .setLatLng([lat, lon])
            .setContent(`<strong>${data.location.name}</strong><br>🌡 ${data.current.temp_c}°C<br>${data.current.condition.text}`)
            .openOn(map);
        }
      });
  });
}
