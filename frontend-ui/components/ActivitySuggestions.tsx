'use client';

import React from 'react';

type ActivitySuggestionsProps = {
  activities: string;
};

export default function ActivitySuggestions({ activities }: ActivitySuggestionsProps) {
  if (!activities) {
    return null;
  }

  // 活動提案をセクションごとに分割して表示
  const formatActivities = () => {
    return { __html: activities.replace(/\n/g, '<br />') };
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">おすすめのアクティビティ</h2>
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={formatActivities()} 
        />
      </div>
    </div>
  );
}
