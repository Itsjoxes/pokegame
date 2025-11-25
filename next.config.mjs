/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow dev access from other machines (adjust origin/port as needed)
  allowedDevOrigins: [
    'http://192.168.1.9:3000',
    'http://192.168.1.9'
  ]
};

export default nextConfig;
