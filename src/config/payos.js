import { PayOS } from '@payos/node';
import logger from '../utils/logger.js';

const getEnvVar = (key) => {
    return (
        process.env[key] ||
        process.env[`${key} `] ||
        process.env[` ${key}`] ||
        process.env[` ${key} `] ||
        ''
    ).trim();
};

const clientId = getEnvVar('PAYOS_CLIENT_ID');
const apiKey = getEnvVar('PAYOS_API_KEY');
const checksumKey = getEnvVar('PAYOS_CHECKSUM_KEY');

if (!clientId || !apiKey || !checksumKey) {
    logger.warn('[PayOS Config] Missing one or more PayOS credentials in .env (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY)');
}

const payOS = new PayOS({
    clientId: clientId || 'dummy_client_id',
    apiKey: apiKey || 'dummy_api_key',
    checksumKey: checksumKey || 'dummy_checksum_key',
});

payOS.createPaymentLink = async (paymentData) => {
    return await payOS.paymentRequests.create(paymentData);
};

payOS.verifyPaymentWebhookData = async (webhookBody) => {
    return await payOS.webhooks.verify(webhookBody);
};

export default payOS;
