import { useState, useEffect } from 'react';
import { getGenerations } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import PostPreview from '../components/PostPreview';

function GenerationHistory() {
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGeneration, setSelectedGeneration] = useState(null);
  const [filter, setFilter] = useState('all'); // all, linkedin, twitter

  const loadGenerations = async () => {
    try {
      setLoading(true);
      const data = await getGenerations();
      setGenerations(data);
    } catch (err) {
      setError('Failed to load generation history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGenerations();
  }, []);

  const filteredGenerations = generations.filter(gen => {
    if (filter === 'all') return true;
    return gen.platform.toLowerCase() === filter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={loadGenerations}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <EmptyState
        title="No Generations Yet"
        description="Start generating content to see your history here."
        actionText="Generate Content"
        actionLink="/generate"
      />
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Generation History</h1>
        <p className="text-gray-400">View and manage your generated content</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg max-w-md">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          All ({generations.length})
        </button>
        <button
          onClick={() => setFilter('linkedin')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            filter === 'linkedin'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          LinkedIn
        </button>
        <button
          onClick={() => setFilter('twitter')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            filter === 'twitter'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          X (Twitter)
        </button>
      </div>

      {/* Generations List */}
      <div className="space-y-6">
        {filteredGenerations.map((generation) => (
          <div key={generation.id} className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    generation.platform === 'linkedin' 
                      ? 'bg-blue-900 text-blue-300' 
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {generation.platform === 'linkedin' ? 'LinkedIn' : 'X (Twitter)'}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {formatDate(generation.createdAt)}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {generation.title || 'Untitled Generation'}
                </h3>
                {generation.bucketName && (
                  <p className="text-sm text-gray-400">
                    From bucket: <span className="text-blue-400">{generation.bucketName}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedGeneration(
                  selectedGeneration?.id === generation.id ? null : generation
                )}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              >
                {selectedGeneration?.id === generation.id ? 'Hide' : 'Preview'}
              </button>
            </div>

            {/* Generation Content Preview */}
            {selectedGeneration?.id === generation.id && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <PostPreview
                  platform={generation.platform}
                  content={generation.content}
                  title={generation.title}
                />
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(generation.content)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Copy Content
                  </button>
                  <button
                    onClick={() => window.open(
                      generation.platform === 'linkedin' 
                        ? 'https://www.linkedin.com/feed'
                        : 'https://twitter.com',
                      '_blank'
                    )}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    Open {generation.platform === 'linkedin' ? 'LinkedIn' : 'X'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredGenerations.length === 0 && !loading && (
        <EmptyState
          title={`No ${filter === 'all' ? '' : filter === 'linkedin' ? 'LinkedIn' : 'X'} Generations`}
          description={`You haven't generated any ${filter === 'all' ? 'content' : filter === 'linkedin' ? 'LinkedIn posts' : 'X posts'} yet.`}
          actionText="Generate Content"
          actionLink="/generate"
        />
      )}
    </div>
  );
}

export default GenerationHistory;
