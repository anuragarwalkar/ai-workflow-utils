/**
 * Weather Tool - Placeholder for weather information retrieval
 */

import { BaseTool } from '../BaseTool.js';

export class WeatherTool extends BaseTool {
  constructor() {
    super(
      'get_weather',
      'Get current weather information for a specified location',
      {
        location: {
          type: 'string',
          description: 'The city and state/country to get weather for',
          required: true,
        },
        units: {
          type: 'string',
          description: 'Temperature units (celsius, fahrenheit)',
          enum: ['celsius', 'fahrenheit'],
          default: 'celsius',
        },
      }
    );
    
    this.category = 'utility';
    this.icon = 'Cloud';
  }

  async execute(params, context) {
    const { location, units = 'celsius' } = params;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock weather data
    const mockWeather = {
      location,
      temperature: units === 'celsius' ? 22 : 72,
      units,
      condition: 'Partly cloudy',
      humidity: 65,
      windSpeed: 12,
      windDirection: 'NW',
      lastUpdated: new Date().toISOString(),
    };

    return {
      type: 'weather_data',
      data: mockWeather,
      message: `Current weather in ${location}: ${mockWeather.temperature}°${units === 'celsius' ? 'C' : 'F'}, ${mockWeather.condition}`,
      sessionId: context.sessionId,
    };
  }
}
