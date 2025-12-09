export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  features: {
    enableTTA: true,
    enableCamera: true,
    enableHistory: true,
    maxImageSize: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp']
  }
};
