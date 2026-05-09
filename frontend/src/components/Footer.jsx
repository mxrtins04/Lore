import { Github } from 'lucide-react';

function Footer() {
  return (
    <footer className="mt-auto py-6 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-text-muted">
        <div>
          Created by{' '}
          <a
            href="https://github.com/mxrtins04"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-hover transition-colors"
          >
            @mxrtins04
          </a>
        </div>
        <a
          href="https://github.com/mxrtins04/Lore"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <Github size={16} />
          <span>View on GitHub</span>
        </a>
      </div>
    </footer>
  );
}

export default Footer;
