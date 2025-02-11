import { signInWithPopup } from "firebase/auth";
import { auth, githubProvider } from "../../firebase";

export const Login = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (error) {
      console.error("GitHub Login Failed:", error);
    }
  };

  return (
    <div className="page">
      <p>
        <button type="button" onClick={handleLogin}>
          Login with GitHub
        </button>
      </p>
    </div>
  );
};
