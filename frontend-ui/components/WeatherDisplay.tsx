'use client';

import React from 'react';

type WeatherData = {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitationChance: number;
  condition: string;
  location: string;
};

type WeatherDisplayProps = {
  forecast: WeatherData[];
};

export default function WeatherDisplay({ forecast }: WeatherDisplayProps) {
  if (!forecast || forecast.length === 0) {
    return null;
  }

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">{forecast[0].location}の天気予報</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecast.map((day, index) => (
          <div
            key={day.date}
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
          >
            <div className="font-bold text-lg mb-2">{formatDate(day.date)}</div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg">
                {day.condition}
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {day.minTemp}°C 〜 {day.maxTemp}°C
                </div>
                <div className="text-sm text-gray-600">
                  降水確率: {day.precipitationChance}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
