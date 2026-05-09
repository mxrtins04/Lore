import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getConversations, getStandardBuckets, deleteConversation } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const Conversations = () => {
  const [searchParams] = useSearchParams();
  const bucketIdParam = searchParams.get('bucket');

  const [conversations, setConversations] = useState([]);
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [bucketFilter, setBucketFilter] = useState(bucketIdParam || 'ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convosRes, bucketsRes] = await Promise.all([
          getConversations(),
          getStandardBuckets()
        ]);
        setConversations(convosRes.data);
        setBuckets(bucketsRes.data);
      } catch (err) {
        setError('Failed to fetch conversations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(id);
        setConversations(conversations.filter(c => c.id !== id));
      } catch (err) {
        alert('Failed to delete conversation');
      }
    }
  };

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

  const filteredConversations = conversations.filter(convo => {
    const matchesSearch = (convo.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === 'ALL' || convo.platform === platformFilter;
    const matchesBucket = bucketFilter === 'ALL' || convo.bucketId === bucketFilter;
    return matchesSearch && matchesPlatform && matchesBucket;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8 text-text-primary">Conversations</h1>

      {error && <div className="text-error mb-6">{error}</div>}

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-2 text-text-primary focus:border-primary outline-none text-sm transition-colors"
          />
        </div>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="bg-surface border border-border rounded-lg px-4 py-2 text-text-primary focus:border-primary outline-none text-sm transition-colors"
        >
          <option value="ALL">All Platforms</option>
          <option value="CLAUDE">Claude</option>
          <option value="CHATGPT">ChatGPT</option>
          <option value="GEMINI">Gemini</option>
        </select>
        <select
          value={bucketFilter}
          onChange={(e) => setBucketFilter(e.target.value)}
          className="bg-surface border border-border rounded-lg px-4 py-2 text-text-primary focus:border-primary outline-none text-sm transition-colors"
        >
          <option value="ALL">All Buckets</option>
          {buckets.map(bucket => (
            <option key={bucket.id} value={bucket.id}>{bucket.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredConversations.length > 0 ? (
          filteredConversations.map(convo => {
            const bucket = buckets.find(b => b.id === convo.bucketId);
            return (
              <Link
                key={convo.id}
                to={`/conversations/${convo.id}`}
                className="flex items-center justify-between bg-surface-elevated border border-border rounded-lg p-4 hover:border-primary transition-colors group"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-text-primary font-medium truncate">{convo.title || 'Untitled Conversation'}</h3>
                    {getPlatformBadge(convo.platform)}
                  </div>
                  <div className="flex items-center gap-4 text-[12px] text-text-secondary">
                    <span>{formatDate(convo.capturedAt)}</span>
                    <span className={bucket ? 'text-primary' : 'text-text-muted'}>
                      {bucket ? bucket.name : 'Unassigned'}
                    </span>
                    {(convo.inputTokens > 0 || convo.outputTokens > 0) && (
                      <span className="text-text-muted">
                        {convo.inputTokens + convo.outputTokens} tokens
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, convo.id)}
                  className="p-2 text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </Link>
            );
          })
        ) : (
          <EmptyState
            title="No conversations found"
            description={searchTerm || platformFilter !== 'ALL' || bucketFilter !== 'ALL' 
              ? "No conversations match your current filters." 
              : "No conversations yet. Install the extension and start capturing."}
          />
        )}
      </div>
    </div>
  );
};

export default Conversations;
