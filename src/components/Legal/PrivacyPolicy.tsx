import { LEGAL } from "../../shared/legal";
import { useLanguage, useMessages } from "../../i18n/i18n";
import { LegalPage } from "./LegalPage";
import { legalMessages } from "./messages";

const email = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

// The summary first, for everyone; the details after it are what GDPR (art. 13)
// requires: who, what, why and on what basis, who else, transfers, how long, rights.
const english = (
  <>
    <div className="LegalPage-summary">
      <strong>In short</strong>
      <ul>
        <li>The app stores your account details and your habits, only to run the app.</li>
        <li>No one else sees your habits. Nothing is sold, and there are no ads and no tracking.</li>
        <li>Your habits are stored with Google Firebase in the EU. Sign-in, reminders and encrypted backups may also be handled in the US.</li>
        <li>You can export your data or delete your account at any time, from the account menu.</li>
      </ul>
    </div>

    <h2>Who is responsible</h2>
    <p>
      The data controller is {LEGAL.controllerName}, a private individual in Sweden who
      runs the app for free. Contact: {email}.
    </p>

    <h2>What is stored</h2>
    <ul>
      <li>
        <strong>Your account:</strong> the name, email address, profile picture link and
        account ID that Google or GitHub shares when you sign in, or your email address if
        you sign up with a password. An email account is verified through a link before it
        can be used. Firebase stores the password hashed (turned into something that can't
        be turned back), so no one can read it, not even me.
      </li>
      <li>
        <strong>Your habits:</strong> names, descriptions, goals, the days you mark and
        your notes.
      </li>
      <li>
        <strong>Reminders, only if you turn them on:</strong> the times you chose (up to
        three), your time zone, the language, a push token for each device, and numbers
        about the day (habits left, chain length, the last day everything was done, the
        last reminder sent). That lets a reminder say something specific and arrive at most
        once per chosen time. Never habit names or notes.
      </li>
      <li>
        <strong>On your device:</strong> the sign-in token, your language choice, and the
        push token if reminders are on. No tracking cookies.
      </li>
    </ul>
    <p>
      Habit names and notes can say something about your health, like “take medication”.
      You decide what to write. It's never shown to others. I only look at it if you ask
      for help with a problem, to stop misuse, or if the law requires it.
    </p>

    <h2>Why, and on what legal basis</h2>
    <p>
      To give you the app you signed up for (a contract, GDPR art. 6(1)(b)). The account
      details are needed to sign in; everything you write is optional. To deliver and
      protect the site, technical data such as your IP address is processed, also for
      visitors who never sign in, and to stop misuse your content may be looked at
      (legitimate interest, art. 6(1)(f)); you can object to that. No automated decisions
      or profiling.
    </p>

    <h2>Who else is involved</h2>
    <ul>
      <li>
        <strong>Google Firebase</strong> handles sign-in (including the emails to confirm
        your address or reset your password), the database (in the EU, eur3), hosting and
        push messages, as a processor under Google's data processing terms.
      </li>
      <li>
        <strong>Google or GitHub</strong>, if you sign in with one, is an independent
        controller: it learns that you use the app, and your profile picture is loaded from
        it.
      </li>
      <li>
        <strong>GitHub</strong> runs the scheduled jobs that send reminders and back up
        the database, as a processor. The backups are encrypted before they're stored, and
        only I can open them.
      </li>
      <li>
        <strong>Your browser's push service</strong> (Apple's, Google's or Mozilla's)
        delivers the reminders, which say only how many habits are left and how long your
        chain is.
      </li>
    </ul>
    <p>
      Sign-in, push messages and the scheduled jobs may be handled in the US. Such transfers
      rely on the EU-US Data Privacy Framework and the European Commission's Standard
      Contractual Clauses.
    </p>

    <h2>How long</h2>
    <p>
      Until you delete your account. Reminder settings are deleted when you turn reminders
      off, and a device's push token when you log out there. The database is backed up
      every day, encrypted, and each backup is kept for 30 days and then deleted. Google keeps technical logs (such as IP addresses) for a limited time.
    </p>

    <h2>Your rights</h2>
    <p>
      You can get a copy of your data, have it corrected or deleted, restrict or object to
      its use, and take it with you. You can export your data and delete your account
      yourself from the account menu (top right). Deleting removes your habits, days, notes and reminder
      settings, and then your account. Copies stay in the encrypted backups until they
      expire after 30 days; they're only used to recover from a failure, and data you
      deleted is never restored. Google or GitHub keeps its own record that
      you used the app; you can remove the app's access in your account settings there.
      For anything else, email {email}. You get an answer within a month. You can also
      complain to the Swedish Authority for Privacy Protection (IMY),{" "}
      <a href="https://www.imy.se">imy.se</a>.
    </p>

    <h2>Security</h2>
    <p>Access rules in the database make sure no other user can read or change your habits.</p>

    <h2>Children</h2>
    <p>The app is not meant for children under 13.</p>

    <h2>Changes</h2>
    <p>
      If this policy changes, the date above is updated; important changes are announced in
      advance in the app or by email.
    </p>
  </>
);

const swedish = (
  <>
    <div className="LegalPage-summary">
      <strong>Kort sagt</strong>
      <ul>
        <li>Appen sparar dina kontouppgifter och dina vanor, bara för att appen ska fungera.</li>
        <li>Ingen annan ser dina vanor. Inget säljs, och det finns ingen reklam och ingen spårning.</li>
        <li>Dina vanor lagras hos Google Firebase i EU. Inloggning, påminnelser och krypterade säkerhetskopior kan även hanteras i USA.</li>
        <li>Du kan exportera din data eller radera ditt konto när du vill, från kontomenyn.</li>
      </ul>
    </div>

    <h2>Vem som ansvarar</h2>
    <p>
      Personuppgiftsansvarig är {LEGAL.controllerName}, en privatperson i Sverige som
      driver appen gratis. Kontakt: {email}.
    </p>

    <h2>Vad som sparas</h2>
    <ul>
      <li>
        <strong>Ditt konto:</strong> namn, e-postadress, länk till profilbild och konto-id
        som Google eller GitHub delar när du loggar in, eller din e-postadress om du
        registrerar dig med lösenord. Ett e-postkonto verifieras med en länk innan det kan
        användas. Firebase lagrar lösenordet hashat (omvandlat så att det inte går att läsa
        ut), så ingen kan läsa det, inte ens jag.
      </li>
      <li>
        <strong>Dina vanor:</strong> namn, beskrivningar, mål, dagarna du markerar och dina
        anteckningar.
      </li>
      <li>
        <strong>Påminnelser, bara om du slår på dem:</strong> tiderna du valt (upp till
        tre), din tidszon, språket, en push-token per enhet och siffror om dagen (vanor
        kvar, kedjans längd, senaste dagen allt var klart, senaste påminnelsen). Det gör att
        påminnelsen kan bli konkret och kommer högst en gång per vald tid. Aldrig namn på
        vanor eller anteckningar.
      </li>
      <li>
        <strong>På din enhet:</strong> inloggningstoken, ditt språkval och push-token om
        påminnelser är på. Inga spårningscookies.
      </li>
    </ul>
    <p>
      Namn på vanor och anteckningar kan säga något om din hälsa, som ”ta medicin”. Du
      bestämmer vad du skriver. Det visas aldrig för andra. Jag tittar bara på det om du ber
      om hjälp med ett problem, för att stoppa missbruk eller om lagen kräver det.
    </p>

    <h2>Varför, och med vilken rättslig grund</h2>
    <p>
      För att ge dig appen du registrerat dig för (avtal, GDPR artikel 6.1 b).
      Kontouppgifterna behövs för att logga in; allt du skriver är frivilligt. För att
      leverera och skydda webbplatsen behandlas tekniska uppgifter som din IP-adress, även
      för besökare som aldrig loggar in, och för att stoppa missbruk kan ditt innehåll
      granskas (berättigat intresse, artikel 6.1 f); du kan invända mot det. Inget
      automatiserat beslutsfattande och ingen profilering.
    </p>

    <h2>Vilka mer som är inblandade</h2>
    <ul>
      <li>
        <strong>Google Firebase</strong> står för inloggning (även mejlen för att bekräfta
        din adress eller återställa lösenordet), databasen (i EU, eur3), drift och
        pushnotiser, som personuppgiftsbiträde enligt Googles
        personuppgiftsbiträdesavtal.
      </li>
      <li>
        <strong>Google eller GitHub</strong>, om du loggar in med någon av dem, är
        självständigt personuppgiftsansvarig: den får veta att du använder appen, och din profilbild hämtas
        därifrån.
      </li>
      <li>
        <strong>GitHub</strong> kör de schemalagda jobben som skickar påminnelser och
        säkerhetskopierar databasen, som personuppgiftsbiträde. Säkerhetskopiorna krypteras
        innan de sparas, och bara jag kan öppna dem.
      </li>
      <li>
        <strong>Din webbläsares pushtjänst</strong> (Apples, Googles eller Mozillas)
        levererar påminnelserna, som bara säger hur många vanor som är kvar och hur lång
        din kedja är.
      </li>
    </ul>
    <p>
      Inloggning, pushnotiser och de schemalagda jobben kan hanteras i USA. Sådana överföringar
      bygger på ramen för dataskydd mellan EU och USA (EU–US Data Privacy Framework) och
      EU-kommissionens standardavtalsklausuler.
    </p>

    <h2>Hur länge</h2>
    <p>
      Tills du raderar ditt konto. Påminnelseinställningarna raderas när du stänger av
      påminnelser, och en enhets push-token när du loggar ut där. Databasen
      säkerhetskopieras krypterat varje dygn, och varje säkerhetskopia sparas i 30 dagar
      och raderas sedan. Google sparar tekniska loggar
      (som IP-adresser) en begränsad tid.
    </p>

    <h2>Dina rättigheter</h2>
    <p>
      Du kan få en kopia av din data, få den rättad eller raderad, begränsa eller invända
      mot hur den används och ta den med dig. Du kan själv exportera din data och radera
      ditt konto från kontomenyn (uppe till höger). Radering tar bort dina vanor, dagar, anteckningar och
      påminnelseinställningar, och sedan ditt konto. Kopior finns kvar i de krypterade
      säkerhetskopiorna tills de raderas efter 30 dagar; de används bara för att återställa
      efter ett fel, och data du raderat återställs aldrig. Google eller GitHub har kvar
      sin egen uppgift om att du använt appen; du kan ta bort appens åtkomst i dina
      kontoinställningar där. Mejla {email} om du vill något annat. Du får svar inom en månad. Du
      kan också klaga hos Integritetsskyddsmyndigheten (IMY),{" "}
      <a href="https://www.imy.se">imy.se</a>.
    </p>

    <h2>Säkerhet</h2>
    <p>Behörighetsregler i databasen ser till att ingen annan användare kan läsa eller ändra dina vanor.</p>

    <h2>Barn</h2>
    <p>Appen är inte avsedd för barn under 13 år.</p>

    <h2>Ändringar</h2>
    <p>
      Om policyn ändras uppdateras datumet ovan; viktiga ändringar meddelas i förväg i appen
      eller via mejl.
    </p>
  </>
);

export const PrivacyPolicy = () => {
  const t = useMessages(legalMessages);
  const { language } = useLanguage();
  return <LegalPage title={t.privacyTitle}>{language === "sv" ? swedish : english}</LegalPage>;
};
