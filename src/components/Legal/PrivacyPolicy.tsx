import { LEGAL } from "../../shared/legal";
import { LegalPage } from "./LegalPage";

export const PrivacyPolicy = () => (
  <LegalPage title="Privacy policy">
    <p>
      This policy explains what Don't Break The Chain stores about you, why, and what
      you can do about it. It is written to be short and readable.
    </p>

    <h2>Who is responsible</h2>
    <p>
      The data controller (the operator) is {LEGAL.controllerName}, a private individual in Sweden,
      who runs the app for free. Contact:{" "}
      <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
    </p>

    <h2>What is stored</h2>
    <ul>
      <li>
        <strong>Your account:</strong> the name, email address and profile picture
        link that your sign-in provider (Google or GitHub) shares when you sign in,
        and an account id. If you first signed in with GitHub and later sign in with
        Google using the same email address, your account continues with Google and
        GitHub sign-in stops working for it. Your habits are kept.
      </li>
      <li>
        <strong>Your habits:</strong> their names, descriptions and goals, which days
        you marked, and any notes you write.
      </li>
      <li>
        <strong>Reminders, only if you turn them on:</strong> the time you chose, your
        time zone, the last date on which all your habits were done for the day (so you
        aren't reminded on days you're done), the date of the last reminder (so you get at
        most one a day), how many habits are left that day and the length of your longest
        current chain (numbers only, so the reminder can be specific), and a push token for
        each device that gets reminders. Turning
        reminders off on a device, logging out there, or deleting your account removes
        that device's token.
      </li>
    </ul>
    <p>
      Habit names and notes can reveal things about your health, such as "take
      medication" or "no alcohol". You decide what to write, and you can change or
      delete it at any time. It is never shown to other users. The operator can
      technically access the database, but does not look at your content except to fix
      a problem you report, to investigate misuse of the service, or when required by
      law. Avoid writing anything you
      would not want stored.
    </p>

    <h2>Why it is stored</h2>
    <p>
      To provide the app to you: to sign you in, to show and save your habits, and, if
      you turn them on, to send you reminders.
      The legal basis is that it is necessary to provide the service you asked for
      (GDPR article 6(1)(b)). Your account data is needed to use the app: without it
      you cannot sign in. Everything you write in habits and notes is optional.
    </p>
    <p>
      When you visit the site, technical data such as your IP address is processed to
      deliver the pages and keep the service secure, including for visitors who never
      sign in. Data may also be looked at to prevent and investigate misuse. The legal
      basis for both is the legitimate interest in running a secure service (GDPR
      article 6(1)(f)), and you have the right to object to it.
    </p>
    <p>
      Your data is never sold or used for advertising, and the app never shares it
      with anyone for their own purposes. There is no automated decision-making or profiling.
    </p>

    <h2>Who else is involved</h2>
    <ul>
      <li>
        <strong>Google (Firebase)</strong> provides sign-in, the database, hosting and
        push notifications (Firebase Cloud Messaging), as a processor under its data
        processing terms. Your habits are stored in
        Google's European multi-region (eur3).
      </li>
      <li>
        <strong>Google or GitHub</strong> is the sign-in service you choose. In that
        role it acts on its own behalf, under its own privacy terms, separately from
        Google's role as Firebase's processor above. When you sign in, it shares your
        name, email address and profile picture link with the app, and learns that you
        use this app. Your profile picture is loaded from its servers.
      </li>
      <li>
        <strong>GitHub</strong> runs the scheduled job that sends reminders, as a
        processor. The job reads only reminder settings, never your habits or notes.
      </li>
      <li>
        <strong>Your browser's push service</strong> (for example Apple's, Google's or
        Mozilla's) delivers each reminder to your device. Reminders say how many habits are
        left and how long your chain is; they never contain your habits' names or notes.
      </li>
    </ul>

    <h2>Transfers outside the EU</h2>
    <p>
      Firebase Authentication and Cloud Messaging may process account data and push
      tokens in the United States, and GitHub runs the reminder job there. Such
      transfers rely on the EU-US Data Privacy Framework and the European Commission's
      Standard Contractual Clauses.
    </p>

    <h2>How long it is kept</h2>
    <p>
      Until you delete your account, or ask for it to be deleted. Google keeps
      technical logs (such as IP addresses) for a limited time for security and
      operations.
    </p>

    <h2>Your rights</h2>
    <p>
      You can ask for a copy of your data, have it corrected or deleted, restrict or
      object to its processing, and receive it in a portable format. You can export
      your data and delete your account yourself from the account menu (your picture,
      top right). Deleting removes your habits, days, notes and reminder settings for
      good, and then your account. Your sign-in provider keeps its own record that you used the app; you
      can remove the app's access in your Google or GitHub account settings. Google's
      technical logs expire on their own. If you can't sign in any more, or for
      anything else, email{" "}
      <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> and it will be
      handled within one month. You can also complain to the Swedish Authority for
      Privacy Protection (IMY), <a href="https://www.imy.se">imy.se</a>.
    </p>

    <h2>Cookies and tracking</h2>
    <p>
      There are no analytics, no advertising and no tracking cookies. Signing in keeps
      a token in your browser's storage, which the app needs to work. The login page
      also remembers, on this device only, that you accepted the current terms, so
      you don't have to tick the box every time; it contains nothing that identifies
      you. If you turn on reminders, the browser also keeps this device's push token.
      None of this requires consent.
    </p>

    <h2>Security</h2>
    <p>
      Access rules in the database make sure no other user can read or change your
      habits.
    </p>

    <h2>Age</h2>
    <p>The app is not meant for children under 13.</p>

    <h2>Changes</h2>
    <p>
      If this policy changes, the date above is updated, and significant changes are
      announced in advance, in the app or by email.
    </p>
  </LegalPage>
);
