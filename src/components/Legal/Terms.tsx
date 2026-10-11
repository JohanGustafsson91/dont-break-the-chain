import { Link } from "react-router-dom";
import { LEGAL } from "../../shared/legal";
import { useLanguage, useMessages } from "../../i18n/i18n";
import { LegalPage } from "./LegalPage";
import { legalMessages } from "./messages";

const email = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

const english = (
  <>
    <p>
      By signing in to Don't Break The Chain you accept these terms. Please read them
      together with the <Link to="/privacy">privacy policy</Link>.
    </p>

    <h2>The service</h2>
    <p>
      Don't Break The Chain is a free habit tracker run by a private individual in
      Sweden (the operator, named in the <Link to="/privacy">privacy policy</Link>). There is no company behind it and no paid plan.
    </p>

    <h2>Who can use it</h2>
    <p>
      You must be at least 13 years old. You need an account with a supported sign-in
      provider (currently Google or GitHub), and you are responsible for keeping that account secure.
    </p>

    <h2>Your content</h2>
    <p>
      What you write is yours. You allow the app to store and show it to you, only to
      provide the service. Don't store sensitive information about other people, or
      anything unlawful.
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
      same way, or keep your data forever. Export a copy of anything that matters to
      you from the account menu.
    </p>

    <h2>Not advice</h2>
    <p>
      The app, including its streaks, statistics and patterns, is not medical, health
      or professional advice.
    </p>

    <h2>Liability</h2>
    <p>
      To the extent permitted by applicable law, the operator is not liable
      for indirect damage, loss of data, loss of profit or similar loss arising from
      your use of the service. Nothing in these terms limits liability that cannot be
      limited by law, such as for intent or gross negligence, your rights as a
      consumer, or your rights under data protection law (GDPR article 82).
    </p>

    <h2>Changes and ending</h2>
    <p>
      These terms may change, for example because of new features or legal
      requirements. Significant changes are announced in advance, in the app or by
      email. If you don't agree, you can stop using the service and delete your
      account and data at any time from the account menu, or by emailing {email}.
    </p>
    <p>
      If the service shuts down, users get at least 30 days' notice to export their
      data, unless that is impossible for reasons outside the operator's
      control.
    </p>

    <h2>Law</h2>
    <p>
      Swedish law applies. If you are a consumer living in another EU country, you
      keep the mandatory protection of the law where you live.
    </p>
  </>
);

const swedish = (
  <>
    <p>
      Genom att logga in i Don't Break The Chain godkänner du de här villkoren. Läs dem
      tillsammans med <Link to="/privacy">integritetspolicyn</Link>.
    </p>

    <h2>Tjänsten</h2>
    <p>
      Don't Break The Chain är en gratis app för att följa vanor, som drivs av en
      privatperson i Sverige (operatören, som namnges i{" "}
      <Link to="/privacy">integritetspolicyn</Link>). Det finns inget företag bakom och
      ingen betalversion.
    </p>

    <h2>Vem som får använda den</h2>
    <p>
      Du måste vara minst 13 år. Du behöver ett konto hos en inloggningstjänst som
      stöds (just nu Google eller GitHub), och du ansvarar för att det kontot är säkert.
    </p>

    <h2>Ditt innehåll</h2>
    <p>
      Det du skriver är ditt. Du låter appen spara och visa det för dig, bara för att
      kunna tillhandahålla tjänsten. Spara inte känsliga uppgifter om andra personer,
      eller något olagligt.
    </p>

    <h2>Schysst användning</h2>
    <p>
      Försök inte komma åt andra användares data, överbelasta eller störa tjänsten,
      eller använda den automatiserat. Konton som gör det kan stängas av.
    </p>

    <h2>Inga garantier</h2>
    <p>
      Tjänsten tillhandahålls i befintligt skick och i den mån den är tillgänglig, utan
      garantier av något slag. Det finns ingen garanti för att den alltid är
      tillgänglig, fortsätter fungera på samma sätt eller sparar din data för alltid.
      Exportera en kopia av det som är viktigt för dig från kontomenyn.
    </p>

    <h2>Ingen rådgivning</h2>
    <p>
      Appen, inklusive kedjor, statistik och mönster, utgör inte medicinsk
      rådgivning, hälsorådgivning eller annan professionell rådgivning.
    </p>

    <h2>Ansvar</h2>
    <p>
      I den mån tillämplig lag tillåter ansvarar operatören inte för indirekt skada,
      förlust av data, utebliven vinst eller liknande förlust som uppstår när du
      använder tjänsten. Inget i de här villkoren begränsar ansvar som inte får
      begränsas enligt lag, till exempel vid uppsåt eller grov vårdslöshet, dina
      rättigheter som konsument eller dina rättigheter enligt dataskyddslagstiftningen
      (GDPR artikel 82).
    </p>

    <h2>Ändringar och avslut</h2>
    <p>
      Villkoren kan ändras, till exempel på grund av nya funktioner eller krav i lag.
      Väsentliga ändringar meddelas i förväg, i appen eller via mejl. Om du inte håller med
      kan du sluta använda tjänsten och när som helst radera ditt konto och din data
      från kontomenyn, eller genom att mejla {email}.
    </p>
    <p>
      Om tjänsten läggs ner får användarna minst 30 dagars varsel för att exportera sin
      data, om det inte är omöjligt av skäl utanför operatörens kontroll.
    </p>

    <h2>Lag</h2>
    <p>
      Svensk lag gäller. Om du är konsument och bor i ett annat EU-land behåller du det
      tvingande skyddet i lagen där du bor.
    </p>
  </>
);

export const Terms = () => {
  const t = useMessages(legalMessages);
  const { language } = useLanguage();
  return <LegalPage title={t.termsTitle}>{language === "sv" ? swedish : english}</LegalPage>;
};
