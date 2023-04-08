const accessToken = localStorage.getItem('github-token');
if (accessToken != undefined) {
    axios.defaults.headers.common['Authorization'] = accessToken;
}
const app = Vue.createApp({});
app.use(ElementPlus);
for (let i in ElementPlusIconsVue) {
    app.component(i, ElementPlusIconsVue[i]);
}
app.component('gutalk-index', {
    data() {
        return {
            showLoginDialog: false,
            isLogin: accessToken != undefined,
            user: false,
            currentPage: 1,
            loadPage: false,
            stopPage: false,
            list: []
        }
    },
    mounted() {
        if (accessToken != undefined) {
            axios.get('https://api.github.com/user').then((res) => {
                this.user = res.data;
                this.isLogin = true;
                localStorage.setItem('username', res.data.login);
                if (admins.indexOf(res.data.login) != -1) {
                    localStorage.setItem('isAdmin', 'true');
                } else {
                    localStorage.removeItem('isAdmin');
                }
            }).catch(() => {
                this.isLogin = false;
                delete axios.defaults.headers.common['Authorization'];
            });
        }
    },
    methods: {
        login() {
            this.showLoginDialog = false;
            let win = window.open('https://github.com/login/oauth/authorize?client_id=592223f26d426d6b7141&scope=public_repo');
            let loop = setInterval(function () {
                if (win && win.closed) {
                    clearInterval(loop);
                    location.reload();
                }
            }, 300);
        },
        signout() {
            localStorage.removeItem('github-token');
            location.reload();
        },
        getPage() {
            if (!this.stopPage && !this.loadPage) {
                this.loadPage = true;
                axios.get(`https://api.github.com/repos/gutalk-website/issue-repo/issues?sort=updated&state=open&per_page=10&page=${this.currentPage++}`)
                    .then((res) => {
                        if (res.data.length <= 0) {
                            this.stopPage = true;
                        } else {
                            if (res.data.length < 10) {
                                this.stopPage = true;
                            }
                            this.list = this.list.concat(res.data);
                        }
                        this.loadPage = false;
                    }).catch((err) => {
                        this.loadPage = false;
                        ElementPlus.ElMessage.error(`获取列表失败：${err}`);
                    });
            }
        },
        newIssue() {
            window.open('/new/');
        }
    },
    template: '#index'
})
app.mount('#app');