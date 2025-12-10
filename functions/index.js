const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore"); // Importamos FieldValue
const cors = require("cors")({ origin: true });
const SibApiV3Sdk = require("@getbrevo/brevo");

// Inicializa la app de admin para poder acceder a Firestore
admin.initializeApp();

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

      // Configura el cliente de Brevo con tu clave de API dentro de la función.
      const apiClient = new SibApiV3Sdk.TransactionalEmailsApi();
      const brevoApiKey = process.env.BREVO_KEY;
      apiClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

      if (existingLeadQuery.empty) {
        // 1. El correo es nuevo. Primero, intentamos guardarlo en la BD.
        await db.collection("providerLeads").add({
          email: providerEmail,
          state: state, // Guardamos el estado en la base de datos
          createdAt: FieldValue.serverTimestamp(), // Usamos FieldValue directamente
        });

        // 2. Si la escritura en la BD fue exitosa, AHORA enviamos el correo.
        const sendSmtpEmail = {
          to: [{ email: providerEmail }],
          // El ID de la plantilla de bienvenida que creaste en Brevo.
          templateId: 3, // <-- ¡REEMPLAZA ESTO CON EL ID DE TU PLANTILLA DE BIENVENIDA!
        };
        await apiClient.sendTransacEmail(sendSmtpEmail);

        return res.status(201).json({
          success: "¡Gracias! Te avisaremos cuando lancemos el acceso beta.",
        });
      } else {
        // Si el correo ya existe, solo enviamos el correo de recordatorio.
        const sendSmtpEmail = {
          to: [{ email: providerEmail }],
          // El ID de la plantilla de recordatorio que creaste en Brevo.
          templateId: 4, // <-- ¡REEMPLAZA ESTO CON EL ID DE TU PLANTILLA DE RECORDATORIO!
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

/**
 * Envía un correo de verificación de cuenta personalizado usando Brevo.
 */
exports.sendCustomVerificationEmail = functions
  .runWith({ secrets: ["BREVO_KEY", "CLIENT_APP_URL"] }) // Añadimos el nuevo secreto
  .https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Falta el correo electrónico." });
    }

    try {
      // --- NUEVO: Generar el enlace de verificación en el backend ---
      const actionCodeSettings = {
        // Usamos una variable de entorno para la URL, con un valor por defecto seguro.
        // Esto nos permite tener una URL para DEV y otra para PROD.
        // La URL debe estar en la lista de dominios autorizados en la consola de Firebase.
        url: process.env.CLIENT_APP_URL || 'https://masterparty-app.web.app/login',
      };
      const link = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);

      // Configura el cliente de Brevo con tu clave de API dentro de la función.
      const apiClient = new SibApiV3Sdk.TransactionalEmailsApi();
      const brevoApiKey = process.env.BREVO_KEY;
      apiClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);

      const sendSmtpEmail = {
        to: [{ email: email }],
        // ¡IMPORTANTE! Usa el ID de la plantilla que creaste en Brevo.
        templateId: 5,
        params: {
          // Estos son los parámetros que tu plantilla de Brevo espera.
          // El nombre 'verification_link' debe coincidir con el que usaste en la plantilla.
          verification_link: link,
        },
      };

      await apiClient.sendTransacEmail(sendSmtpEmail);

      return res.status(200).json({ success: "Correo de verificación enviado." });
    } catch (error) {
      console.error("Error al enviar correo de verificación con Brevo: ", error);
      return res.status(500).json({ error: "Ocurrió un error al enviar el correo de verificación." });
    }
  });
});