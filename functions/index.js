const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const SibApiV3Sdk = require("@getbrevo/brevo");

// Inicializa la app de admin para poder acceder a Firestore
admin.initializeApp();

// Configura el cliente de Brevo con tu clave de API.
const apiClient = new SibApiV3Sdk.TransactionalEmailsApi();
apiClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, functions.config().brevo.key);

/**
 * Guarda el correo de un proveedor interesado en una nueva colección 'providerLeads'.
 */
exports.addProviderLead = functions.https.onRequest((req, res) => {
  // Habilita CORS para que tu web pueda llamar a esta función
  cors(req, res, async () => {
    // Solo permitimos peticiones POST
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { email } = req.body;

    // Validación simple del correo
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        error: "Por favor, proporciona un correo electrónico válido.",
      });
    }

    try {
      const db = admin.firestore();
      const providerEmail = email.toLowerCase();

      // --- MEJORA: Verificar si el correo ya existe ---
      const existingLeadQuery = await db.collection("providerLeads")
        .where("email", "==", providerEmail)
        .limit(1)
        .get();

      // 2. Preparamos el correo de confirmación para Brevo.
      const sendSmtpEmail = {
        sender: { name: "Master Party", email: "contacto@masterparty.mx" },
        to: [{ email: providerEmail }],
        subject: "¡Estás en la lista de espera de Master Party!",
        htmlContent: `
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
            </div>`,
      };
      // 3. Siempre intentamos enviar el correo usando la instancia del API client.
      const emailPromise = apiClient.sendTransacEmail(sendSmtpEmail);

      if (existingLeadQuery.empty) {
        // Si el correo es nuevo, lo guardamos en la BD y esperamos a que ambas operaciones terminen.
        const leadPromise = db.collection("providerLeads").add({
          email: providerEmail,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await Promise.all([leadPromise, emailPromise]);

        return res.status(201).json({
          success: "¡Gracias! Te avisaremos cuando lancemos el acceso beta.",
        });
      } else {
        // Si el correo ya existe, solo esperamos a que se envíe el correo de recordatorio.
        await emailPromise;
        return res.status(200).json({ success: "¡Ya estabas en la lista! Te hemos enviado un recordatorio." });
      }
    } catch (error) {
      console.error("Error al guardar el correo del proveedor: ", error);
      return res.status(500).json({
        error: "Ocurrió un error al registrar tu correo. Inténtalo de nuevo.",
      });
    }
  });
});