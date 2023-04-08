MarkdownEditor = {
    data() {
        return {
            content: '',
            view: '',
            show: false,
            load: false,
            repoList: [],
            repo: localStorage.getItem('img-repo'),
            branchList: [],
            branch: localStorage.getItem('img-branch'),
            imgUrl: '',
            pasteImgLoading: false
        }
    },
    props: ['loading', 'rows'],
    emits: ['submit'],
    expose: ['clear', 'set'],
    mounted() {
        axios.get('https://api.github.com/user/repos?visibility=public').then((res) => {
            this.repoList = res.data;
            this.load = false;
        }).catch((err) => {
            ElementPlus.ElMessage.error(`用户仓库列表获取失败：${err}`);
        });
        if (this.repo != null) {
            this.choose(this.repo);
        }
    },
    methods: {
        insert1(str) {
            function insertString(soure, start, newStr) {
                return soure.slice(0, start) + newStr + soure.slice(start);
            }
            let edit = this.$refs.edit.textarea;
            let posStart = edit.selectionStart;
            let posEnd = edit.selectionEnd;
            this.content = insertString(this.content, posStart, str);
            this.$refs.edit.blur();
            setTimeout(() => {
                edit.selectionStart = posStart + str.length, edit.selectionEnd = posEnd + str.length;
                this.$refs.edit.focus();
            });
        },
        insert2(str1, str2) {
            function insertString(soure, start1, start2, str1, str2) {
                return soure.slice(0, start1) + str1 + soure.slice(start1, start2) + str2 + soure.slice(start2);
            }
            let edit = this.$refs.edit.textarea;
            let posStart = edit.selectionStart;
            let posEnd = edit.selectionEnd;
            this.content = insertString(this.content, posStart, posEnd, str1, str2);
            this.$refs.edit.blur();
            setTimeout(() => {
                edit.selectionStart = posStart + str1.length, edit.selectionEnd = posEnd + str1.length;
                this.$refs.edit.focus();
            });
        },
        header() {
            this.insert2('\n### ', '\n');
        },
        bold() {
            this.insert2('**', '**');
        },
        italic() {
            this.insert2('*', '*');
        },
        ref() {
            this.insert2('\n> ', '\n> \n');
        },
        code() {
            this.insert2('```', '```');
        },
        list() {
            this.insert2('\n+ ', '\n+ \n');
        },
        link() {
            ElementPlus.ElMessageBox.prompt('输入URL', '创建超链接').then(({ value }) => {
                if (value != null && value != '') {
                    this.insert2('[', `](${value})`);
                }
            }).catch(() => { });
        },
        img() {
            this.show = false;
            if (this.imgUrl != '') {
                this.insert2('![', `](${this.imgUrl})`);
            }
        },
        preview() {
            this.view = marked.parse(this.content);
        },
        submit() {
            this.$emit('submit', this.content);
        },
        clear() {
            this.content = '';
        },
        set(str) {
            this.content = str;
        },
        choose(val) {
            this.load = true;
            localStorage.setItem('img-repo', val);
            axios.get(`https://api.github.com/repos/${val}/branches`).then((res) => {
                this.branchList = res.data;
                this.load = false;
            }).catch((err) => {
                ElementPlus.ElMessage.error(`仓库分支列表获取失败：${err}`);
            });
        },
        cbranch(val) {
            localStorage.setItem('img-branch', val);
        },
        upload(e) {
            this.load = true;
            let file = e.target.files[0];
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                let filename = Math.random();
                axios.put(
                    `https://api.github.com/repos/${this.repo}/contents/img/${filename}`,
                    {
                        'message': 'upload image',
                        'content': reader.result.substring(reader.result.search('base64,') + 7),
                        'branch': this.branch
                    }
                ).then(() => {
                    this.imgUrl = `https://cdn.jsdelivr.net/gh/${this.repo}@${this.branch}/img/${filename}`;
                    ElementPlus.ElMessage.success('上传成功！');
                    this.load = false;
                }).catch((err) => {
                    ElementPlus.ElMessage.error(`上传失败：${err}`);
                    this.load = false;
                });
            };
        },
        paste(e) {
            let items = e.clipboardData.items;
            let file = null;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    file = items[i].getAsFile();
                    break;
                }
            }
            if (file && this.repo && this.branch) {
                this.pasteImgLoading = true;
                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    let filename = Math.random();
                    axios.put(
                        `https://api.github.com/repos/${this.repo}/contents/img/${filename}`,
                        {
                            'message': 'upload image',
                            'content': reader.result.substring(reader.result.search('base64,') + 7),
                            'branch': this.branch
                        }
                    ).then(() => {
                        let imgUrl = `https://cdn.jsdelivr.net/gh/${this.repo}@${this.branch}/img/${filename}`;
                        this.insert2('![', `](${imgUrl})`);
                        ElementPlus.ElMessage.success('上传成功！');
                        this.pasteImgLoading = false;
                    }).catch((err) => {
                        ElementPlus.ElMessage.error(`上传失败：${err}`);
                        this.pasteImgLoading = false;
                    });
                };
            }
        }
    },
    template: `
    <div>
        <el-tabs @tab-change="preview" type="border-card" v-loading="pasteImgLoading">
            <el-tab-pane label="编辑">
                <el-input @paste="paste" ref="edit" v-model="content" :rows="rows" type="textarea"
                    placeholder="Markdown..." input-style="font-family: Droid Sans Mono;"></el-input>
            </el-tab-pane>
            <el-tab-pane label="预览">
                <div style="margin: 3px; margin-bottom: 10px;" class="markdown-body" v-html="view"></div>
            </el-tab-pane>
            <el-button-group style="margin-top: 5px;">
                <el-tooltip content="标题" placement="top">
                    <el-button @click="header"><strong>Ｈ</strong></el-button>
                </el-tooltip>
                <el-tooltip content="加粗" placement="top">
                    <el-button @click="bold"><strong>Ｂ</strong></el-button>
                </el-tooltip>
                <el-tooltip content="斜体" placement="top">
                    <el-button @click="italic" style="font-style: italic;">B</el-button>
                </el-tooltip>
                <el-tooltip content="引用" placement="top">
                    <el-button @click="ref" icon="Expand"></el-button>
                </el-tooltip>
                <el-tooltip content="代码" placement="top">
                    <el-button @click="code" icon="Edit"></el-button>
                </el-tooltip>
                <el-tooltip content="列表" placement="top">
                    <el-button @click="list" icon="List"></el-button>
                </el-tooltip>
                <el-tooltip content="链接" placement="top">
                    <el-button @click="link" icon="Link"></el-button>
                </el-tooltip>
                <el-tooltip content="图片" placement="top">
                    <el-button @click="show=true" icon="Picture"></el-button>
                </el-tooltip>
            </el-button-group>
            <el-link href="https://markdown.com.cn/basic-syntax/" :underline="false"
                style="margin-left: 10px; margin-top: 5px;">Markdown基本语法</el-link>
            <el-button :loading="loading" @click="submit" type="primary" round
                style="margin-top: 5px; float: right;">提交</el-button>
        </el-tabs>
        <el-dialog v-model="show" draggable>
            <template #header>
                添加图片
            </template>
            <div style="font-size: 14px;" v-show="repo==null">
                支持使用Github仓库存储图片，或者你也可以使用其他图床
            </div>
            <el-row v-loading="load">
                <el-col :span="16">
                    <el-select @change="choose" v-model="repo" style="width: 100%;" filterable placeholder="选择作为图床的仓库">
                        <el-option v-for="i in repoList" :value="i.full_name"></el-option>
                    </el-select>
                </el-col>
                <el-col :span="8">
                    <el-select v-show="repo!=null" v-model="branch" @change="cbranch"
                        style="width: 100%;" placeholder="选择一个分支">
                        <el-option v-for="i in branchList" :value="i.name"></el-option>
                    </el-select>
                </el-col>
                <el-col :span="24">
                    <input type="file" accept="image/*" style="margin-top: 11px;" v-show="repo!=null&&branch!=null" @change="upload" />
                </el-col>
            </el-row>
            <template #footer>
                <el-input v-model="imgUrl" placeholder="图片链接" clearable>
                    <template #append>
                        <el-button @click="img">确认</el-button>
                    </template>
                </el-input>
            </template>
        </el-dialog>
    </div>`
}