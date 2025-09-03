import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import api from "../api/client.js";
import { useState } from "react";
import { toast } from "react-toastify";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      // For debugging: confirm the URL we’re hitting
      // console.log('POST', `${import.meta.env.VITE_API_BASE_URL}/api/users/login`)
      const { data } = await api.post("/api/users/login", { email, password });
      login(data.user);
      toast.success("Logged in");
      nav("/", { replace: true });
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message || err?.message || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={onSubmit} className="card w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Login</h1>

        <label className="block mb-2 text-sm">Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          className="w-full mb-3 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block mb-2 text-sm">Password</label>
        <input
          type="password"
          placeholder="••••••••"
          className="w-full mb-6 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button disabled={loading} className="btn btn-primary w-full">
          {loading ? "Signing in…" : "Login"}
        </button>

        <p className="text-sm mt-3 opacity-70">
          New here?{" "}
          <Link className="text-brand-500" to="/signup">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
