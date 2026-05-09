import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getConversations, getStandardBuckets, getSmartBuckets, getGenerations } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState({
    conversations: 0,
    standardBuckets: 0,
    smartBuckets: 0,
    posts: 0
  });
  const [recentConversations, setRecentConversations] = useState([]);
  const [recentGenerations, setRecentGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convos, stdBuckets, smartBuckets, generations] = await Promise.all([
          getConversations(),
          getStandardBuckets(),
          getSmartBuckets(),
          getGenerations()
        ]);

        setStats({
          conversations: convos.data.length,
          standardBuckets: stdBuckets.data.length,
          smartBuckets: smartBuckets.data.length,
          posts: generations.data.length
        });

        setRecentConversations(convos.data.slice(0, 5));
        setRecentGenerations(generations.data.slice(0, 5));
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getPlatformBadge = (platform) => {
    const colors = {
      CLAUDE: 'bg-[#7c3aed]',
      CHATGPT: 'bg-[#16a34a]',
      GEMINI: 'bg-[#2563eb]'
    };
    return (
      <span className={`${colors[platform] || 'bg-surface-elevated'} text-white text-[10px] px-2 py-0.5 rounded font-bold`}>
        {platform}
      </span>
    );
  };

  const getPostPlatformBadge = (platform) => {
    const colors = {
      LINKEDIN: 'bg-[#0077b5]',
      X: 'bg-black border border-border'
    };
    return (
      <span className={`${colors[platform] || 'bg-surface-elevated'} text-white text-[10px] px-2 py-0.5 rounded font-bold`}>
        {platform}
      </span>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 text-text-primary">Dashboard</h1>
      
      {error && <div className="text-error mb-6">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-surface-elevated border border-border rounded-lg p-5">
          <div className="text-2xl font-bold text-text-primary mb-1">{stats.conversations}</div>
          <div className="text-text-secondary text-sm">Total Conversations</div>
        </div>
        <div className="bg-surface-elevated border border-border rounded-lg p-5">
          <div className="text-2xl font-bold text-text-primary mb-1">{stats.standardBuckets}</div>
          <div className="text-text-secondary text-sm">Standard Buckets</div>
        </div>
        <div className="bg-surface-elevated border border-border rounded-lg p-5">
          <div className="text-2xl font-bold text-text-primary mb-1">{stats.smartBuckets}</div>
          <div className="text-text-secondary text-sm">Smart Buckets</div>
        </div>
        <div className="bg-surface-elevated border border-border rounded-lg p-5">
          <div className="text-2xl font-bold text-text-primary mb-1">{stats.posts}</div>
          <div className="text-text-secondary text-sm">Posts Generated</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4 text-text-primary">Recent Conversations</h2>
          <div className="space-y-4">
            {recentConversations.length > 0 ? (
              recentConversations.map(convo => (
                <Link 
                  key={convo.id} 
                  to={`/conversations/${convo.id}`}
                  className="block bg-surface-elevated border border-border rounded-lg p-4 hover:border-primary transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-text-primary truncate mr-4">{convo.title || 'Untitled Conversation'}</h3>
                    {getPlatformBadge(convo.platform)}
                  </div>
                  <div className="text-[12px] text-text-secondary">
                    {formatDate(convo.capturedAt)}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-text-muted italic">No recent conversations</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 text-text-primary">Recent Generations</h2>
          <div className="space-y-4">
            {recentGenerations.length > 0 ? (
              recentGenerations.map(gen => (
                <Link 
                  key={gen.id} 
                  to="/history"
                  className="block bg-surface-elevated border border-border rounded-lg p-4 hover:border-primary transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-text-primary line-clamp-2 flex-1 mr-4">
                      {gen.output}
                    </div>
                    {getPostPlatformBadge(gen.postPlatform)}
                  </div>
                  <div className="text-[12px] text-text-secondary">
                    {formatDate(gen.createdAt)}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-text-muted italic">No recent generations</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
