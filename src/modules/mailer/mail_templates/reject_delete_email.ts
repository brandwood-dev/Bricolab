export const rejectAccountDeletionTemplate = (motif?: string) => `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Rejet de la demande de suppression de compte</title>
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
              <td align="center" style="font-size: 18px; color: #333;">Rejet de votre demande de suppression de compte</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #333;">
                Bonjour,<br /><br />
                Nous avons bien reçu votre demande de suppression de compte <strong>BRICOLA</strong>. 
                Cependant, après examen, <strong style="color: #d12323;">nous ne pouvons pas donner suite favorable à votre demande pour le moment</strong>.
              </td>
            </tr>
            ${motif ? `
            <tr>
              <td style="font-size: 14px; color: #333;">
                Raison du rejet :
              </td>
            </tr>
            <tr>
              <td align="center">
                <div style="display: inline-block; padding: 12px 24px; background-color: #ff9800; color: #ffffff; font-size: 16px; border-radius: 6px;">
                  ${motif}
                </div>
              </td>
            </tr>` : ""}
            <tr>
              <td style="font-size: 14px; color: #333; padding-top: 20px;">
                Si vous pensez qu'il s'agit d'une erreur ou souhaitez obtenir plus d'informations, merci de nous contacter via notre support.
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
