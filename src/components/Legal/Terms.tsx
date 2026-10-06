import { Link } from "react-router-dom";
import { LEGAL } from "../../shared/legal";
import { LegalPage } from "./LegalPage";

export const Terms = () => (
  <LegalPage title="Terms of use">
    <p>
      By signing in to Don't Break The Chain you accept these terms. Please read them
      together with the <Link to="/privacy">privacy policy</Link>.
    </p>

    <h2>The service</h2>
    <p>
      Don't Break The Chain is a free habit tracker run by {LEGAL.controllerName}, a
      private individual in Sweden. There is no company behind it and no paid plan.
    </p>

    <h2>Who can use it</h2>
    <p>
      You must be at least 13 years old. You need an account with a supported sign-in
      provider, and you are responsible for keeping that account secure.
    </p>

    <h2>Your content</h2>
    <p>
      What you write is yours. You allow the app to store and show it to you, only to
      provide the service. Don't store other people's personal data or anything
      unlawful.
    </p>

    <h2>Fair use</h2>
    <p>
      Don't try to access other users' data, overload or disrupt the service, or use
      it through automated means. Accounts that do may be suspended.
    </p>

    <h2>No guarantees</h2>
    <p>
      The service is provided "as is" and "as available", without warranties of any
      kind. There is no guarantee that it will always be available, keep working the
      same way, or keep your data forever. Ask for a copy of anything that matters to
      you.
    </p>

    <h2>Not advice</h2>
    <p>
      The app, including its streaks, statistics and patterns, is not medical, health
      or professional advice.
    </p>

    <h2>Liability</h2>
    <p>
      To the extent permitted by applicable law, {LEGAL.controllerName} is not liable
      for indirect damage, loss of data, loss of profit or similar loss arising from
      your use of the service. Nothing in these terms limits liability that cannot be
      limited by law, such as for intent or gross negligence, or your rights as a
      consumer.
    </p>

    <h2>Changes and ending</h2>
    <p>
      The service and these terms may change, or the service may shut down, at any
      time. Significant changes are announced in the app or by email. You can stop
      using the service and have your account and data deleted at any time. Until that
      is available in the app, email{" "}
      <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
    </p>

    <h2>Law</h2>
    <p>
      Swedish law applies. If you are a consumer living in another EU country, you
      keep the mandatory protection of the law where you live.
    </p>
  </LegalPage>
);
