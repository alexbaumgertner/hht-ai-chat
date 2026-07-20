import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ant Design v6 ships modern ESM; ensure it is transpiled cleanly.
  transpilePackages: ['antd', '@ant-design/nextjs-registry', '@ant-design/icons'],
}

export default withPayload(nextConfig)
