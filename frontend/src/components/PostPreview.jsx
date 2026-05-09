import { useState } from 'react';

const PostPreview = ({ post }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (post.postPlatform === 'LINKEDIN') {
    return (
      <div className="bg-white text-black rounded-lg shadow-xl max-w-[600px] mx-auto overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0077b5">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path>
          </svg>
          <span className="font-bold text-sm">LinkedIn</span>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
            <div>
              <div className="font-semibold text-sm">You</div>
              <div className="text-gray-500 text-xs">Just now</div>
            </div>
          </div>
          <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{post.output}</div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleCopy}
            className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    );
  }

  if (post.postPlatform === 'X') {
    const lines = post.output.split('\n').filter(line => line.trim());
    const isThread = lines.length > 1 && lines.every((line, i) => i === 0 || line.startsWith(`${i + 1}.`));

    return (
      <div className="bg-black text-white rounded-lg shadow-xl max-w-[600px] mx-auto overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"></path>
          </svg>
          <span className="font-bold text-sm">X</span>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
            <div>
              <div className="font-semibold text-sm">You</div>
              <div className="text-gray-400 text-xs">@you</div>
            </div>
          </div>
          <div className="space-y-4">
            {isThread ? (
              lines.map((line, i) => {
                const content = line.replace(/^\d+\.\s*/, '');
                return (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {content}
                    <div className="text-gray-500 text-xs mt-2">{i + 1}/{lines.length}</div>
                  </div>
                );
              })
            ) : (
              <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">{post.output}</div>
            )}
          </div>
          {!isThread && post.output.length <= 280 && (
            <div className="text-gray-500 text-xs mt-3 text-right">{post.output.length}/280</div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PostPreview;
