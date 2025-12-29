/**
 * Templates d'email pour les invitations
 */

export interface InviteEmailData {
  email: string;
  inviteUrl: string;
  aorName?: string;
  expiresInDays?: number;
}

/**
 * Template HTML pour l'email d'invitation réseau
 */
export function getNetworkInviteEmailTemplate(data: InviteEmailData): string {
  const { email, inviteUrl, aorName = "Authority of Record", expiresInDays = 7 } = data;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation à rejoindre notre réseau</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center; background-color: #0070f3;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px;">Invitation Partenariat</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 20px; background-color: #ffffff; max-width: 600px; margin: 0 auto;">
        <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 20px;">Bonjour,</h2>
        
        <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
          Vous avez été invité(e) par <strong>${aorName}</strong> à rejoindre notre réseau de partenaires en tant que sous-traitant (Subcontractor).
        </p>
        
        <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
          Cette invitation vous permettra de créer votre entreprise sur la blockchain Sui et de commencer à collaborer avec ${aorName}.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" 
             style="display: inline-block; padding: 15px 30px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
            Accepter l'invitation
          </a>
        </div>
        
        <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
          <strong>Note importante :</strong> Cette invitation est valable pendant ${expiresInDays} jours. Après cette période, vous devrez demander une nouvelle invitation.
        </p>
        
        <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
          Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
          <a href="${inviteUrl}" style="color: #0070f3; word-break: break-all;">${inviteUrl}</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #f5f5f5; color: #999999; font-size: 12px;">
        <p style="margin: 0;">Cet email a été envoyé par ${aorName} via la plateforme Tanzanite.</p>
        <p style="margin: 10px 0 0 0;">Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Version texte simple de l'email (pour les clients qui ne supportent pas HTML)
 */
export function getNetworkInviteEmailText(data: InviteEmailData): string {
  const { email, inviteUrl, aorName = "Authority of Record", expiresInDays = 7 } = data;

  return `
Bonjour,

Vous avez été invité(e) par ${aorName} à rejoindre notre réseau de partenaires en tant que sous-traitant (Subcontractor).

Cette invitation vous permettra de créer votre entreprise sur la blockchain Sui et de commencer à collaborer avec ${aorName}.

Pour accepter l'invitation, cliquez sur le lien suivant ou copiez-le dans votre navigateur :

${inviteUrl}

Note importante : Cette invitation est valable pendant ${expiresInDays} jours. Après cette période, vous devrez demander une nouvelle invitation.

Cet email a été envoyé par ${aorName} via la plateforme Tanzanite.
Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
  `.trim();
}

