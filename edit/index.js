marked.setOptions({
    highlight: function (code) {
        return hljs.highlightAuto(code).value;
    }
});
const accessToken = localStorage.getItem('github-token');
axios.defaults.headers.common['Authorization'] = accessToken;
const issueId = (new URL(document.location)).searchParams.get('id');
const app = Vue.createApp({});
app.use(ElementPlus);
for (let i in ElementPlusIconsVue) {
    app.component(i, ElementPlusIconsVue[i]);
}
app.component('md-editor', MarkdownEditor);
app.component('gutalk-editissue', {
    data() {
        return {
            isLogin: accessToken != undefined,
            loading: true,
            user: '',
            title: '',
            closed: undefined,
            commenting: false
        }
    },
    mounted() {
        axios.get('https://api.github.com/user').then(() => {
            this.isLogin = true;
        }).catch((err) => {
            this.isLogin = false;
            delete axios.defaults.headers.common['Authorization'];
            ElementPlus.ElMessage.error(`登录信息无效：${err}`);
        });
        axios.get(`https://api.github.com/repos/gutalk-website/issue-repo/issues/${issueId}`).then((res) => {
            this.loading = false;
            this.title = res.data.title;
            this.$refs.editor.set(res.data.body);
            this.closed = res.data.state == 'closed';
        }).catch((err) => {
            ElementPlus.ElMessage.error(`获取数据失败：${err}`);
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
            json['state'] = this.closed ? 'closed' : 'open';
            this.commenting = true;
            axios.patch(
                `https://api.github.com/repos/gutalk-website/issue-repo/issues/${issueId}`, json
            ).then((res) => {
                this.commenting = false;
                location.href = `/issue/?id=${res.data.number}`;
            }).catch((err) => {
                ElementPlus.ElMessage.error(`提交失败：${err}`);
                this.commenting = false;
            });
        }
    },
    template: '#editissue'
})
app.mount('#app');