export const deleteAccountTemplate = (motif?: string) => `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Suppression de votre compte</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table width="600" cellpadding="20" cellspacing="0" style="background-color: #ffffff; margin-top: 30px; border-radius: 8px;">
            <tr>
              <td align="center" style="font-size: 28px; font-weight: bold; color: #d12323;">BRICOLA</td>
            </tr>
            <tr>
              <td align="center" style="font-size: 18px; color: #333;">Suppression de votre compte</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #333;">
                Bonjour,<br /><br />
                Nous vous confirmons que votre compte <strong>BRICOLA</strong> a été <strong style="color: #d12323;">supprimé définitivement</strong>. Toutes les informations associées à ce compte ont été supprimées de manière sécurisée conformément à notre politique de confidentialité.
              </td>
            </tr>
            ${motif ? `
            <tr>
              <td style="font-size: 14px; color: #333;">
                Raison de la suppression :
              </td>
            </tr>
            <tr>
              <td align="center">
                <div style="display: inline-block; padding: 12px 24px; background-color: #ff4d4f; color: #ffffff; font-size: 16px; border-radius: 6px;">
                  ${motif}
                </div>
              </td>
            </tr>` : ""}
            <tr>
              <td style="font-size: 14px; color: #333; padding-top: 20px;">
                Si vous avez des questions concernant cette suppression ou souhaitez récupérer des informations avant la clôture définitive, merci de nous contacter rapidement.
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
