module.exports = {
    plugins: [
        require('autoprefixer'),
        require('cssnano')({
            preset: ['default', {
                discardComments: {
                    removeAll: true,
                },
                normalizeWhitespace: true,
                minifyFontValues: true,
                minifyGradients: true,
                minifySelectors: true,
                minifyParams: true
            }]
        })
    ]
}; 