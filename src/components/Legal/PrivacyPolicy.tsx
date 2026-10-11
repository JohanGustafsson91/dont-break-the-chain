import { LEGAL } from "../../shared/legal";
import { useLanguage, useMessages } from "../../i18n/i18n";
import { LegalPage } from "./LegalPage";
import { legalMessages } from "./messages";

const english = (
  <>
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
        current chain (numbers only, so the reminder can be specific), the language the
        reminder is written in, and a push token for each device that gets reminders. Turning
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
      you. If you choose a language in the account menu, that choice is remembered on
      this device. If you turn on reminders, the browser also keeps this device's push token.
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
  </>
);

const swedish = (
  <>
    <p>
      Den här policyn förklarar vad Don't Break The Chain sparar om dig, varför, och vad
      du kan göra åt det. Den är skriven för att vara kort och lätt att läsa.
    </p>

    <h2>Vem som ansvarar</h2>
    <p>
      Personuppgiftsansvarig (operatören) är {LEGAL.controllerName}, en privatperson i
      Sverige, som driver appen gratis. Kontakt:{" "}
      <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
    </p>

    <h2>Vad som sparas</h2>
    <ul>
      <li>
        <strong>Ditt konto:</strong> namn, e-postadress och länk till profilbild som din
        inloggningstjänst (Google eller GitHub) delar när du loggar in, samt ett
        konto-id. Om du först loggade in med GitHub och senare loggar in med Google med
        samma e-postadress fortsätter ditt konto med Google, och inloggning med GitHub
        slutar fungera för det. Dina vanor finns kvar.
      </li>
      <li>
        <strong>Dina vanor:</strong> deras namn, beskrivningar och mål, vilka dagar du
        markerat och de anteckningar du skriver.
      </li>
      <li>
        <strong>Påminnelser, bara om du slår på dem:</strong> tiden du valt, din tidszon,
        det senaste datum då alla dina vanor var klara för dagen (så att du inte får
        påminnelser de dagar du är klar), datumet för den senaste påminnelsen (så att du
        får högst en om dagen), hur många vanor som är kvar den dagen och längden på din
        längsta pågående kedja (bara siffror, så att påminnelsen kan bli konkret),
        språket påminnelsen skrivs på, och en push-token för varje enhet som får
        påminnelser. Om du stänger av påminnelser på en enhet, loggar ut där eller raderar
        ditt konto tas enhetens token bort.
      </li>
    </ul>
    <p>
      Namn på vanor och anteckningar kan avslöja saker om din hälsa, som ”ta medicin”
      eller ”ingen alkohol”. Du bestämmer vad du skriver, och du kan ändra eller radera
      det när som helst. Det visas aldrig för andra användare. Operatören kan tekniskt
      komma åt databasen, men tittar inte på ditt innehåll utom för att åtgärda ett
      problem du rapporterar, utreda missbruk av tjänsten eller när lagen kräver det.
      Undvik att skriva sådant du inte vill ska sparas.
    </p>

    <h2>Varför det sparas</h2>
    <p>
      För att tillhandahålla appen åt dig: för att logga in dig, visa och spara dina
      vanor och, om du slår på dem, skicka påminnelser. Den rättsliga grunden är att det
      är nödvändigt för att tillhandahålla tjänsten du bett om (GDPR artikel 6.1 b).
      Dina kontouppgifter behövs för att använda appen: utan dem kan du inte logga in.
      Allt du skriver i vanor och anteckningar är frivilligt.
    </p>
    <p>
      När du besöker webbplatsen behandlas tekniska uppgifter som din IP-adress för att
      leverera sidorna och hålla tjänsten säker, även för besökare som aldrig loggar in.
      Uppgifter kan också granskas för att förebygga och utreda missbruk. Den rättsliga
      grunden för båda är det berättigade intresset av att driva en säker tjänst (GDPR
      artikel 6.1 f), och du har rätt att invända mot det.
    </p>
    <p>
      Din data säljs aldrig och används aldrig för reklam, och appen delar den aldrig med
      någon för deras egna syften. Det förekommer inget automatiserat beslutsfattande
      och ingen profilering.
    </p>

    <h2>Vilka mer som är inblandade</h2>
    <ul>
      <li>
        <strong>Google (Firebase)</strong> står för inloggning, databas, drift och
        pushnotiser (Firebase Cloud Messaging), som personuppgiftsbiträde enligt
        Googles personuppgiftsbiträdesavtal. Dina vanor lagras i Googles europeiska multiregion
        (eur3).
      </li>
      <li>
        <strong>Google eller GitHub</strong> är den inloggningstjänst du väljer. I den
        rollen agerar den för egen räkning, enligt sina egna integritetsvillkor, separat
        från Googles roll som Firebase-biträde ovan. När du loggar in delar den ditt namn,
        din e-postadress och länken till din profilbild med appen, och får veta att du
        använder appen. Din profilbild hämtas från tjänstens servrar.
      </li>
      <li>
        <strong>GitHub</strong> kör det schemalagda jobbet som skickar påminnelser, som
        personuppgiftsbiträde. Jobbet läser bara påminnelseinställningar, aldrig dina
        vanor eller anteckningar.
      </li>
      <li>
        <strong>Din webbläsares push-tjänst</strong> (till exempel Apples, Googles eller
        Mozillas) levererar varje påminnelse till din enhet. Påminnelser säger hur många
        vanor som är kvar och hur lång din kedja är; de innehåller aldrig namn på dina
        vanor eller anteckningar.
      </li>
    </ul>

    <h2>Överföring utanför EU</h2>
    <p>
      Firebase Authentication och Cloud Messaging kan behandla kontouppgifter och
      push-tokens i USA, och GitHub kör påminnelsejobbet där. Sådana överföringar bygger
      på ramen för dataskydd mellan EU och USA (EU–US Data Privacy Framework) och
      EU-kommissionens standardavtalsklausuler.
    </p>

    <h2>Hur länge det sparas</h2>
    <p>
      Tills du raderar ditt konto eller ber om att få det raderat. Google sparar tekniska
      loggar (som IP-adresser) en begränsad tid för säkerhet och drift.
    </p>

    <h2>Dina rättigheter</h2>
    <p>
      Du kan begära en kopia av din data, få den rättad eller raderad, begränsa eller
      invända mot behandlingen och få ut den i ett flyttbart format. Du kan själv
      exportera din data och radera ditt konto från kontomenyn (din bild uppe till
      höger). Radering tar bort dina vanor, dagar, anteckningar och
      påminnelseinställningar för gott, och sedan ditt konto. Din inloggningstjänst har
      kvar sin egen uppgift om att du använt appen; du kan ta bort appens åtkomst i
      inställningarna för ditt Google- eller GitHub-konto. Googles tekniska loggar
      försvinner av sig själva. Om du inte längre kan logga in, eller för något annat,
      mejla <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> så hanteras
      det inom en månad. Du kan också klaga hos Integritetsskyddsmyndigheten (IMY),{" "}
      <a href="https://www.imy.se">imy.se</a>.
    </p>

    <h2>Cookies och spårning</h2>
    <p>
      Det finns inga analysverktyg, ingen reklam och inga spårningscookies. Inloggningen sparar
      en token i webbläsarens lagring, som appen behöver för att fungera.
      Inloggningssidan kommer också ihåg, bara på den här enheten, att du godkänt de
      gällande villkoren, så att du inte behöver kryssa i rutan varje gång; den
      innehåller inget som identifierar dig. Om du väljer språk i kontomenyn sparas
      valet på den här enheten. Om du slår på påminnelser sparar webbläsaren också
      enhetens push-token. Inget av detta kräver samtycke.
    </p>

    <h2>Säkerhet</h2>
    <p>
      Behörighetsregler i databasen ser till att ingen annan användare kan läsa eller
      ändra dina vanor.
    </p>

    <h2>Ålder</h2>
    <p>Appen är inte avsedd för barn under 13 år.</p>

    <h2>Ändringar</h2>
    <p>
      Om policyn ändras uppdateras datumet ovan, och väsentliga ändringar meddelas i förväg, i
      appen eller via mejl.
    </p>
  </>
);

export const PrivacyPolicy = () => {
  const t = useMessages(legalMessages);
  const { language } = useLanguage();
  return <LegalPage title={t.privacyTitle}>{language === "sv" ? swedish : english}</LegalPage>;
};
