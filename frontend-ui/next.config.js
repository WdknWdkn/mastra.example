/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // 処理が不要なファイルを無視する設定
    config.module.rules.push(
      // Markdownファイルを無視
      {
        test: /\.md$/,
        use: 'ignore-loader',
      },
      // LICENSEファイルなど特定のファイルを無視
      {
        test: /LICENSE|README|CHANGELOG/,
        use: 'ignore-loader',
      }
    );
    
    // @libsqlパッケージを外部化する設定
    if (config.externals) {
      config.externals.push('@libsql/client', '@libsql/hrana-client', 'libsql');
    } else {
      config.externals = ['@libsql/client', '@libsql/hrana-client', 'libsql'];
    }
    
    return config;
  }
};

module.exports = nextConfig;
