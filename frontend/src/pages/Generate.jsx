import { useState, useEffect } from 'react';
import { getStandardBuckets, getSmartBuckets, getPersonalContext, generatePost } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import PostPreview from '../components/PostPreview';

const Generate = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  const [standardBuckets, setStandardBuckets] = useState([]);
  const [smartBuckets, setSmartBuckets] = useState([]);
  const [personalContext, setPersonalContext] = useState('');
  
  const [selectedBuckets, setSelectedBuckets] = useState([]);
  const [includePersonalContext, setIncludePersonalContext] = useState(true);
  const [generatedPost, setGeneratedPost] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stdRes, smartRes, contextRes] = await Promise.all([
          getStandardBuckets(),
          getSmartBuckets(),
          getPersonalContext()
        ]);
        setStandardBuckets(stdRes.data);
        setSmartBuckets(smartRes.data);
        setPersonalContext(contextRes.data?.content || '');
      } catch (err) {
        setError('Failed to fetch generator data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleBucket = (id, type) => {
    const key = `${type}:${id}`;
    if (selectedBuckets.some(b => b.key === key)) {
      setSelectedBuckets(selectedBuckets.filter(b => b.key !== key));
    } else {
      const bucket = type === 'STANDARD' 
        ? standardBuckets.find(b => b.id === id)
        : smartBuckets.find(b => b.id === id);
      setSelectedBuckets([...selectedBuckets, { id, type, key, name: bucket.name, ...bucket }]);
    }
  };

  const handleGenerate = async (platform) => {
    if (selectedBuckets.length === 0) {
      alert('Please select at least one bucket');
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedPost(null);

    const payload = {
      standardBucketIds: selectedBuckets.filter(b => b.type === 'STANDARD').map(b => b.id),
      smartBucketIds: selectedBuckets.filter(b => b.type === 'SMART').map(b => b.id),
      includePersonalContext,
      postPlatform: platform
    };

    try {
      const res = await generatePost(payload);
      setGeneratedPost(res.data);
      // Scroll to result
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError('Generation failed. Please try again.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const totalTokens = selectedBuckets.reduce((sum, b) => {
    if (b.type === 'STANDARD') {
      // In a real app, the bucket object might have aggregated token counts
      // For now we'll assume conversations are attached or we just sum what's there
      return sum + (b.totalTokens || 0); 
    }
    return sum;
  }, 0);

  const estimatedConvos = selectedBuckets.reduce((sum, b) => {
    return sum + (b.conversationCount || 0);
  }, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <h1 className="text-2xl font-bold mb-2 text-text-primary">Generate Content</h1>
      <p className="text-text-secondary text-sm mb-10">Select your context and generate authentic social media posts.</p>

      {/* Step 1: Select Context */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">1</div>
          <h2 className="text-lg font-semibold text-text-primary">Select Context</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[...standardBuckets, ...smartBuckets].map(bucket => {
            const type = bucket.keywords ? 'SMART' : 'STANDARD';
            const key = `${type}:${bucket.id}`;
            const isSelected = selectedBuckets.some(b => b.key === key);
            
            return (
              <div
                key={key}
                onClick={() => toggleBucket(bucket.id, type)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-surface-elevated border-primary ring-1 ring-primary' 
                    : 'bg-surface border-border hover:border-text-muted'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-sm font-bold text-text-primary truncate pr-2">{bucket.name}</h3>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    type === 'SMART' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'
                  }`}>
                    {type}
                  </span>
                </div>
                <div className="text-[11px] text-text-secondary">
                  {bucket.conversationCount || 0} conversations
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 bg-surface-elevated border border-border p-4 rounded-lg w-fit">
          <button
            onClick={() => setIncludePersonalContext(!includePersonalContext)}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
              includePersonalContext ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              includePersonalContext ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <span className="text-sm text-text-primary font-medium">Include Personal Context</span>
        </div>
      </section>

      {/* Step 2: Preview Context */}
      {selectedBuckets.length > 0 && (
        <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">2</div>
            <h2 className="text-lg font-semibold text-text-primary">Context Preview</h2>
          </div>

          <div className="bg-surface-elevated border border-border rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">Selected Buckets</label>
                <div className="flex flex-wrap gap-2">
                  {selectedBuckets.map(b => (
                    <span key={b.key} className="bg-surface border border-border text-text-primary text-xs px-2.5 py-1 rounded-md">
                      {b.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Conversations</label>
                  <div className="text-xl font-bold text-text-primary">{estimatedConvos}</div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1 block">Est. Tokens</label>
                  <div className={`text-xl font-bold ${totalTokens > 800000 ? 'text-warning' : 'text-text-primary'}`}>
                    {totalTokens.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {includePersonalContext && personalContext && (
              <div className="border-t border-border/50 pt-6">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 block">Personal Context Snippet</label>
                <p className="text-xs text-text-secondary leading-relaxed italic">
                  "{personalContext.length > 200 ? personalContext.substring(0, 200) + '...' : personalContext}"
                </p>
              </div>
            )}

            {totalTokens > 800000 && (
              <div className="bg-warning/10 border border-warning/20 rounded-md p-3 flex gap-3">
                <svg className="text-warning shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span className="text-xs text-warning leading-tight">
                  High token count detected. Context might be truncated by the model. Consider selecting fewer buckets.
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Step 3: Generate */}
      {selectedBuckets.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">3</div>
            <h2 className="text-lg font-semibold text-text-primary">Generate</h2>
          </div>

          {error && <div className="text-error text-sm mb-4">{error}</div>}

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <button
              onClick={() => handleGenerate('LINKEDIN')}
              disabled={generating}
              className="flex-1 bg-[#0077b5] hover:bg-[#00639a] text-white py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {generating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path>
                </svg>
              )}
              {generating ? 'Generating...' : 'Generate LinkedIn Post'}
            </button>
            <button
              onClick={() => handleGenerate('X')}
              disabled={generating}
              className="flex-1 bg-surface-elevated border border-white hover:bg-surface text-white py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {generating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"></path>
                </svg>
              )}
              {generating ? 'Generating...' : 'Generate X Post'}
            </button>
          </div>

          {generatedPost && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-6 text-center">Output Preview</h3>
              <PostPreview post={generatedPost} />
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Generate;
