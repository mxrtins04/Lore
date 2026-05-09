import NavBar from './NavBar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <main className="flex-1 pt-[56px] max-w-[1200px] mx-auto px-6 py-6 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
