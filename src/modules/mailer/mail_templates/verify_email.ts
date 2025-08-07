export const verifyEmailTemplate = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Vérification de votre adresse email</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="600" cellpadding="20" cellspacing="0" style="background-color: #ffffff; margin-top: 30px; border-radius: 8px;">
            <tr>
              <td align="center" style="font-size: 28px; font-weight: bold; color: #2363d1;">BRICOLA</td>
            </tr>
            <tr>
              <td align="center" style="font-size: 18px; color: #333;">Vérification de votre adresse email</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #333;">
                Bonjour,<br /><br />
                Bienvenue sur <strong>BRICOLA</strong> ! Pour finaliser votre inscription et activer votre compte, veuillez saisir le code de vérification ci-dessous dans l’interface de confirmation :
              </td>
            </tr>
            <tr>
              <td align="center">
                <div style="display: inline-block; padding: 12px 24px; background-color: #2363d1; color: #ffffff; font-size: 22px; font-weight: bold; border-radius: 6px;">
                  &CODE&
                </div>
              </td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #333;">
                Si vous ne parvenez pas à saisir le code, vous pouvez également le copier et le coller :
              </td>
            </tr>
            <tr>
              <td align="center">
                <input value="&CODE&" readonly style="padding: 10px; width: 80%; font-size: 18px; text-align: center; border: 1px solid #ccc; border-radius: 4px;" />
              </td>
            </tr>
            <tr>
              <td>
                <div style="background-color: #fff3cd; padding: 12px; border-left: 5px solid #ffecb5; border-radius: 4px; font-size: 13px; color: #664d03;">
                  <strong>Informations importantes :</strong>
                  <ul style="padding-left: 20px;">
                    <li>Il ne peut être utilisé qu’une seule fois.</li>
                    <li>Si vous n’avez pas demandé cette vérification, ignorez cet email.</li>
                  </ul>
                </div>
              </td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #888; text-align: center;">
                Si vous rencontrez des difficultés ou si vous n’êtes pas à l’origine de cette demande, n’hésitez pas à contacter notre équipe support.
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size: 12px; color: #888;">
                <p>Ce mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
                <a href="#" style="color: #2363d1; text-decoration: none;">Nous contacter</a> &nbsp;|&nbsp;
                <a href="#" style="color: #2363d1; text-decoration: none;">Politique de confidentialité</a>
                <p style="margin-top: 10px;">© 2025 BRICOLA. Tous droits réservés.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;