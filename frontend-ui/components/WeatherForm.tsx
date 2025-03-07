'use client';

import React, { useState, FormEvent } from 'react';

type WeatherFormProps = {
  onSubmit: (city: string) => void;
  isLoading: boolean;
};

export default function WeatherForm({ onSubmit, isLoading }: WeatherFormProps) {
  const [city, setCity] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (city.trim() && !isLoading) {
      onSubmit(city.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto mb-6">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="都市名を入力（例：東京、London、New York）"
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className={`px-4 py-3 rounded-lg font-medium ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          disabled={isLoading}
        >
          {isLoading ? '読み込み中...' : '天気を取得'}
        </button>
      </div>
    </form>
  );
}
