import { Link } from "react-router-dom";
import { LEGAL } from "../../shared/legal";
import { useLanguage, useMessages } from "../../i18n/i18n";
import { LegalPage } from "./LegalPage";
import { legalMessages } from "./messages";

const email = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

// Plain words on purpose: a short, clear limitation of liability that people have read
// holds better than a long one they haven't. What the law doesn't allow to be limited
// is named, so the rest of the clause stays valid.
const english = (
  <>
    <p className="LegalPage-summary">
      In short: Don't Break The Chain is a free hobby project. Use it as you like, at your
      own risk. By signing in you accept these terms.
    </p>

    <h2>The app</h2>
    <p>
      A free habit tracker, made and run by me, a private individual in Sweden (named in
      the <Link to="/privacy">privacy policy</Link>). There is no company behind it, no
      paid plan and no ads.
    </p>

    <h2>Your account</h2>
    <p>
      You need to be at least 13 and sign in with a supported account (Google or GitHub).
      Keep that account safe. If you first signed in with GitHub and later sign in with
      Google using the same Gmail address, your account continues with Google; your habits
      stay.
    </p>

    <h2>Your content</h2>
    <p>
      What you write is yours. The app only stores it to show it to you. Don't use the app
      for anything illegal, or to store sensitive information about other people.
    </p>

    <h2>Play fair</h2>
    <p>
      Don't try to reach other people's data, overload the app or use it with bots.
      Accounts that do can be shut down.
    </p>

    <h2>No guarantees</h2>
    <p>
      The app is provided as it is. It can have bugs, be down, change or shut down, and
      data can be lost. Export what matters to you from the account menu. You use the app
      at your own risk.
    </p>

    <h2>Liability</h2>
    <p>
      As far as the law allows, I'm not liable for lost data or any other damage from
      using the app. This doesn't limit what the law doesn't let me limit: liability for
      intent or gross negligence, your rights as a consumer, or your rights under data
      protection law.
    </p>

    <h2>Not advice</h2>
    <p>Chains, statistics and tips in the app are not medical or other professional advice.</p>

    <h2>Changes and ending</h2>
    <p>
      These terms can change; important changes are announced in advance in the app or by
      email. You can stop using the app and delete your account at any time, from the
      account menu or by emailing {email}. If the app shuts down, you get at least 30 days
      to export your data, unless that's impossible for reasons I can't control.
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
      Kort sagt: Don't Break The Chain är ett gratis hobbyprojekt. Använd det som du vill,
      på egen risk. Genom att logga in godkänner du de här villkoren.
    </p>

    <h2>Appen</h2>
    <p>
      En gratis app för vanor, som görs och drivs av mig, en privatperson i Sverige (namnet
      står i <Link to="/privacy">integritetspolicyn</Link>). Det finns inget företag bakom,
      ingen betalversion och ingen reklam.
    </p>

    <h2>Ditt konto</h2>
    <p>
      Du måste vara minst 13 år och logga in med ett konto som stöds (Google eller GitHub).
      Se till att det kontot är säkert. Om du först loggade in med GitHub och senare loggar
      in med Google med samma Gmail-adress fortsätter ditt konto med Google; dina vanor
      finns kvar.
    </p>

    <h2>Ditt innehåll</h2>
    <p>
      Det du skriver är ditt. Appen sparar det bara för att kunna visa det för dig. Använd
      inte appen till något olagligt, eller för att spara känsliga uppgifter om andra.
    </p>

    <h2>Schysst användning</h2>
    <p>
      Försök inte komma åt andras data, överbelasta appen eller använda den med botar.
      Konton som gör det kan stängas av.
    </p>

    <h2>Inga garantier</h2>
    <p>
      Appen tillhandahålls i befintligt skick. Den kan ha buggar, ligga nere, ändras eller
      läggas ner, och data kan försvinna. Exportera det som är viktigt för dig från
      kontomenyn. Du använder appen på egen risk.
    </p>

    <h2>Ansvar</h2>
    <p>
      I den mån lagen tillåter ansvarar jag inte för förlorad data eller annan skada av att
      du använder appen. Det begränsar inte det som lagen inte låter mig begränsa: ansvar
      vid uppsåt eller grov vårdslöshet, dina rättigheter som konsument eller dina
      rättigheter enligt dataskyddslagstiftningen.
    </p>

    <h2>Ingen rådgivning</h2>
    <p>Kedjor, statistik och tips i appen är inte medicinsk eller annan professionell rådgivning.</p>

    <h2>Ändringar och avslut</h2>
    <p>
      Villkoren kan ändras; viktiga ändringar meddelas i förväg i appen eller via mejl. Du
      kan när som helst sluta använda appen och radera ditt konto, från kontomenyn eller
      genom att mejla {email}. Om appen läggs ner får du minst 30 dagar på dig att
      exportera din data, om det inte är omöjligt av skäl jag inte kan påverka.
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
