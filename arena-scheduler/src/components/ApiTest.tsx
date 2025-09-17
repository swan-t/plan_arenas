import React, { useState } from 'react';
import { seasonsApi } from '@/services/api';

const ApiTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setResult('Testing API connection...');
    
    try {
      const seasons = await seasonsApi.getAll();
      setResult(`✅ API Success! Found ${seasons.length} seasons: ${JSON.stringify(seasons, null, 2)}`);
    } catch (error) {
      setResult(`❌ API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0' }}>
      <h3>API Connection Test</h3>
      <button onClick={testApi} disabled={loading}>
        {loading ? 'Testing...' : 'Test API Connection'}
      </button>
      <pre style={{ marginTop: '10px', background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
        {result}
      </pre>
    </div>
  );
};

export default ApiTest;
