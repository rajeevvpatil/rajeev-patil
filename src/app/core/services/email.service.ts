import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailService {
    constructor() {
        emailjs.init(environment.emailjsPublicKey);
    }

    send(params: Record<string, string>): Promise<void> {
        return emailjs.send(
            environment.emailjsServiceId,
            environment.emailjsTemplateId,
            { ...params, to_email: environment.recipientEmail }
        ).then(() => undefined);
    }
}
