/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, 
    images: {
        domains: ['localhost', '127.0.0.1'],
    },
    output: 'standalone',
    
};

export default nextConfig;
