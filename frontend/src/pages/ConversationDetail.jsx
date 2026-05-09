import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getConversationById, getStandardBuckets, assignBucket } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const ConversationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convoRes, bucketsRes] = await Promise.all([
          getConversationById(id),
          getStandardBuckets()
        ]);
        setConversation(convoRes.data);
        setBuckets(bucketsRes.data);
      } catch (err) {
        setError('Failed to fetch conversation details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBucketChange = async (bucketId) => {
    try {
      await assignBucket(id, bucketId === 'UNASSIGNED' ? null : bucketId);
      setConversation({ ...conversation, bucketId: bucketId === 'UNASSIGNED' ? null : bucketId });
    } catch (err) {
      alert('Failed to update bucket');
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

  if (loading) return <LoadingSpinner />;
  if (!conversation) return <div className="text-center py-20">Conversation not found</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-text-primary">{conversation.title || 'Untitled Conversation'}</h1>
            {getPlatformBadge(conversation.platform)}
          </div>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span>{formatDate(conversation.capturedAt)}</span>
            {(conversation.inputTokens > 0 || conversation.outputTokens > 0) && (
              <span>{conversation.inputTokens + conversation.outputTokens} tokens</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-secondary font-medium">Bucket:</span>
          <select
            value={conversation.bucketId || 'UNASSIGNED'}
            onChange={(e) => handleBucketChange(e.target.value)}
            className="bg-surface border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:border-primary outline-none"
          >
            <option value="UNASSIGNED">Unassigned</option>
            {buckets.map(bucket => (
              <option key={bucket.id} value={bucket.id}>{bucket.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="text-error mb-6">{error}</div>}

      <div className="space-y-6 max-w-[800px] mx-auto py-8">
        {conversation.messages?.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] p-4 text-sm leading-relaxed ${
                msg.role === 'USER' 
                  ? 'bg-primary text-white rounded-[12px_12px_2px_12px]' 
                  : 'bg-surface-elevated border border-border text-text-primary rounded-[12px_12px_12px_2px]'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationDetail;
