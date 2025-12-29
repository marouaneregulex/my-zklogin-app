/**
 * Service d'envoi d'email avec Brevo (anciennement Sendinblue)
 * 
 * Configuration requise :
 * - BREVO_API_KEY : Votre clé API Brevo (obtenue depuis https://app.brevo.com/settings/keys/api)
 *   - Pour API v3 : clé commençant par "xkeysib-"
 *   - Pour SMTP : clé commençant par "xsmtpsib-"
 * - EMAIL_FROM : L'adresse email de l'expéditeur (doit être vérifiée dans Brevo)
 * - BREVO_SMTP_LOGIN : (Optionnel pour SMTP) Le login SMTP (ex: 9eeba4001@smtp-brevo.com)
 *   Si non fourni, utilise EMAIL_FROM comme login
 */

import { getNetworkInviteEmailTemplate, getNetworkInviteEmailText, type InviteEmailData } from "./templates";
import * as brevo from "@getbrevo/brevo";
import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Envoie un email avec Brevo (API v3 ou SMTP)
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || process.env.BREVO_EMAIL_FROM;

  // Si Brevo n'est pas configuré, simuler l'envoi
  if (!brevoApiKey || !emailFrom) {
    console.warn("⚠️ Brevo non configuré - Simulation de l'envoi d'email");
    console.log("=".repeat(60));
    console.log("📧 EMAIL À ENVOYER (SIMULATION)");
    console.log("=".repeat(60));
    console.log("À:", options.to);
    console.log("Sujet:", options.subject);
    console.log("HTML:", options.html.substring(0, 200) + "...");
    console.log("=".repeat(60));
    console.log("💡 Pour activer l'envoi réel, configurez BREVO_API_KEY et EMAIL_FROM dans .env.local");
    console.log("=".repeat(60));
    
    return { success: true, messageId: `simulated-${Date.now()}` };
  }

  // Vérifier le type de clé
  if (brevoApiKey.startsWith("xsmtpsib-")) {
    // Clé SMTP - utiliser Nodemailer avec Brevo SMTP
    return await sendEmailWithBrevoSMTP(options, brevoApiKey, emailFrom);
  } else if (brevoApiKey.startsWith("xkeysib-")) {
    // Clé API v3 - utiliser l'API Brevo
    return await sendEmailWithBrevoAPI(options, brevoApiKey, emailFrom);
  } else {
    throw new Error("Format de clé API Brevo invalide. La clé doit commencer par 'xkeysib-' (API v3) ou 'xsmtpsib-' (SMTP)");
  }
}

/**
 * Envoie un email avec Brevo SMTP (clé xsmtpsib-)
 */
async function sendEmailWithBrevoSMTP(
  options: EmailOptions,
  smtpKey: string,
  emailFrom: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    // Pour Brevo SMTP, le login est spécifique (ex: 9eeba4001@smtp-brevo.com)
    // Si BREVO_SMTP_LOGIN n'est pas configuré, utiliser EMAIL_FROM comme fallback
    const smtpLogin = process.env.BREVO_SMTP_LOGIN || emailFrom;
    
    console.log("🔧 Configuration Brevo SMTP:");
    console.log("   Host: smtp-relay.brevo.com");
    console.log("   Port: 587");
    console.log("   Login:", smtpLogin);
    console.log("   From:", emailFrom);
    console.log("   Key (premiers chars):", smtpKey.substring(0, 20) + "...");
    
    // Créer le transporteur Brevo SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false, // true pour 465, false pour 587
      auth: {
        user: smtpLogin, // Login SMTP (ex: 9eeba4001@smtp-brevo.com)
        pass: smtpKey, // Clé SMTP complète (xsmtpsib-...)
      },
    });

    // Envoyer l'email
    const info = await transporter.sendMail({
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`✅ Email envoyé avec Brevo SMTP - Message ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email avec Brevo SMTP:", error);
    throw new Error(
      `Erreur Brevo SMTP: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Envoie un email avec Brevo API v3 (clé xkeysib-)
 */
async function sendEmailWithBrevoAPI(
  options: EmailOptions,
  brevoApiKey: string,
  emailFrom: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    // Initialiser le client Brevo avec la clé API
    const apiInstance = new brevo.TransactionalEmailsApi();
    
    // Configuration de l'API key
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

    // Créer l'email
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: emailFrom };
    sendSmtpEmail.to = [{ email: options.to }];
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html;
    if (options.text) {
      sendSmtpEmail.textContent = options.text;
    }

    // Envoyer l'email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    // Le résultat contient body.messageId
    const messageId = result.body?.messageId || undefined;
    console.log(`✅ Email envoyé avec Brevo - Message ID: ${messageId}`);
    
    return { 
      success: true, 
      messageId: messageId
    };
  } catch (error: any) {
    console.error("❌ Erreur lors de l'envoi de l'email avec Brevo:", error);
    
    // Si c'est une erreur Brevo, extraire le message
    if (error && typeof error === 'object' && 'response' in error) {
      const errorMessage = error.response?.body?.message || error.message || "Erreur inconnue Brevo";
      throw new Error(`Erreur Brevo: ${errorMessage}`);
    }
    
    throw new Error(`Erreur lors de l'envoi de l'email: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Envoie un email d'invitation réseau
 */
export async function sendNetworkInviteEmail(data: InviteEmailData): Promise<{ success: boolean; messageId?: string }> {
  const html = getNetworkInviteEmailTemplate(data);
  const text = getNetworkInviteEmailText(data);
  
  return await sendEmail({
    to: data.email,
    subject: `Invitation à rejoindre le réseau de ${data.aorName || "Authority of Record"}`,
    html,
    text,
  });
}

