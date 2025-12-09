export const environment = {
  production: true,
  apiUrl: 'https://api.nova-health.com', // Replace with your production API URL
  features: {
    enableTTA: true,
    enableCamera: true,
    enableHistory: true,
    maxImageSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp']
  }
};
