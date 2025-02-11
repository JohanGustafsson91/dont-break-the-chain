import { login } from "../../services/authService";

export const Login = () => {
  const handleLogin = async () => {
    try {
      await login({ provider: "github" });
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
