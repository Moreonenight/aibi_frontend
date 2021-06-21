module.exports = {
    devServer: {
        proxy: {
            '/': {
                target: 'http://101.226.16.95:8090',
                changeOrigin: true,
            }
        }
    },
}