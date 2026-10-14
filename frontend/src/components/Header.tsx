import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { logout } = useAuth();

  return (
    <div className="flex justify-end mb-4">
      <button
        type="button"
        onClick={logout}
        className="text-caption text-accent hover:underline"
      >
        Log out
      </button>
    </div>
  );
}