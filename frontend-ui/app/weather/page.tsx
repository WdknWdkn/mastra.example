'use client';

import React, { useState } from 'react';
import Navigation from '../../components/Navigation';
import WeatherForm from '../../components/WeatherForm';
import WeatherDisplay from '../../components/WeatherDisplay';
import ActivitySuggestions from '../../components/ActivitySuggestions';

type WeatherData = {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitationChance: number;
  condition: string;
  location: string;
};

type WeatherResponse = {
  activities: string;
  forecast: WeatherData[];
};

export default function WeatherPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);

  const handleSubmit = async (city: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ city }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '天気データの取得中にエラーが発生しました');
      }

      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '天気データの取得中にエラーが発生しました');
      console.error('エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-center">天気予報とアクティビティ提案</h1>
        
        <WeatherForm onSubmit={handleSubmit} isLoading={isLoading} />
        
        {isLoading && (
          <div className="flex justify-center items-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded">
            <p>{error}</p>
          </div>
        )}
        
        {weatherData && !isLoading && (
          <div>
            <WeatherDisplay forecast={weatherData.forecast} />
            <ActivitySuggestions activities={weatherData.activities} />
          </div>
        )}
      </div>
    </main>
  );
}
