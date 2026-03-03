// webpack.config.js — NestJS custom webpack config
// Externalizes native Node.js addons that webpack cannot bundle
module.exports = (options, webpack) => {
  return {
    ...options,
    externals: [
      ...(Array.isArray(options.externals) ? options.externals : []),
      // Native addons - cannot be bundled by webpack
      { bcrypt: 'commonjs bcrypt' },
      { 'firebase-admin': 'commonjs firebase-admin' },
    ],
    plugins: [
      ...(options.plugins || []),
      // Suppress "Critical dependency" warnings from firebase-admin
      new webpack.ContextReplacementPlugin(/\/firebase-admin\//, (data) => {
        delete data.dependencies[0].critical;
        return data;
      }),
    ],
  };
};
