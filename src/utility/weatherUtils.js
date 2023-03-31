import axios from 'axios';

export function extractCityFromWeatherQuery(query) {
  const weatherPattern =
    /(?:what's the|what is the|tell me the|find the|get the|is it|) (?:weather|weatehr|temperature|raining|snowing|sunny) (?:in|for) ([a-zA-Z\s]+)/i;
  const match = query.match(weatherPattern);

  if (match && match[1]) {
    return match[1].trim();
  } else {
    return null;
  }
}

export async function getWeatherForCity(location, apiKey) {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=imperial`
    );

    const temperature = response.data.main.temp;
    return `The current temperature in ${location} is ${temperature}°C.`;
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    return `I couldn't fetch the weather data for ${location}. Please try again later.`;
  }
}
