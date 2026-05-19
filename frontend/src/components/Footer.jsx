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
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          View on GitHub
        </a>
      </div>
    </footer>
  );
}

export default Footer;
