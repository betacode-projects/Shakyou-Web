const API_URL = 'http://hirosuke-pi.tplinkdns.com:45829';
const MB = mb = 1024 ** 2;
let self = null;

let app = new Vue({
    el: '#app',
    data: { 
        file_selected: false,
        file_uploading: false,
        is_download: false,
        is_enter: false,

        upload_text: 'PDFをアップロード',
        file_name: '',
        status: '',
        error_text: '',
        success_text: '',
        download_link: '',
        download_name: '',
        file_value: '',

        progress_value: 100,
        progress_status: ''
    },
    methods: {
        showUploadDialog: function(){
            // アップロードチェック
            if (this.file_uploading) return;
            else if (this.file_selected) return this.removePdfFile();

            this.$refs.uploadBt.click();
        },

        asyncReadPdf: function(input){
            self.progress_status = '送信の準備中...';

            // ファイルチェック
            if (!(input.target.files && input.target.files[0])) return this.removePdfFile();
            else if (!this.checkFile(input.target.files[0])) return this.removePdfFile();

            // 表示項目設定
            this.file_name = input.target.files[0].name;
            this.error_text = '';
            this.success_text = '';

            // PDFファイル送信
            this.selectedPdfFile();
            this.asyncSendPdf(new FormData(this.$refs.upload));

        },

        checkFile: function(thisfile){
            // 10MB以下のファイルかどうか
            if (thisfile.size >= 10485760){
                this.error_text = '10MBを超えるファイルはアップロードできません';
                this.removePdfFile();
                return false;
            }
            else if (thisfile.type !== 'application/pdf'){
                this.error_text = 'PDFファイル以外はアップロードできません';
                this.removePdfFile();
                return false;
            }

            return true;
        },

        removePdfFile: function(){
            this.upload_text = 'PDFをアップロード';
            this.file_selected = false;
            this.is_enter = false;
            this.download_link = '';
            this.success_text = '';
            self.file_value = '';
        },

        selectedPdfFile: function(){
            this.upload_text = '<i class="fas fa-trash-alt"></i> 削除';
            this.progress_value = 100;
            this.file_selected = true;
            this.file_uploading = true;
        },

        asyncSendPdf: function(form_data){
            axios.post(API_URL +'/convert-pdf', form_data, { onUploadProgress: this.onUpload })
            .then(function(res) {
                let data = res['data'];
                console.log(data);
                if (data['status'] === 'success'){
                    self.download_link = API_URL +'/download?id='+ data['zip-id']+'&name='+ data['filename'];
                    self.success_text = data['msg-jp'];
                    self.download_name = data['filename'] + '.zip';
                    self.progress_status = '完了';
                }
                else{
                    self.error_text = data['msg-jp'];
                    self.progress_status = 'エラー';
                }
            }).catch(function(res){
                console.log(res);
                self.error_text = 'APIサーバーに接続できませんでした。しばらくたってからアップロードしてください';
                self.progress_status = 'エラー';
            }).then(function(){
                self.file_uploading = false;
            });
        },

        onUpload: function(e){
            progress = Math.round((e.loaded / e.total)*100);
            self.progress_value = progress;
            self.progress_status = 'アップロード中: '+ progress +'% | '+ Math.round((e.loaded / MB) * 100) / 100 +'MB / '+ Math.round((e.total / MB) * 100) / 100 +'MB';
            
            if (progress >= 100){
                self.progress_status = 'ファイルを解析中...';
            }
        }
    },

    mounted: function(){
        self = this;
    }
});