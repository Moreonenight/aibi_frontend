module.exports = {
    devServer: {
        proxy: {
            '/': {
                target: 'http://47.117.126.235:8080',
                changeOrigin: true,
            }
        }
    },
}