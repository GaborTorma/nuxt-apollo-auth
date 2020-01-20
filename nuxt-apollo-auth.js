import gql from 'graphql-tag'

export default class ApolloScheme {
    constructor(auth, options) {
        this.$auth = auth
        this.name = options._name

        this.options = Object.assign({}, DEFAULTS, options)
        this.$apollo = this.$auth.ctx.app.apolloProvider.clients[this.options.apolloClient]
        this.$apolloHelpers = this.$auth.ctx.app.$apolloHelpers
    }

    async _setToken(token) {
        // Set Authorization token for all apollo requests
        await this.$apolloHelpers.onLogin(token, undefined, {
            expires: this.options.tokenExpires
        })
    }

    _clearToken() {
        this.$apolloHelpers.onLogout()
    }

    mounted() {
        return this.$auth.fetchUserOnce()
    }

    keysFromString(keys, data) {
        return keys.split('.').reduce((v, k) => (v || {})[k], data)
    }

    async login(endpoint) {
        if (!this.options.graphql.login) {
            return
        }

        // Ditch any leftover local tokens before attempting to log in
        await this._logoutLocally()

        const loginOptions = this.options.graphql.login

        const response = await this.$apollo.mutate({
            mutation: loginOptions.mutation,
            variables: endpoint.data
        })
        const token = this.keysFromString(loginOptions.token, response.data)
        const user = this.keysFromString(loginOptions.user, response.data)

        if (token) {
            this._setToken(token)
        }

        if (loginOptions.user && user) {
            await this.$auth.setUser(user)
        } else {
            this.$auth.setUser({})
        }
    }

    async setUserToken(token) {
        // Ditch any leftover local tokens before attempting to log in
        await this._logoutLocally()

        this._setToken(token)

        return this.fetchUser()
    }

    async fetchUser(endpoint) {
        // Token is required but not available
        if (!this.$apolloHelpers.getToken()) {
            return
        }

        // User endpoint is disabled.
        if (!this.options.graphql.user) {
            this.$auth.setUser({})
            return
        }

        // Try to fetch user and then set
        const userOptions = this.options.graphql.user

        // console.log(this.$apollo)
        try {
            const response = await this.$apollo.query({
                query: userOptions.query
            })
            const user = this.keysFromString(userOptions.user, response.data)

            this.$auth.setUser(user)
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error)
            // expected output: ReferenceError: nonExistentFunction is not defined
            // Note - error messages will vary depending on browser
        }
    }

    async logout(endpoint) {
        // Only connect to logout endpoint if it's configured
        await this.$auth.ctx.app.$apolloHelpers.onLogout()

        // But logout locally regardless
        return this._logoutLocally()
    }

    _logoutLocally() {
        if (this.options.tokenRequired) {
            this._clearToken()
        }

        return this.$auth.reset()
    }
}

const DEFAULTS = {
    tokenExpires: 1,
    apolloClient: 'defaultClient',
    graphql: {
        login: {
            mutation: gql`
                mutation login($email: String!, $password: String!) {
                    login(email: $email, password: $password) {
                        token
                        user {
                            id
                            name
                        }
                    }
                }
            `,
            token: 'login.token',
            user: 'login.user'
        },
        user: {
            query: gql`
                query {
                    me {
                        id
                        name
                    }
                }
            `,
            user: 'me'
        }
    }
}
