import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import { fetchCurrentUser, updateCurrentUser } from "../../api/users";
import { getApiErrorMessage } from "../../api/client";
import { getStoredUser, storeSession } from "../session";
import type { AuthUser } from "../../api/auth";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const [user, setUser] = useState<AuthUser | null>(storedUser);
  const [username, setUsername] = useState(storedUser?.username ?? "");
  const [bio, setBio] = useState(storedUser?.bio ?? "");
  const [initialUsername, setInitialUsername] = useState(storedUser?.username ?? "");
  const [initialBio, setInitialBio] = useState(storedUser?.bio ?? "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      setError("");

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        setUsername(currentUser.username ?? "");
        setBio(currentUser.bio ?? "");
        setInitialUsername(currentUser.username ?? "");
        setInitialBio(currentUser.bio ?? "");
      } catch (err) {
        setError("Unable to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedInitialUsername = initialUsername.trim();
    const trimmedBio = bio.trim();
    const usernameChanged = trimmedUsername !== trimmedInitialUsername;
    const bioChanged = bio !== initialBio;

    if (!trimmedUsername) {
      setError("Username cannot be empty.");
      setSuccess("");
      return;
    }

    if (!usernameChanged && !bioChanged) {
      setSuccess("No changes to save.");
      setError("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await updateCurrentUser({
        ...(usernameChanged ? { username: trimmedUsername } : {}),
        ...(bioChanged ? { bio: trimmedBio } : {}),
      });
      setUser(updatedUser);
      storeSession(undefined, updatedUser);
      setUsername(updatedUser.username ?? trimmedUsername);
      setBio(updatedUser.bio ?? "");
      setInitialUsername(updatedUser.username ?? trimmedUsername);
      setInitialBio(updatedUser.bio ?? "");
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="profile-shell">
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar />
      <main className="profile-shell">
        <div className="profile-card">
          <div className="profile-header">
            <div>
              <h1>Your profile</h1>
              <p>Update your reader profile and logout when you are done.</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/home")}
            >
              Back to home
            </button>
          </div>

          {error ? <div className="profile-alert profile-alert--error">{error}</div> : null}
          {success ? <div className="profile-alert profile-alert--success">{success}</div> : null}

          <form className="profile-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input type="email" value={user?.email ?? ""} disabled />
            </label>

            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Your username"
              />
            </label>

            <label>
              Bio
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Write a short reading bio"
              />
            </label>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
