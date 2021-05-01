let upload_flag = false;
let download_link = '';
let API_URL = 'http://hirosuke-pi.tplinkdns.com:45829';
//let API_URL = 'http://localhost:45829'

function readURL(input) {
  if (input.files && input.files[0]) {
    $('.file-upload-btn').attr('onclick', 'removeUpload();');

    var reader = new FileReader();

    reader.onload = function(e) {
      $('.image-upload-wrap').hide();
      $('.file-upload-content').show();

      $('.image-title').html(input.files[0].name);
      $('.image-upload-wrap').removeClass('image-dropping');
      
      sendPdfFile();
    };
    $('.file-upload-btn').html('<i class="fas fa-trash-alt"></i> 削除');
    reader.readAsDataURL(input.files[0]);

  } else {
    removeUpload();
  }
}

function removeUpload() {
  $('.download-link').css('display', 'none');
  $('#error').css('display', 'none');
  $('#success').css('display', 'none');
  $('.file-upload-btn').html('PDFをアップロード');
  $('.file-upload-btn').attr('onclick', "$('.file-upload-input').trigger('click')");
  $('.file-upload-input').replaceWith($('.file-upload-input').clone());
  $('.file-upload-content').hide();
  $('.image-upload-wrap').show();
  $('#file').val('');

}

$('.image-upload-wrap').bind('dragover', function () {
    $('.image-upload-wrap').addClass('image-dropping');
  });
  $('.image-upload-wrap').bind('dragleave', function () {
    $('.image-upload-wrap').removeClass('image-dropping');
});



function sendPdfFile() {
  // 多重送信を防ぐため通信完了までボタンをdisableにする

  let fd = new FormData($('#upload').get(0));
  $('#file').prop('disabled', true);

  if ($('#file')[0]['files'][0].size >= 10485760){
    $('#error').html('10MBを超えるファイルはアップロードできません');
    $('#error').css('display', 'block');
    $('#file').prop('disabled', false);
    $('#file').val('');
    return false;
  }

  if ($('#file')[0]['files'][0].type !== 'application/pdf'){
    $('#error').html('PDFファイル以外はアップロードできません');
    $('#error').css('display', 'block');
    $('#file').prop('disabled', false);
    $('#file').val('');
    return false;
  }

  if (fd === undefined || upload_flag){
      return false;
  }
  //console.log($('#file')[0]['files'][0].type);

  upload_flag = true;
  $('#error').css('display', 'none');
  $('#success').css('display', 'none');
  $('.progress-bar').html('送信準備中...');
  $('.progress-bar').removeClass("bg-danger");
  $('.progress-bar').removeClass("bg-success");
  $('.progress-bar').addClass("progress-bar-animated");

  $.ajax({
      url:  API_URL +'/convert-pdf',
      type: "POST",
      data: fd,
      processData: false,
      contentType: false,
      dataType: 'json',
      timeout: 60000,
      xhr: function () {
          var xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener("progress", function (evt) {
              if (evt.lengthComputable) {
                  var percentComplete = evt.loaded / evt.total;
                  //console.log(percentComplete);
                  $('.progress-bar').css({
                      'width': percentComplete * 100 + '%',
                  });
                  $('.progress-bar').attr('aria-valuenow', percentComplete * 100);
                  
                  var mb = 1024 ** 2;
                  
                  $('.progress-bar').html('アップロード中: '+ Math.round((percentComplete * 100)) +'% | '+ Math.round((evt.loaded / mb) * 100) / 100 +'MB / '+ Math.round((evt.total / mb) * 100) / 100 +'MB');
                  if (percentComplete === 1) {
                      $('.progress-bar').html('PDF解析中...');
                  }
              }
          }, false);
          return xhr;
      },

  }).done(function(data) {
      console.log(data);
      
      if (data['status'] === 'success'){
          $('.download-link').attr('href', API_URL +'/download?id='+ data['zip-id']+'&name='+ data['filename']);
          $('.download-link').html('<i class="fas fa-download"></i> ' +data['filename']+'.zip');

          $('.download-bt').css('display', 'block');
          $('#success').css('display', 'block');
          $('#success').html(data['msg-jp']);
          $('.progress-bar').html('変換完了');
          $('.progress-bar').addClass("bg-success");
      }
      else{
          $('#error').html(data['msg-jp']);
          $('.progress-bar').html('エラー');
          $('.progress-bar').addClass("bg-danger");
          $('#error').css('display', 'block');
      }

  }).fail(function(data){
      $('#error').html('APIサーバーに接続できませんでした。しばらくたってからアップロードしてください');
      $('.progress-bar').html('サーバーエラー');
      $('.progress-bar').addClass("bg-danger");
      $('#error').css('display', 'block');

  }).always(function(data){
      upload_flag = false;
      $('#file').prop('disabled', false);
      $('#file').val('');
      $('.progress-bar').removeClass("progress-bar-animated");
  });
};
