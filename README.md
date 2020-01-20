# nuxt-apollo-auth
apollo schema for @nuxtjs/auth 

usage in nuxt.config.js:

    auth: {
        fullPathRedirect: true,
        strategies: {
            apollo: {
                _scheme: '~/plugins/apollo-auth.js'
            }
        }
    }

    apollo: {
        authenticationType: 'Bearer',
        clientConfigs: {
            default: {
                httpEndpoint: 'http://localhost:4000',
                wsEndpoint: 'ws://localhost:4000',
                websocketsOnly: true
            }
        }
    }

Designed for default generated Photon.js auth server
