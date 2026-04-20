import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthField from "../../components/auth/AuthField";
import AuthShell from "../../components/auth/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Enter the email connected to your account.");
      setIsSubmitted(false);
      return;
    }

    setError("");
    setIsSubmitted(true);
  };

  return (
    <AuthShell
      title="Forgot Password?"
      subtitle="Enter your email and we'll send you a link to reset your password."
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

        {error ? <p className="login-message login-message-error">{error}</p> : null}

        {isSubmitted ? (
          <p className="login-message login-message-success">
            If an account exists for that email, we&apos;ll send a reset link shortly.
          </p>
        ) : null}

        <button className="login-submit" type="submit">
          Send Reset Link
        </button>
      </form>

      <p className="login-footer login-footer-left">
        <Link className="login-footer-link" to="/login">
          Back to Sign In
        </Link>
      </p>
    </AuthShell>
  );
}
