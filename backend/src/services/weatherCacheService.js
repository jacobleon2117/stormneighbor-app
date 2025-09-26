const logger = require("../utils/logger");

class WeatherCacheService {
  constructor(options = {}) {
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 30 * 60 * 1000;
    this.forecastDays = options.forecastDays || 7;
    this.cleanupInterval = options.cleanupInterval || 15 * 60 * 1000;

    if (process.env.NODE_ENV !== "test") {
      this.intervalId = setInterval(() => this.cleanup(), this.cleanupInterval);
    }
  }

  clearCleanupInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getCacheKey(lat, lng) {
    return `weather_${parseFloat(lat).toFixed(2)}_${parseFloat(lng).toFixed(2)}`;
  }

  getCachedWeather(lat, lng) {
    const key = this.getCacheKey(lat, lng);
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    logger.info(`Weather cache hit: ${lat}, ${lng}`);
    return cached.data;
  }

  cacheWeatherData(lat, lng, data) {
    const key = this.getCacheKey(lat, lng);
    this.cache.set(key, { data, timestamp: Date.now() });
    logger.info(`Weather cached: ${lat}, ${lng}`);
  }

  generateFallbackWeather(lat, lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const now = new Date();
    const month = now.getMonth();
    const hour = now.getHours();
    const isDaytime = hour >= 6 && hour < 20;

    const { baseTemp, tempVariation, commonConditions } = this.getSeasonalDefaults(latitude, month);

    const temperature = Math.max(
      0,
      Math.min(120, baseTemp + Math.floor(Math.random() * tempVariation) - tempVariation / 2)
    );
    const condition = commonConditions[Math.floor(Math.random() * commonConditions.length)];
    const windSpeed = this.randomChoice(["5 mph", "8 mph", "12 mph", "15 mph", "18 mph"]);
    const windDirection = this.randomChoice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]);

    const fallbackData = {
      location: { latitude, longitude },
      current: {
        temperature,
        temperatureUnit: "F",
        windSpeed,
        windDirection,
        shortForecast: condition,
        detailedForecast: `${condition} with temps around ${temperature}°F. Wind ${windDirection} at ${windSpeed}.`,
        icon: `https://api.weather.gov/icons/land/${isDaytime ? "day" : "night"}/few?size=medium`,
        isDaytime,
      },
      forecast: this.generateForecast(temperature, condition),
      lastUpdated: now.toISOString(),
      source: "FALLBACK_DATA",
      note: "Weather service temporarily unavailable. Showing estimated data.",
    };

    logger.info(
      `Fallback weather generated: ${latitude}, ${longitude} - ${temperature}°F, ${condition}`
    );
    return fallbackData;
  }

  getSeasonalDefaults(latitude, month) {
    let baseTemp, tempVariation, commonConditions;

    if (latitude >= 45) {
      baseTemp = month >= 4 && month <= 9 ? 68 : 35;
      tempVariation = 15;
      commonConditions =
        month >= 11 || month <= 2
          ? ["Snow Showers", "Partly Cloudy", "Overcast"]
          : ["Partly Cloudy", "Clear", "Scattered Clouds"];
    } else if (latitude >= 35) {
      baseTemp = month >= 4 && month <= 9 ? 75 : 50;
      tempVariation = 20;
      commonConditions = ["Partly Cloudy", "Clear", "Scattered Clouds", "Light Rain"];
    } else if (latitude >= 25) {
      baseTemp = month >= 4 && month <= 9 ? 85 : 70;
      tempVariation = 12;
      commonConditions =
        month >= 5 && month <= 9
          ? ["Partly Cloudy", "Scattered Thunderstorms", "Hot"]
          : ["Clear", "Partly Cloudy", "Mild"];
    } else {
      baseTemp = 82;
      tempVariation = 8;
      commonConditions = ["Partly Cloudy", "Scattered Showers", "Humid"];
    }

    return { baseTemp, tempVariation, commonConditions };
  }

  generateForecast(baseTemp, currentCondition) {
    const forecast = [];
    const daysOfWeek = [
      "Today",
      "Tomorrow",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const possibleConditions = [
      "Clear",
      "Partly Cloudy",
      "Mostly Cloudy",
      "Light Rain",
      "Scattered Clouds",
    ];

    for (let i = 0; i < this.forecastDays; i++) {
      const tempVariation = Math.floor(Math.random() * 10) - 5;
      const dayTemp = Math.max(20, Math.min(110, baseTemp + tempVariation + this.randomInt(-3, 3)));
      const condition = i === 0 ? currentCondition : this.randomChoice(possibleConditions);

      forecast.push({
        name: i < daysOfWeek.length ? daysOfWeek[i] : `Day ${i + 1}`,
        temperature: dayTemp,
        temperatureUnit: "F",
        shortForecast: condition,
        windSpeed: `${this.randomInt(5, 20)} mph`,
        windDirection: this.randomChoice(["N", "S", "E", "W", "NW", "SW"]),
      });
    }

    return forecast;
  }

  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) logger.info(`Cleaned up ${removed} expired weather cache entries`);
  }

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheTimeout: this.cacheTimeout,
      lastCleanup: new Date().toISOString(),
    };
  }
}

module.exports = new WeatherCacheService();
