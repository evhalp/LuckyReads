import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../api/client";
import { loginUser } from "../../api/auth";
import { storeSession } from "../session";
import AuthField from "../../components/auth/AuthField";
import AuthShell from "../../components/auth/AuthShell";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }

    if (!emailPattern.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await loginUser(email.trim(), password);

      storeSession(response.token, response.user);

      navigate("/home", {
        state: {
          email: response.user.email,
          profileName: response.user.username,
        },
      });
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError) || "We couldn't sign you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to continue your reading journey"
    >
      <form className="login-form" onSubmit={handleSubmit}>
        <AuthField label="Email">
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </AuthField>

        <AuthField label="Password">
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </AuthField>

        <div className="login-meta">
          <Link className="login-link" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        {error ? (
          <p className="login-message login-message-error">{error}</p>
        ) : null}

        <button className="login-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="login-divider" aria-hidden="true">
        <span />
        <p>or</p>
        <span />
      </div>

      <p className="login-footer">
        Don&apos;t have an account yet?{" "}
        <Link className="login-footer-link" to="/signup">
          Create Reader Profile
        </Link>
      </p>
    </AuthShell>
  );
}
