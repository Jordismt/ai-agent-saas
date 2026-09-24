import { Resend } from "resend";

import { EmailService } from "../domain/EmailService.js";

export class ResendEmailService extends EmailService {
  constructor() {
    super();

    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }

    this.resend = new Resend(process.env.RESEND_API_KEY);

    this.from = process.env.RESEND_FROM_EMAIL || "Resbix <onboarding@resend.dev>";

    this.frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  }

  async sendBookingConfirmation({
    to,
    customerName,
    businessName,
    serviceName,
    employeeName,
    startsAt,
    timezone,
    price,
    managementToken,
  }) {
    const managementUrl = this.buildManagementUrl(managementToken);

    const { date, time } = this.formatDateTime(startsAt, timezone);

    const formattedPrice = this.formatPrice(price);

    return this.sendEmail({
      to,
      subject: `Reserva confirmada · ${businessName}`,
      eyebrow: "RESERVA CONFIRMADA",
      title: "Tu reserva está confirmada",
      customerName,
      businessName,
      intro: `Tu reserva en <strong>${this.escapeHtml(businessName)}</strong> está confirmada.`,
      accentType: "success",
      serviceName,
      date,
      time,
      employeeName,
      price: formattedPrice,
      buttonText: "Gestionar mi reserva",
      buttonUrl: managementUrl,
      footerText: "Desde este enlace podrás modificar o cancelar tu reserva.",
    });
  }

  async sendBookingRescheduled({
    to,
    customerName,
    businessName,
    serviceName,
    employeeName,
    startsAt,
    previousStartsAt = null,
    timezone,
    price,
    managementToken,
  }) {
    const managementUrl = this.buildManagementUrl(managementToken);

    const { date, time } = this.formatDateTime(startsAt, timezone);

    const formattedPrice = this.formatPrice(price);

    let previousDate = null;
    let previousTime = null;

    if (previousStartsAt) {
      const previous = this.formatDateTime(previousStartsAt, timezone);

      previousDate = previous.date;
      previousTime = previous.time;
    }

    return this.sendEmail({
      to,
      subject: `Reserva modificada · ${businessName}`,
      eyebrow: "RESERVA MODIFICADA",
      title: "Tu reserva ha sido modificada",
      customerName,
      businessName,
      intro: `Hemos actualizado tu reserva en <strong>${this.escapeHtml(
        businessName,
      )}</strong>. Estos son los nuevos datos de tu cita.`,
      accentType: "info",
      serviceName,
      date,
      time,
      employeeName,
      price: formattedPrice,
      previousDate,
      previousTime,
      buttonText: "Gestionar mi reserva",
      buttonUrl: managementUrl,
      footerText: "Puedes volver a modificar o cancelar tu reserva desde este enlace.",
    });
  }

  async sendBookingCancellation({
    to,
    customerName,
    businessName,
    serviceName,
    employeeName,
    startsAt,
    timezone,
    cancellationReason = null,
  }) {
    const { date, time } = this.formatDateTime(startsAt, timezone);

    return this.sendEmail({
      to,
      subject: `Reserva cancelada · ${businessName}`,
      eyebrow: "RESERVA CANCELADA",
      title: "Tu reserva ha sido cancelada",
      customerName,
      businessName,
      intro: `Tu reserva en <strong>${this.escapeHtml(
        businessName,
      )}</strong> ha sido cancelada correctamente.`,
      accentType: "cancelled",
      serviceName,
      date,
      time,
      employeeName,
      cancellationReason,
      footerText: "Ya no tienes que acudir a esta cita.",
    });
  }

  async sendEmail({
    to,
    subject,
    eyebrow,
    title,
    customerName,
    intro,
    accentType = "success",
    serviceName,
    date,
    time,
    employeeName = null,
    price = null,
    previousDate = null,
    previousTime = null,
    cancellationReason = null,
    buttonText = null,
    buttonUrl = null,
    footerText = null,
  }) {
    const safeCustomerName = this.escapeHtml(customerName);

    const safeServiceName = this.escapeHtml(serviceName);

    const safeEmployeeName = employeeName ? this.escapeHtml(employeeName) : null;

    const safeReason = cancellationReason ? this.escapeHtml(cancellationReason) : null;

    const safeEyebrow = this.escapeHtml(eyebrow);

    const safeTitle = this.escapeHtml(title);

    const safeButtonText = buttonText ? this.escapeHtml(buttonText) : null;

    const accent = this.getAccent(accentType);

    const { data, error } = await this.resend.emails.send({
      from: this.from,
      to: [to],
      subject,

      html: `
          <!doctype html>

          <html lang="es">
            <head>
              <meta charset="UTF-8" />

              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
            </head>

            <body
              style="
                margin:0;
                padding:0;
                background:#f5f7fa;
                font-family:Arial,Helvetica,sans-serif;
                color:#18181b;
              "
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width:100%;
                  background:#f5f7fa;
                  padding:40px 16px;
                "
              >
                <tr>
                  <td align="center">

                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="
                        width:100%;
                        max-width:600px;
                        background:#ffffff;
                        border:1px solid #e4e7ec;
                        border-radius:18px;
                        overflow:hidden;
                      "
                    >

                      <tr>
                        <td
                          style="
                            height:5px;
                            background:${accent.color};
                            font-size:0;
                            line-height:0;
                          "
                        >
                          &nbsp;
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding:32px 32px 36px;
                          "
                        >

                          <table
                            role="presentation"
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            style="
                              margin-bottom:30px;
                            "
                          >
                            <tr>
                              <td>
                                <div
                                  style="
                                    display:inline-block;
                                    background:#18181b;
                                    color:#ffffff;
                                    font-size:14px;
                                    font-weight:800;
                                    letter-spacing:-0.02em;
                                    padding:8px 11px;
                                    border-radius:9px;
                                  "
                                >
                                  Resbix
                                </div>
                              </td>
                            </tr>
                          </table>

                          <div
                            style="
                              display:inline-block;
                              margin-bottom:12px;
                              padding:6px 9px;
                              border-radius:999px;
                              background:${accent.background};
                              color:${accent.text};
                              font-size:10px;
                              line-height:1;
                              font-weight:800;
                              letter-spacing:.08em;
                            "
                          >
                            ${safeEyebrow}
                          </div>

                          <h1
                            style="
                              margin:0 0 10px;
                              color:#101828;
                              font-size:26px;
                              line-height:1.25;
                              letter-spacing:-0.03em;
                            "
                          >
                            ${safeTitle}
                          </h1>

                          <p
                            style="
                              margin:0 0 28px;
                              color:#667085;
                              font-size:15px;
                              line-height:1.65;
                            "
                          >
                            Hola ${safeCustomerName},
                            ${intro}
                          </p>

                          ${
                            previousDate && previousTime
                              ? `
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellspacing="0"
                                  cellpadding="0"
                                  border="0"
                                  style="
                                    width:100%;
                                    margin-bottom:12px;
                                    background:#f9fafb;
                                    border:1px solid #eaecf0;
                                    border-radius:12px;
                                  "
                                >
                                  <tr>
                                    <td
                                      style="
                                        padding:14px 16px;
                                      "
                                    >
                                      <div
                                        style="
                                          margin-bottom:5px;
                                          color:#98a2b3;
                                          font-size:10px;
                                          font-weight:700;
                                          text-transform:uppercase;
                                          letter-spacing:.07em;
                                        "
                                      >
                                        Cita anterior
                                      </div>

                                      <div
                                        style="
                                          color:#667085;
                                          font-size:13px;
                                          line-height:1.5;
                                          text-transform:capitalize;
                                        "
                                      >
                                        ${previousDate}
                                        ·
                                        ${previousTime}
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              `
                              : ""
                          }

                          <table
                            role="presentation"
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            border="0"
                            style="
                              width:100%;
                              background:#fafafa;
                              border:1px solid #e4e7ec;
                              border-radius:14px;
                              margin-bottom:28px;
                            "
                          >
                            <tr>
                              <td
                                style="
                                  padding:22px;
                                "
                              >

                                ${this.renderDetail("Servicio", safeServiceName, true)}

                                ${this.renderDetail("Fecha", date, true, true)}

                                ${this.renderDetail("Hora", time, Boolean(safeEmployeeName || price))}

                                ${
                                  safeEmployeeName
                                    ? this.renderDetail("Profesional", safeEmployeeName, Boolean(price))
                                    : ""
                                }

                                ${price ? this.renderDetail("Precio", price, false) : ""}

                              </td>
                            </tr>
                          </table>

                          ${
                            safeReason
                              ? `
                                <table
                                  role="presentation"
                                  width="100%"
                                  cellspacing="0"
                                  cellpadding="0"
                                  border="0"
                                  style="
                                    width:100%;
                                    margin:-10px 0 28px;
                                    background:#fffafa;
                                    border:1px solid #fee2e2;
                                    border-radius:12px;
                                  "
                                >
                                  <tr>
                                    <td
                                      style="
                                        padding:16px;
                                      "
                                    >
                                      <div
                                        style="
                                          margin-bottom:6px;
                                          color:#991b1b;
                                          font-size:11px;
                                          font-weight:700;
                                        "
                                      >
                                        Motivo de cancelación
                                      </div>

                                      <div
                                        style="
                                          color:#7f1d1d;
                                          font-size:13px;
                                          line-height:1.55;
                                        "
                                      >
                                        ${safeReason}
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              `
                              : ""
                          }

                          ${
                            buttonText && buttonUrl
                              ? `
                                <table
                                  role="presentation"
                                  cellspacing="0"
                                  cellpadding="0"
                                  border="0"
                                >
                                  <tr>
                                    <td
                                      style="
                                        border-radius:10px;
                                        background:#18181b;
                                      "
                                    >
                                      <a
                                        href="${this.escapeHtml(buttonUrl)}"
                                        style="
                                          display:inline-block;
                                          padding:13px 20px;
                                          color:#ffffff;
                                          text-decoration:none;
                                          font-size:14px;
                                          font-weight:700;
                                        "
                                      >
                                        ${safeButtonText}
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              `
                              : ""
                          }

                          ${
                            footerText
                              ? `
                                <p
                                  style="
                                    margin:${buttonText ? "24px" : "0"} 0 0;
                                    color:#98a2b3;
                                    font-size:12px;
                                    line-height:1.6;
                                  "
                                >
                                  ${this.escapeHtml(footerText)}
                                </p>
                              `
                              : ""
                          }

                        </td>
                      </tr>
                    </table>

                    <div
                      style="
                        margin-top:18px;
                        color:#a1a1aa;
                        font-size:11px;
                      "
                    >
                      Powered by Resbix
                    </div>

                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
    });

    if (error) {
      console.error("[Resend API Error]:", {
        status: error.statusCode,
        error,
        path: "/emails",
      });

      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  }
  async sendBookingReminder({
    to,
    customerName,
    businessName,
    serviceName,
    employeeName,
    startsAt,
    timezone,
    price,
  }) {
    const { date, time } = this.formatDateTime(startsAt, timezone);

    const formattedPrice = this.formatPrice(price);

    const details = [
      this.renderDetail("Servicio", this.escapeHtml(serviceName)),

      this.renderDetail("Fecha", this.escapeHtml(date)),

      this.renderDetail("Hora", this.escapeHtml(time)),

      employeeName ? this.renderDetail("Profesional", this.escapeHtml(employeeName)) : "",

      formattedPrice ? this.renderDetail("Precio", this.escapeHtml(formattedPrice)) : "",
    ].join("");

    return this.sendEmail({
      to,

      subject: `Recordatorio de tu reserva · ${businessName}`,

      preheader: `Mañana tienes una reserva en ${businessName}`,

      eyebrow: "RECORDATORIO",

      title: "Tu cita es mañana",

      intro: `
      Hola ${this.escapeHtml(customerName)}.
      Te recordamos que mañana tienes una reserva
      en <strong>${this.escapeHtml(businessName)}</strong>.
    `,

      content: details,

      accent: this.getAccent("blue"),

      footer: `
      Si necesitas modificar o cancelar tu reserva,
      puedes hacerlo desde el enlace privado que
      recibiste en el correo de confirmación.
    `,
    });
  }
  renderDetail(label, value, hasMargin = true, capitalize = false) {
    return `
      <div
        style="
          margin-bottom:6px;
          color:#71717a;
          font-size:12px;
        "
      >
        ${this.escapeHtml(label)}
      </div>

      <div
        style="
          color:#18181b;
          font-size:15px;
          font-weight:600;
          margin-bottom:${hasMargin ? "18px" : "0"};
          ${capitalize ? "text-transform:capitalize;" : ""}
        "
      >
        ${value}
      </div>
    `;
  }

  buildManagementUrl(managementToken) {
    return `${this.frontendUrl.replace(/\/$/, "")}/booking/${managementToken}`;
  }

  formatDateTime(startsAt, timezone) {
    const dateObject = new Date(startsAt);

    const date = new Intl.DateTimeFormat("es-ES", {
      timeZone: timezone || "Europe/Madrid",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dateObject);

    const time = new Intl.DateTimeFormat("es-ES", {
      timeZone: timezone || "Europe/Madrid",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(dateObject);

    return {
      date,
      time,
    };
  }

  formatPrice(price) {
    if (price === null || price === undefined || price === "") {
      return null;
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice)) {
      return null;
    }

    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(numericPrice);
  }

  getAccent(type) {
    if (type === "cancelled") {
      return {
        color: "#dc2626",
        background: "#fef2f2",
        text: "#b91c1c",
      };
    }

    if (type === "info") {
      return {
        color: "#2563eb",
        background: "#eff6ff",
        text: "#1d4ed8",
      };
    }

    return {
      color: "#079455",
      background: "#ecfdf3",
      text: "#067647",
    };
  }

  escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
