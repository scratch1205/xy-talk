marked.setOptions({
    highlight: function (code) {
        return hljs.highlightAuto(code).value;
    }
});
const accessToken = localStorage.getItem('github-token');
if (accessToken != undefined) {
    axios.defaults.headers.common['Authorization'] = accessToken;
}
const issueId = (new URL(document.location)).searchParams.get('id');
const app = Vue.createApp({});
app.use(ElementPlus);
for (let i in ElementPlusIconsVue) {
    app.component(i, ElementPlusIconsVue[i]);
}
app.component('md-editor', MarkdownEditor);
app.component('gutalk-issue', {
    data() {
        return {
            isLogin: accessToken != undefined,
            isAdmin: localStorage.getItem('isAdmin'),
            myUsername: localStorage.getItem('username'),
            user: '',
            content: false,
            comments: false,
            commenting: false,
            locking: false,
        }
    },
    mounted() {
        if (accessToken != undefined) {
            axios.get('https://api.github.com/user').then(() => {
                this.isLogin = true;
            }).catch(() => {
                this.isLogin = false;
                delete axios.defaults.headers.common['Authorization'];
            });
        }
        axios.get(`https://api.github.com/repos/gutalk-website/issue-repo/issues/${issueId}`).then((res) => {
            this.content = res.data;
            this.user = res.data.user.login;
        }).catch((err) => {
            ElementPlus.ElMessage.error(`获取数据失败：${err}`);
        });
        axios.get(`https://api.github.com/repos/gutalk-website/issue-repo/issues/${issueId}/comments`).then((res) => {
            this.comments = res.data;
        }).catch((err) => {
            ElementPlus.ElMessage.error(`获取数据失败：${err}`);
        });
    },
    methods: {
        marked(str) {
            return str == null ? '' : marked.parse(str);
        },
        comment(str) {
            this.commenting = true;
            axios.post(
                `https://api.github.com/repos/gutalk-website/issue-repo/issues/${issueId}/comments`,
                JSON.stringify({ 'body': str })
            ).then((res) => {
                this.comments.push(res.data);
                this.$refs.editor.clear();
                ElementPlus.ElMessage.success('发送成功！');
                this.commenting = false;
            }).catch((err) => {
                ElementPlus.ElMessage.error(`提交失败：${err}`);
                this.commenting = false;
            });
        },
        edit() {
            location.href = `/edit/?id=${issueId}`;
        },
        lock() {
            this.locking = true;
            axios[this.content.locked ? 'delete' : 'put'](
                `https://api.github.com/repos/gutalk-website/issue-repo/issues/${issueId}/lock`,
            ).then(() => {
                ElementPlus.ElMessage.success('操作成功！');
                this.locking = false;
                location.reload();
            }).catch((err) => {
                ElementPlus.ElMessage.error(`操作失败：${err}`);
                this.locking = false;
            });
        }
    },
    template: '#issue'
})
app.mount('#app');