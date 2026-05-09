import { NavLink } from 'react-router-dom';

const NavBar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-[56px] bg-surface border-b border-border z-50 px-6 flex items-center justify-between">
      <div className="text-[18px] font-semibold text-text-primary">
        Lore 🧠
      </div>
      <div className="flex items-center gap-8">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `text-[14px] transition-colors hover:text-text-primary ${
              isActive ? 'text-primary' : 'text-text-secondary'
            }`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/buckets"
          className={({ isActive }) =>
            `text-[14px] transition-colors hover:text-text-primary ${
              isActive ? 'text-primary' : 'text-text-secondary'
            }`
          }
        >
          Buckets
        </NavLink>
        <NavLink
          to="/conversations"
          className={({ isActive }) =>
            `text-[14px] transition-colors hover:text-text-primary ${
              isActive ? 'text-primary' : 'text-text-secondary'
            }`
          }
        >
          Conversations
        </NavLink>
        <NavLink
          to="/generate"
          className={({ isActive }) =>
            `text-[14px] transition-colors hover:text-text-primary ${
              isActive ? 'text-primary' : 'text-text-secondary'
            }`
          }
        >
          Generate
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) =>
            `text-[14px] transition-colors hover:text-text-primary ${
              isActive ? 'text-primary' : 'text-text-secondary'
            }`
          }
        >
          History
        </NavLink>
        <NavLink
          to="/context"
          className={({ isActive }) =>
            `text-[14px] transition-colors hover:text-text-primary ${
              isActive ? 'text-primary' : 'text-text-secondary'
            }`
          }
        >
          Context
        </NavLink>
      </div>
    </nav>
  );
};

export default NavBar;
