export const accountStatusTemplate = (isActivated: boolean, motif?: string) => {
  const title = isActivated ? "Activation de votre compte" : "Désactivation de votre compte";
  const mainColor = isActivated ? "#2363d1" : "#d12323";
  const message = isActivated
    ? `Votre compte <strong>BRICOLA</strong> a été <strong style="color: ${mainColor};">activé avec succès</strong>. Vous pouvez désormais accéder à tous nos services.`
    : `Votre compte <strong>BRICOLA</strong> a été <strong style="color: ${mainColor};">désactivé</strong>.`;

  const motifSection = !isActivated && motif
    ? `
      <tr>
        <td style="font-size: 14px; color: #333;">
          Raison de la désactivation :
        </td>
      </tr>
      <tr>
        <td align="center">
          <div style="display: inline-block; padding: 12px 24px; background-color: #ff4d4f; color: #ffffff; font-size: 16px; border-radius: 6px;">
            ${motif}
          </div>
        </td>
      </tr>
      `
    : "";

  const followUp = isActivated
    ? "Si vous avez besoin d'aide ou de plus d'informations, n'hésitez pas à nous contacter."
    : "Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez contester cette décision, contactez notre support.";

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="600" cellpadding="20" cellspacing="0" style="background-color: #ffffff; margin-top: 30px; border-radius: 8px;">
            <tr>
              <td align="center" style="font-size: 28px; font-weight: bold; color: ${mainColor};">BRICOLA</td>
            </tr>
            <tr>
              <td align="center" style="font-size: 18px; color: #333;">${title}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #333;">
                Bonjour,<br /><br />
                ${message}
              </td>
            </tr>
            ${motifSection}
            <tr>
              <td style="font-size: 14px; color: #333; padding-top: 20px;">
                ${followUp}
              </td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #888; text-align: center;">
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
</html>`;
};
