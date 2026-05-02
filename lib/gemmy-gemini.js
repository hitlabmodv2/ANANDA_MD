import axios from 'axios';

const TIMEOUT_MS  = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2_000;

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function isRetryable(err) {
    if (!err.response) return true;
    const s = err.response.status;
    return s === 429 || s === 500 || s === 502 || s === 503 || s === 504;
}

export class Gemini {
    constructor() {
        this.authToken   = null;
        this.tokenExpiry = null;
    }

    async getAuthToken() {
        if (this.authToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 300_000)
            return this.authToken;

        let lastErr;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const { data } = await axios.post(
                    'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyAxof8_SbpDcww38NEQRhNh0Pzvbphh-IQ',
                    { clientType: 'CLIENT_TYPE_ANDROID' },
                    {
                        timeout: TIMEOUT_MS,
                        headers: {
                            'accept-encoding'   : 'gzip',
                            'accept-language'   : 'in-ID, en-US',
                            'connection'        : 'Keep-Alive',
                            'content-type'      : 'application/json',
                            'user-agent'        : 'Dalvik/2.1.0 (Linux; U; Android 10; SM-J700F Build/QQ3A.200805.001)',
                            'x-android-cert'    : '037CD2976D308B4EFD63EC63C48DC6E7AB7E5AF2',
                            'x-android-package' : 'com.jetkite.gemmy',
                            'x-client-version'  : 'Android/Fallback/X24000001/FirebaseCore-Android',
                            'x-firebase-appcheck': 'eyJlcnJvciI6IlVOS05PV05fRVJST1IifQ==',
                            'x-firebase-client' : 'H4sIAAAAAAAAAKtWykhNLCpJSk0sKVayio7VUSpLLSrOzM9TslIyUqoFAFyivEQfAAAA',
                            'x-firebase-gmpid'  : '1:652803432695:android:c4341db6033e62814f33f2',
                        }
                    }
                );

                if (!data.idToken) throw new Error('Failed to get Gemini auth token.');
                this.authToken   = data.idToken;
                this.tokenExpiry = Date.now() + 3600 * 1000;
                return this.authToken;

            } catch (err) {
                lastErr = err;
                if (attempt < MAX_RETRIES && isRetryable(err)) {
                    await sleep(RETRY_DELAY * attempt);
                } else {
                    break;
                }
            }
        }
        throw new Error('getAuthToken failed: ' + (lastErr?.message || lastErr));
    }

    async chat({ contents, model = 'gemini-flash-latest', ...config }) {
        if (!Array.isArray(contents)) throw new Error('Contents must be an array.');

        let lastErr;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const authToken = await this.getAuthToken();

                const { data } = await axios.post(
                    'https://asia-northeast3-gemmy-ai-bdc03.cloudfunctions.net/gemini',
                    {
                        model,
                        stream: false,
                        request: {
                            contents,
                            generationConfig: {
                                maxOutputTokens: 8192,
                                ...config
                            }
                        }
                    },
                    {
                        timeout: TIMEOUT_MS,
                        headers: {
                            'accept-encoding': 'gzip',
                            'authorization'  : `Bearer ${authToken}`,
                            'content-type'   : 'application/json; charset=UTF-8',
                            'user-agent'     : 'okhttp/5.3.2',
                        }
                    }
                );

                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error('Gemini returned empty response.');
                return text;

            } catch (err) {
                lastErr = err;
                if (attempt < MAX_RETRIES && isRetryable(err)) {
                    await sleep(RETRY_DELAY * attempt);
                    this.authToken = null;
                } else {
                    break;
                }
            }
        }
        throw new Error(lastErr?.message || String(lastErr));
    }
}

export default Gemini;
