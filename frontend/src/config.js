// Frontend Configuration for GenArabia Voice Agent
// Environment-based API URL configuration

const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

export const API_CONFIG = {
    // Base API URL - Using Modal for both dev and prod since no local backend
    BASE_URL: 'https://nour-ahmed--genarabia-voice-agent-chatterboxapi-api-generate.modal.run',  // Modal backend

    // Individual endpoints
    ENDPOINTS: {
        GENERATE: '/api_generate',        // Note: Modal uses different path
        SAMPLES: '/api_samples',
        DIALECTS: '/api_dialects',
        HEALTH: '/health',
        UPLOAD_REFERENCE: '/api/upload-reference',  // This endpoint needs adaptation for Modal
        GET_SAMPLE_AUDIO: (dialect, sampleId) => `/api/samples/${dialect}/${sampleId}`,
        COMPARE: '/api/compare'
    },

    // For Modal deployment, we need individual endpoint URLs
    MODAL_ENDPOINTS: {
        GENERATE: 'https://nour-ahmed--genarabia-voice-agent-chatterboxapi-api-generate.modal.run',
        SAMPLES: 'https://nour-ahmed--genarabia-voice-agent-chatterboxapi-api-samples.modal.run',
        DIALECTS: 'https://nour-ahmed--genarabia-voice-agent-chatterboxapi-api-dialects.modal.run',
        HEALTH: 'https://nour-ahmed--genarabia-voice-agent-chatterboxapi-health.modal.run',
    },

    // Timeout settings
    TIMEOUT: 120000,  // 2 minutes for TTS generation
};

export default API_CONFIG;
