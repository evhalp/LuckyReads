import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../api/auth";
import { getApiErrorMessage } from "../../api/client";
import { storeSession } from "../session";
import AuthField from "../../components/auth/AuthField";
import AuthShell from "../../components/auth/AuthShell";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const meetsPasswordRules = (password: string) =>
  password.length >= 8 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password);

export default function SignupFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStepOne = () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Enter your email and complete both password fields.");
      return false;
    }

    if (!emailPattern.test(email.trim())) {
      setError("Enter a valid email address.");
      return false;
    }

    if (!meetsPasswordRules(password)) {
      setError(
        "Password must be at least 8 characters and include a letter and a number.",
      );
      return false;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return false;
    }

    setError("");
    return true;
  };

  const validateStepTwo = () => {
    if (!name.trim()) {
      setError("Add your name to continue.");
      return false;
    }

    setError("");
    return true;
  };

  const handleContinue = () => {
    if (!validateStepOne()) {
      return;
    }

    setStep(1);
  };

  const handleBack = () => {
    setError("");

    if (step === 0) {
      navigate("/login");
      return;
    }

    setStep(0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === 0) {
      handleContinue();
      return;
    }

    if (!validateStepTwo()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registerUser({
        email: email.trim(),
        password,
        confirmPassword,
        username: name.trim(),
        bio: bio.trim(),
      });

      if (response.token) {
        storeSession(response.token, response.user);

        navigate("/home", {
          state: {
            onboardingComplete: true,
            profileName: response.user.username ?? name.trim(),
            email: response.user.email,
            bio: response.user.bio ?? bio.trim(),
          },
        });
        return;
      }

      navigate("/login", {
        state: {
          email: email.trim(),
          registered: true,
        },
      });
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError) || "We couldn't create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={step === 0 ? "Create your account" : "Create your profile"}
      subtitle={
        step === 0
          ? "Start with your email and a secure password for your new reader profile."
          : "Finish by telling readers who you are and what kind of books you love."
      }
      panelClassName="onboarding-panel"
    >
      <form className="login-form" onSubmit={handleSubmit}>
        {step === 0 ? (
          <>
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

            <AuthField label="Create Password">
              <input
                type="password"
                name="new-password"
                placeholder="Create a password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </AuthField>

            <AuthField label="Confirm Password">
              <input
                type="password"
                name="confirm-password"
                placeholder="Confirm your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </AuthField>

            <p className="onboarding-note">
              Password requirements: at least 8 characters, one letter, and one
              number.
            </p>
          </>
        ) : (
          <>
            <AuthField label="Name">
              <input
                type="text"
                name="name"
                placeholder="Your name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </AuthField>

            <AuthField label="Bio">
              <textarea
                className="login-textarea"
                name="bio"
                placeholder="Tell us a little about your reading taste..."
                rows={5}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
            </AuthField>
          </>
        )}

        {error ? <p className="login-message login-message-error">{error}</p> : null}

        <div className="onboarding-actions">
          <button
            className="onboarding-secondary"
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            Back
          </button>
          <button className="login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Continue"}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
