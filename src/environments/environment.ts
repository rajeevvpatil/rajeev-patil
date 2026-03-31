// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

export const environment = {
  production: false,
  adminPin: '2213',             // ← local dev only; never commit real secrets
  emailjsPublicKey: '',         // Fill in from EmailJS account > API Keys
  emailjsServiceId: '',         // Fill in from EmailJS > Email Services
  emailjsTemplateId: '',        // Fill in from EmailJS > Email Templates
  recipientEmail: 'rajeevvpatil899@gmail.com'
};
