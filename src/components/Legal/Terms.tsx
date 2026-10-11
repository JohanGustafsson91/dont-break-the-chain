import { Link } from "react-router-dom";
import { LEGAL } from "../../shared/legal";
import { useLanguage, useMessages } from "../../i18n/i18n";
import { LegalPage } from "./LegalPage";
import { legalMessages } from "./messages";

const email = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

// Plain words on purpose. The limitation of liability is narrow and names its scope:
// a court sets aside an unfair term as a whole rather than trimming it, so a blanket
// "any damage" would risk losing even the data-loss part. What the law doesn't allow
// to be limited is named, so the rest of the clause stays valid.
const english = (
  <>
    <p className="LegalPage-summary">
      In short: Don't Break The Chain is a free hobby project that you use at your own
      risk. By signing in you accept these terms.
    </p>

    <h2>The app</h2>
    <p>
      A free habit tracker that I, {LEGAL.controllerName}, made and run myself, as a
      private individual in Sweden. There is no company behind it, no paid plan and no ads.
    </p>

    <h2>Your account</h2>
    <p>
      You need to be at least 13; if you're under 18, ask a parent or guardian first. You
      sign in with Google, GitHub or an email and password, and you're responsible for
      keeping that account and password safe. If you first signed in with GitHub and later sign in with
      Google using the same Gmail address, your account continues with Google and GitHub
      sign-in stops working for it; your habits stay.
    </p>

    <h2>Your content</h2>
    <p>
      What you write is yours. The app only uses it to run the app for you, as described
      in the <Link to="/privacy">privacy policy</Link>. Don't use the app for anything
      illegal, or to store sensitive information about other people.
    </p>

    <h2>Play fair</h2>
    <p>
      Don't try to access other people's data, overload the app or run bots against it.
      Accounts that do can be blocked or deleted.
    </p>

    <h2>No guarantees</h2>
    <p>
      The app is provided as is. It can have bugs, be down, change or shut down, and data
      can be lost. Export what matters to you from the account menu. You use the app at
      your own risk.
    </p>

    <h2>Liability</h2>
    <p>
      The app is free, so as far as the law allows I'm not liable for lost data, indirect
      damage or other loss from using the app or not being able to use it. This doesn't
      limit liability for intent or gross negligence or for personal injury, or your
      rights as a consumer or under data protection law.
    </p>

    <h2>Not advice</h2>
    <p>Chains, statistics and tips in the app are not medical or other professional advice.</p>

    <h2>Changes and ending</h2>
    <p>
      These terms can change, for example for new features or new laws. Important changes
      are announced in advance in the app or by email; if you don't agree, you can delete
      your account before they apply. You can stop using the app and delete your account
      at any time, from the account menu or by emailing {email}. If the app shuts down,
      I'll tell you at least 30 days in advance so you can export your data, unless that's
      impossible for reasons I can't control.
    </p>

    <h2>Law</h2>
    <p>
      Swedish law applies. If you live in another EU country, you keep the consumer
      protection of the country you live in.
    </p>
  </>
);

const swedish = (
  <>
    <p className="LegalPage-summary">
      Kort sagt: Don't Break The Chain är ett gratis hobbyprojekt som du använder på egen
      risk. Genom att logga in godkänner du de här villkoren.
    </p>

    <h2>Appen</h2>
    <p>
      En gratis vaneapp som jag, {LEGAL.controllerName}, har gjort och driver själv, som
      privatperson i Sverige. Det finns inget företag bakom, ingen betalversion och ingen
      reklam.
    </p>

    <h2>Ditt konto</h2>
    <p>
      Du måste vara minst 13 år; är du under 18, fråga en förälder eller vårdnadshavare
      först. Du loggar in med Google, GitHub eller e-post och lösenord, och du ansvarar för
      att kontot och lösenordet är säkra. Om du först loggade in med GitHub och senare loggar in via
      Google med samma Gmail-adress kopplas ditt konto till Google i stället, och
      inloggningen med GitHub slutar fungera för det. Dina vanor finns kvar.
    </p>

    <h2>Ditt innehåll</h2>
    <p>
      Det du skriver är ditt. Appen använder det bara för att driva appen åt dig, enligt{" "}
      <Link to="/privacy">integritetspolicyn</Link>. Använd inte appen till något olagligt,
      eller för att spara känsliga uppgifter om andra.
    </p>

    <h2>Schysst användning</h2>
    <p>
      Försök inte komma åt andras data, överbelasta appen eller köra botar mot den. Konton
      som gör det kan stängas av eller raderas.
    </p>

    <h2>Inga garantier</h2>
    <p>
      Appen tillhandahålls i befintligt skick. Den kan ha buggar, ligga nere, ändras eller
      läggas ner, och data kan försvinna. Exportera det som är viktigt för dig från
      kontomenyn. Du använder appen på egen risk.
    </p>

    <h2>Ansvar</h2>
    <p>
      Appen är gratis, så i den mån lagen tillåter ansvarar jag inte för förlorad data,
      indirekt skada eller annan förlust av att du använder appen eller inte kan använda
      den. Det begränsar inte ansvar vid uppsåt eller grov vårdslöshet eller för
      personskada, eller dina rättigheter som konsument eller enligt
      dataskyddslagstiftningen.
    </p>

    <h2>Ingen rådgivning</h2>
    <p>Kedjor, statistik och tips i appen är inte medicinsk eller annan professionell rådgivning.</p>

    <h2>Ändringar och avslut</h2>
    <p>
      Villkoren kan ändras, till exempel vid nya funktioner eller nya lagkrav. Viktiga
      ändringar meddelas i förväg i appen eller via mejl; håller du inte med kan du radera
      ditt konto innan de börjar gälla. Du kan när som helst sluta använda appen och radera
      ditt konto, från kontomenyn eller genom att mejla {email}. Om appen läggs ner
      meddelar jag det minst 30 dagar i förväg så att du hinner exportera din data, om det
      inte är omöjligt av skäl jag inte kan påverka.
    </p>

    <h2>Lag</h2>
    <p>
      Svensk lag gäller. Bor du i ett annat EU-land behåller du konsumentskyddet i landet
      där du bor.
    </p>
  </>
);

export const Terms = () => {
  const t = useMessages(legalMessages);
  const { language } = useLanguage();
  return <LegalPage title={t.termsTitle}>{language === "sv" ? swedish : english}</LegalPage>;
};
