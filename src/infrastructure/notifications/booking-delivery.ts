import nodemailer from 'nodemailer';

interface SendBookingNotificationsInput {
  participantEmails: string[];
  requesterEmail: string;
  sendRequesterConfirmation: boolean;
  teamName: string;
  teamLink: string;
  slotStartIso: string;
  slotEndIso: string;
  comment: string;
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number.parseInt(process.env.SMTP_PORT || '0', 10);
  if (!host || !user || !pass || !port) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass }
  });
}

export async function sendBookingNotifications(input: SendBookingNotificationsInput) {
  const transport = createTransport();
  if (!transport) {
    return;
  }

  const from = process.env.SMTP_FROM_EMAIL;
  if (!from) {
    return;
  }

  const subject = `${input.teamName}: booking request`;
  const text = [
    `Team: ${input.teamName}`,
    `Slot: ${input.slotStartIso} - ${input.slotEndIso}`,
    `Comment: ${input.comment || '-'}`,
    `Link: ${input.teamLink}`
  ].join('\n');

  if (input.participantEmails.length) {
    await transport.sendMail({
      from,
      to: input.participantEmails.join(', '),
      subject,
      text
    });
  }

  if (input.sendRequesterConfirmation) {
    await transport.sendMail({
      from,
      to: input.requesterEmail,
      subject: `${input.teamName}: request received`,
      text: `Команда получит запрос и создаст событие в календаре\n${input.teamLink}`
    });
  }
}
