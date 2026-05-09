import { useState, useEffect } from 'react';
import { getStandardBuckets, getSmartBuckets, resolveSmartBucket, createStandardBucket, deleteStandardBucket, createSmartBucket, deleteSmartBucket } from '../api/client';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

const Buckets = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('STANDARD');
  const [standardBuckets, setStandardBuckets] = useState([]);
  const [smartBuckets, setSmartBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isStdModalOpen, setIsStdModalOpen] = useState(false);
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolvedConversations, setResolvedConversations] = useState([]);
  const [isResolving, setIsResolveing] = useState(false);

  // Form states
  const [newStdBucket, setNewStdBucket] = useState({ name: '', description: '' });
  const [newSmartBucket, setNewSmartBucket] = useState({
    name: '',
    dateFrom: '',
    dateTo: '',
    platforms: [],
    keywords: []
  });
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    fetchBuckets();
  }, []);

  const fetchBuckets = async () => {
    try {
      const [stdRes, smartRes] = await Promise.all([
        getStandardBuckets(),
        getSmartBuckets()
      ]);
      setStandardBuckets(stdRes.data);
      setSmartBuckets(smartRes.data);
    } catch (err) {
      setError('Failed to fetch buckets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStd = async (e) => {
    e.preventDefault();
    try {
      await createStandardBucket(newStdBucket);
      setNewStdBucket({ name: '', description: '' });
      setIsStdModalOpen(false);
      fetchBuckets();
    } catch (err) {
      alert('Failed to create bucket');
    }
  };

  const handleDeleteStd = async (id) => {
    if (window.confirm('Delete this bucket? Conversations will be unassigned.')) {
      try {
        await deleteStandardBucket(id);
        fetchBuckets();
      } catch (err) {
        alert('Failed to delete bucket');
      }
    }
  };

  const handleCreateSmart = async (e) => {
    e.preventDefault();
    try {
      await createSmartBucket(newSmartBucket);
      setNewSmartBucket({ name: '', dateFrom: '', dateTo: '', platforms: [], keywords: [] });
      setIsSmartModalOpen(false);
      fetchBuckets();
    } catch (err) {
      alert('Failed to create smart bucket');
    }
  };

  const handleDeleteSmart = async (id) => {
    if (window.confirm('Delete this smart bucket?')) {
      try {
        await deleteSmartBucket(id);
        fetchBuckets();
      } catch (err) {
        alert('Failed to delete smart bucket');
      }
    }
  };

  const handleResolve = async (id) => {
    setIsResolveing(true);
    setIsResolveModalOpen(true);
    try {
      const res = await resolveSmartBucket(id);
      setResolvedConversations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolveing(false);
    }
  };

  const addKeyword = (e) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      if (!newSmartBucket.keywords.includes(keywordInput.trim())) {
        setNewSmartBucket({
          ...newSmartBucket,
          keywords: [...newSmartBucket.keywords, keywordInput.trim()]
        });
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw) => {
    setNewSmartBucket({
      ...newSmartBucket,
      keywords: newSmartBucket.keywords.filter(k => k !== kw)
    });
  };

  const togglePlatform = (p) => {
    const platforms = newSmartBucket.platforms.includes(p)
      ? newSmartBucket.platforms.filter(item => item !== p)
      : [...newSmartBucket.platforms, p];
    setNewSmartBucket({ ...newSmartBucket, platforms });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Buckets</h1>
        <button
          onClick={() => activeTab === 'STANDARD' ? setIsStdModalOpen(true) : setIsSmartModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {activeTab === 'STANDARD' ? 'New Bucket' : 'New Smart Bucket'}
        </button>
      </div>

      <div className="flex gap-8 border-b border-border mb-8">
        <button
          onClick={() => setActiveTab('STANDARD')}
          className={`pb-4 text-sm font-medium transition-colors relative ${
            activeTab === 'STANDARD' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Standard Buckets
          {activeTab === 'STANDARD' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setActiveTab('SMART')}
          className={`pb-4 text-sm font-medium transition-colors relative ${
            activeTab === 'SMART' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Smart Buckets
          {activeTab === 'SMART' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      {activeTab === 'STANDARD' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {standardBuckets.length > 0 ? (
            standardBuckets.map(bucket => (
              <div 
                key={bucket.id}
                className="bg-surface-elevated border border-border rounded-lg p-6 hover:border-primary transition-all cursor-pointer group relative"
                onClick={() => navigate(`/conversations?bucket=${bucket.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-text-primary">{bucket.name}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteStd(bucket.id); }}
                    className="text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <p className="text-text-secondary text-sm mb-6 line-clamp-2 min-h-[40px]">
                  {bucket.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-xs text-text-muted border-t border-border/50 pt-4">
                  <span>Created {new Date(bucket.createdAt).toLocaleDateString()}</span>
                  <span>{bucket.conversationCount || 0} convos</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState 
                title="No buckets yet" 
                description="Create a bucket to organize your conversations for social post generation." 
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {smartBuckets.length > 0 ? (
            smartBuckets.map(bucket => (
              <div 
                key={bucket.id}
                className="bg-surface-elevated border border-border rounded-lg p-6 flex flex-col group relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-text-primary">{bucket.name}</h3>
                  <button
                    onClick={() => handleDeleteSmart(bucket.id)}
                    className="text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <div className="flex-1 space-y-3 mb-6">
                  {bucket.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {bucket.keywords.map(kw => (
                        <span key={kw} className="bg-surface border border-border text-text-secondary text-[10px] px-1.5 py-0.5 rounded italic">#{kw}</span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-text-secondary space-y-1">
                    {(bucket.dateFrom || bucket.dateTo) && (
                      <p>📅 {bucket.dateFrom || '...'} to {bucket.dateTo || '...'}</p>
                    )}
                    {bucket.platforms?.length > 0 && (
                      <p>🤖 {bucket.platforms.join(', ')}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleResolve(bucket.id)}
                  className="w-full bg-surface border border-border hover:border-primary text-text-primary py-2 rounded text-sm font-medium transition-colors"
                >
                  Resolve Matches
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState 
                title="No smart buckets yet" 
                description="Smart buckets automatically find conversations matching your criteria." 
              />
            </div>
          )}
        </div>
      )}

      {/* Standard Bucket Modal */}
      <Modal isOpen={isStdModalOpen} onClose={() => setIsStdModalOpen(false)} title="New Standard Bucket">
        <form onSubmit={handleCreateStd} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase">Name</label>
            <input
              type="text"
              required
              value={newStdBucket.name}
              onChange={(e) => setNewStdBucket({ ...newStdBucket, name: e.target.value })}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:border-primary outline-none"
              placeholder="e.g. React Patterns"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase">Description</label>
            <textarea
              value={newStdBucket.description}
              onChange={(e) => setNewStdBucket({ ...newStdBucket, description: e.target.value })}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:border-primary outline-none min-h-[80px] resize-none"
              placeholder="Conversations about advanced React hooks..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsStdModalOpen(false)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded text-sm font-medium transition-colors"
            >
              Create Bucket
            </button>
          </div>
        </form>
      </Modal>

      {/* Smart Bucket Modal */}
      <Modal isOpen={isSmartModalOpen} onClose={() => setIsSmartModalOpen(false)} title="New Smart Bucket">
        <form onSubmit={handleCreateSmart} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase">Bucket Name</label>
            <input
              type="text"
              required
              value={newSmartBucket.name}
              onChange={(e) => setNewSmartBucket({ ...newSmartBucket, name: e.target.value })}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:border-primary outline-none"
              placeholder="e.g. Recent Coding Challenges"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase">From</label>
              <input
                type="date"
                value={newSmartBucket.dateFrom}
                onChange={(e) => setNewSmartBucket({ ...newSmartBucket, dateFrom: e.target.value })}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-xs text-text-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase">To</label>
              <input
                type="date"
                value={newSmartBucket.dateTo}
                onChange={(e) => setNewSmartBucket({ ...newSmartBucket, dateTo: e.target.value })}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-xs text-text-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase">Platforms</label>
            <div className="flex gap-4">
              {['CLAUDE', 'CHATGPT', 'GEMINI'].map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={newSmartBucket.platforms.includes(p)}
                    onChange={() => togglePlatform(p)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    newSmartBucket.platforms.includes(p) ? 'bg-primary border-primary' : 'border-border group-hover:border-text-muted'
                  }`}>
                    {newSmartBucket.platforms.includes(p) && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-text-primary uppercase tracking-wide">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase">Keywords (Enter to add)</label>
            <div className="w-full bg-surface border border-border rounded p-2 focus-within:border-primary min-h-[42px] flex flex-wrap gap-2">
              {newSmartBucket.keywords.map(kw => (
                <span key={kw} className="bg-surface-elevated border border-border text-text-primary text-[11px] px-2 py-1 rounded flex items-center gap-1.5">
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="text-text-muted hover:text-error transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={addKeyword}
                className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary min-w-[80px]"
                placeholder={newSmartBucket.keywords.length === 0 ? "react, java, error..." : ""}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsSmartModalOpen(false)}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded text-sm font-medium transition-colors"
            >
              Create Smart Bucket
            </button>
          </div>
        </form>
      </Modal>

      {/* Resolve Modal */}
      <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title="Smart Bucket Results">
        {isResolving ? (
          <LoadingSpinner />
        ) : (
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            {resolvedConversations.length > 0 ? (
              resolvedConversations.map(convo => (
                <div 
                  key={convo.id}
                  className="bg-surface border border-border p-3 rounded hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setIsResolveModalOpen(false);
                    navigate(`/conversations/${convo.id}`);
                  }}
                >
                  <div className="text-sm font-medium text-text-primary truncate mb-1">{convo.title}</div>
                  <div className="text-[10px] text-text-muted flex justify-between">
                    <span>{new Date(convo.capturedAt).toLocaleDateString()}</span>
                    <span>{convo.platform}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-text-secondary py-10 italic">No conversations match these criteria.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Buckets;
