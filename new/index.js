marked.setOptions({
    highlight: function (code) {
        return hljs.highlightAuto(code).value;
    }
});
const accessToken = localStorage.getItem('github-token');
axios.defaults.headers.common['Authorization'] = accessToken;
const app = Vue.createApp({});
app.use(ElementPlus);
for (let i in ElementPlusIconsVue) {
    app.component(i, ElementPlusIconsVue[i]);
}
app.component('md-editor', MarkdownEditor);
app.component('gutalk-newissue', {
    data() {
        return {
            isLogin: accessToken != undefined,
            title: '',
            content: '',
            commenting: false
        }
    },
    mounted() {
        axios.get('https://api.github.com/user').then(() => {
            this.isLogin = true;
        }).catch(() => {
            this.isLogin = false;
            delete axios.defaults.headers.common['Authorization'];
            ElementPlus.ElMessage.error(`登录信息无效：${err}`);
        });
    },
    methods: {
        marked(str) {
            return str == null ? '' : marked.parse(str);
        },
        comment(str) {
            if (this.title == '') {
                ElementPlus.ElMessage.error(`标题不能为空！`);
                return;
            }
            let json = { 'title': this.title, 'body': str };
            this.commenting = true;
            axios.post(
                `https://api.github.com/repos/gutalk-website/issue-repo/issues`, json
            ).then((res) => {
                this.commenting = false;
                location.href = `/issue/?id=${res.data.number}`;
            }).catch((err) => {
                ElementPlus.ElMessage.error(`提交失败：${err}`);
                this.commenting = false;
            });
        }
    },
    template: '#newissue'
})
app.mount('#app');