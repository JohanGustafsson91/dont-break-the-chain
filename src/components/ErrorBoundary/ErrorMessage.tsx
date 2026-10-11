import { useMessages } from "../../i18n/i18n";
import { errorBoundaryMessages } from "./messages";

/** ErrorBoundary's fallback; a function component, since the texts need a hook. */
export const ErrorMessage = () => {
  const m = useMessages(errorBoundaryMessages);

  return (
    <div className="page page-center ErrorBoundary" role="alert">
      <h1>{m.title}</h1>
      <p>{m.body}</p>
      <button type="button" onClick={() => window.location.reload()}>
        {m.reload}
      </button>
    </div>
  );
};
