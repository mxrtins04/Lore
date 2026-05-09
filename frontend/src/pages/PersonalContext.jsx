import { useState, useEffect } from 'react';
import { getPersonalContext, updatePersonalContext } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const PersonalContextPage = () => {
  const [context, setContext] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await getPersonalContext();
        setContext(res.data);
        setContent(res.data?.content || '');
      } catch (err) {
        setError('Failed to fetch personal context');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await updatePersonalContext({ content });
      setContext(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError('Failed to save context');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-text-primary">Personal Context</h1>
      <p className="text-text-secondary mb-8 text-sm">
        This context is included when generating posts to make them feel authentically yours. 
        Describe your tone, background, audience, and any specific preferences.
      </p>

      {error && <div className="text-error mb-4">{error}</div>}

      <div className="bg-surface-elevated border border-border rounded-lg p-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[400px] bg-surface border border-border rounded-lg p-4 text-text-primary text-sm leading-relaxed outline-none focus:border-primary transition-colors resize-none mb-4"
          placeholder="I am a software engineer focused on Spring Boot and React. My tone is usually direct and slightly technical..."
        />
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-text-muted">
            {context?.version !== undefined && `Version ${context.version}`}
            {context?.updatedAt && ` • Last updated ${new Date(context.updatedAt).toLocaleDateString()}`}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 rounded-md font-medium text-sm transition-all ${
              saved 
                ? 'bg-success text-white' 
                : 'bg-primary hover:bg-primary-hover text-white disabled:opacity-50'
            }`}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Context'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalContextPage;
