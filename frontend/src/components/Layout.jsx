import NavBar from './NavBar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="pt-[56px] max-w-[1200px] mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
