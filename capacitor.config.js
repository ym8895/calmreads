module.exports = {
  appId: 'calmreads.app',
  appName: 'CalmReads',
  webDir: '.next/standalone',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};