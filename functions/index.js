const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore"); // Importamos FieldValue
const cors = require("cors")({ origin: true });
const SibApiV3Sdk = require("@getbrevo/brevo");

// Inicializa la app de admin para poder acceder a Firestore
admin.initializeApp();

// Configura el cliente de Brevo con tu clave de API.
const apiClient = new SibApiV3Sdk.TransactionalEmailsApi();
// Usa variables de entorno. En local, las tomará de .env.local. En producción, se configuran en Google Cloud.
// functions.config() está obsoleto.
const brevoApiKey = process.env.BREVO_KEY;
apiClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

// --- Contenido de los correos ---
const welcomeEmailHtml = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #8B5CF6; color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Master Party</h1>
    </div>
    <div style="padding: 30px;">
      <h2 style="font-size: 20px; color: #333;">¡Estás en la lista!</h2>
      <p>Hola,</p>
      <p>Hemos recibido tu correo y te confirmamos que ya estás en nuestra lista de espera. Serás de los primeros en saber cuándo lancemos el acceso beta para proveedores.</p>
      <p style="margin-top: 30px;">¡Gracias por tu interés en <strong>Master Party</strong>!</p>
      <p>— El equipo de Master Party</p>
    </div>
    <div style="background-color: #f7f7f7; color: #888; padding: 20px; text-align: center; font-size: 12px;">
      <p style="margin: 0;">Recibiste este correo porque te registraste en la lista de espera de masterparty.mx</p>
    </div>
  </div>`;

const reminderEmailHtml = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #8B5CF6; color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">Master Party</h1>
    </div>
    <div style="padding: 30px;">
      <h2 style="font-size: 20px; color: #333;">Solo un recordatorio: ¡Ya estás en la lista!</h2>
      <p>Hola,</p>
      <p>Te escribimos para recordarte que ya estás en nuestra lista de espera. ¡No necesitas registrarte de nuevo! Serás de los primeros en saber cuándo lancemos el acceso beta para proveedores.</p>
      <p style="margin-top: 30px;">¡Gracias por tu interés en <strong>Master Party</strong>!</p>
      <p>— El equipo de Master Party</p>
    </div>
    <div style="background-color: #f7f7f7; color: #888; padding: 20px; text-align: center; font-size: 12px;">
      <p style="margin: 0;">Recibiste este correo porque te registraste en la lista de espera de masterparty.mx</p>
    </div>
  </div>`;

/**
 * Guarda el correo de un proveedor interesado en una nueva colección 'providerLeads'.
 */
exports.addProviderLead = functions
  .runWith({ secrets: ["BREVO_KEY", "RECAPTCHA_SECRET_KEY"] }) // <-- Añadimos el secreto de reCAPTCHA
  .https.onRequest((req, res) => {
  // Habilita CORS para que tu web pueda llamar a esta función
  cors(req, res, async () => {
    // Solo permitimos peticiones POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { email, state, token } = req.body; // Recibimos también el token de reCAPTCHA

    // Validación simple del correo
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        error: "Por favor, proporciona un correo electrónico válido.",
      });
    }

    // Validación del estado
    if (!state) {
      return res.status(400).json({
        error: "Por favor, selecciona tu estado.",
      });
    }

    try {
      // --- VERIFICACIÓN DE RECAPTCHA ---
      if (!token) {
        return res.status(400).json({ error: "Verificación anti-bot fallida. Intenta de nuevo." });
      }

      const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
      const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${token}`;

      const recaptchaResponse = await fetch(verificationUrl, { method: "POST" });
      const recaptchaData = await recaptchaResponse.json();

      // Si la verificación falla o la puntuación es muy baja, rechazamos la solicitud.
      if (!recaptchaData.success || recaptchaData.score < 0.5) {
        console.log("Verificación de reCAPTCHA fallida:", recaptchaData);
        return res.status(403).json({ error: "La solicitud parece ser de un bot." });
      }
      // --- FIN DE VERIFICACIÓN ---

      const db = admin.firestore();
      const providerEmail = email.toLowerCase();

      // --- MEJORA: Verificar si el correo ya existe ---
      const existingLeadQuery = await db.collection("providerLeads")
        .where("email", "==", providerEmail)
        .limit(1)
        .get();

      if (existingLeadQuery.empty) {
        // 1. El correo es nuevo. Primero, intentamos guardarlo en la BD.
        await db.collection("providerLeads").add({
          email: providerEmail,
          state: state, // Guardamos el estado en la base de datos
          createdAt: FieldValue.serverTimestamp(), // Usamos FieldValue directamente
        });

        // 2. Si la escritura en la BD fue exitosa, AHORA enviamos el correo.
        const sendSmtpEmail = {
          sender: { name: "Master Party", email: "contacto@masterparty.mx" },
          to: [{ email: providerEmail }],
          subject: "¡Estás en la lista de espera de Master Party!",
          htmlContent: welcomeEmailHtml,
        };
        await apiClient.sendTransacEmail(sendSmtpEmail);

        return res.status(201).json({
          success: "¡Gracias! Te avisaremos cuando lancemos el acceso beta.",
        });
      } else {
        // Si el correo ya existe, solo enviamos el correo de recordatorio.
        const sendSmtpEmail = {
          sender: { name: "Master Party", email: "contacto@masterparty.mx" },
          to: [{ email: providerEmail }],
          subject: "Recordatorio: ¡Ya estás en la lista de espera!",
          htmlContent: reminderEmailHtml,
        };
        await apiClient.sendTransacEmail(sendSmtpEmail);
        return res.status(200).json({ success: "¡Ya estabas en la lista! Te hemos enviado un recordatorio." });
      }
    } catch (error) {
      console.error("Error al guardar el correo del proveedor: ", error);
      return res.status(500).json({
        error: "Ocurrió un error. Por favor, inténtalo de nuevo más tarde o contáctanos en contacto@masterparty.mx.",
      });
    }
  });
});