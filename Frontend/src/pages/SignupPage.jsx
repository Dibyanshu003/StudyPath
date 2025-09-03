import { useNavigate, Link } from "react-router-dom";
import api from "../api/client.js";
import { useState } from "react";
import { toast } from "react-toastify";

export default function SignupPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dailyReminder, setDailyReminder] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/users/signup", {
        name,
        email,
        password,
        dailyReminder,
      });
      toast.success("Signup successful! Please log in.");
      nav("/login", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={onSubmit} className="card w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Create account</h1>

        <label className="block mb-2 text-sm">Name</label>
        <input
          className="w-full mb-3 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="block mb-2 text-sm">Email</label>
        <input
          className="w-full mb-3 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block mb-2 text-sm">Password</label>
        <input
          type="password"
          className="w-full mb-4 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="flex items-center gap-2 mb-6 text-sm">
          <input
            type="checkbox"
            checked={dailyReminder}
            onChange={(e) => setDailyReminder(e.target.checked)}
          />
          Enable daily reminder emails
        </label>

        <button disabled={loading} className="btn btn-primary w-full">
          {loading ? "Creating…" : "Sign up"}
        </button>

        <p className="text-sm mt-3 opacity-70">
          Already have an account?{" "}
          <Link className="text-brand-500" to="/login">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
