angular.module('starter.services', [])

  //コントローラ間スコープ共有factory  
  .factory('SHARE_SCOPE', function ($rootScope) {
    var sharedScopes = {};
    return {
      setScope: function (key, value) {
        sharedScopes[key] = value;
      },
      getScope: function (key) {
        return sharedScopes[key];
      }
    };
  })

  //コントローラ間データ共有factory
  .factory('SHARE_DATA', function () {
    var SharedDatas = {};
    return {
      setData: function (key, value) {
        SharedDatas[key] = value;
      },
      getData: function (key) {
        return SharedDatas[key];
      }
    };
  })

  //共通関数
  .factory('SERVICE_COMMON', function ($state, $timeout, $ionicPopup, $ionicLoading, $ionicHistory) {

    return {
      //パラメータの値を返却
      getParameter: function (paramName) {
        //検証フラグを確認
        var verificationFlg = localStorage.getItem('verificationFlg');
        var params = JSON.parse(localStorage.getItem('Parameter'));
        paramValue = Enumerable.from(params).where(x => x.param_key == paramName && x.param_veryfy == verificationFlg).first().param_value;
        console.log(paramValue);
        return paramValue;
      },
        //cordova-plugin-healthで使用するパラメータ
        getHealthParam: function () {
            var dataTypes = [
                {
                    read: ['steps', 'height', 'weight'],// Read only permission 歩数、身長、体重
                }
            ];
            return dataTypes;
        },      
      //ページ移動　移動時、前画面の情報を保持
      MovePage: function (page) {
        console.log(page);
        var pagename = $state.current.name;
        localStorage.setItem("history_page", pagename);
        //センターボタン配色変更
        if (page.indexOf('#/tab/top') >= 0) {
          $('#tab-center').removeClass('tab-center-nonactive');
        } else {
          $('#tab-center').addClass('tab-center-nonactive');
        }
        //安定動作のため300ms後に遷移(localstrage関連)
        $timeout(function () {
          location.href = page;
          $ionicHistory.clearCache();
        }, 100);
      },

      //ポインターナビゲート(指定要素の中にポイントナビゲーションを追加)
      pointerNavi: function (vector, elem, param = {}) {
        var pointer;
        switch (vector) {
          case 'up':
            pointer = $(`<div class="slide-navigater-${vector}">
                        <div class="arrow ${vector}"></div><div class="pointer"></div>
                      </div>`);
            break;
          case 'down':
            pointer = $(`<div class="slide-navigater-${vector}">
                        <div class="pointer"></div><div class="arrow ${vector}"></div>
                      </div>`);
            break;
          case 'left':
            pointer = $(`<div class="disp-inflex slide-navigater-${vector}">
                        <div class="arrow ${vector}">
                        </div><div class="pointer"></div>
                      </div>`);
            break;
          case 'right':
            pointer = $(`<div class="disp-inflex slide-navigater-${vector}">
                        <div class="pointer"></div>
                        <div class="arrow ${vector}"></div>
                      </div>`);
            break;
        }

        if (param != "") {
          //パラメータがある場合はPosition:absoluteにする
          elem.addClass('pos-rel');
          pointer.addClass('pos-abs');
          pointer.css(param);
        }
        pointer.appendTo(elem);
      },

      //標準ポップアップ
      popup: function (text, $scope = null) {
        var show = $ionicPopup.show({
          title: 'メッセージ',
          scope: $scope,
          template: text,
          buttons: [{
            text: '閉じる',
            type: 'btn-color03'
          }]
        });
      },
      //ポイント交換ポップアップ
      exchangepopup: function (text,b, $scope = null) {
        var show = $ionicPopup.show({
          title: 'メッセージ',
          scope: $scope,
          template: text,
          buttons: [{
            text: 'クーポン券一覧',
            type: 'btn-color03',
            onTap: function(e){
                b();
            }
          }]
        });
      },
      //基本チェックリストポップアップ
      checklistpopup: function (text, $scope = null) {
        var show = $ionicPopup.show({
          title: '判定結果',
          scope: $scope,
          template: `<div class="h-50p">${text}</div>`,
          buttons: [{
            text: '閉じる',
            type: 'btn-color03'
          }]
        });
      },
      //QRコードポップアップ
      qrpopup: function (text, $scope = null) {
        var show = $ionicPopup.show({
          title: 'スタンプ付与',
          scope: $scope,
          template: `<div id="img-qr" class="al-center"></div>
                    <p class="mx-0 mt-10">QRコードを、参加者に見せてください。<br>参加者はホーム画面の「スタンプをもらう」をタップし、QRコードを読み込んでください。</p>`,
          buttons: [{
            text: '閉じる',
            type: 'btn-color03'
          }]
        });
        $timeout(function(){
        $("#img-qr").html("");
        $("#img-qr").qrcode({width:200,height:200,text:text});
        },300)

      },
      //活動修正・削除ポップアップ
      activitypopup: function (popActivity,flg,a) {
        if (flg == 0){
            //修正
            var title = `活動を修正します。<br>よろしいですか。`;
            var text = '<g>修正</g>'
        }else{
            //削除
            var title = `活動内容：${popActivity['title']}<br>活動日：${popActivity['start_date']}<br>の活動を削除します。<br>よろしいですか。`;
            var text = '<g>削除</g>'
        }
        //ポップアップ表示
        var myPopup = $ionicPopup.show({
          template: title,
          title: '確認',
          subTitle: '',
          buttons: [
            { text: '中止' }, {
              text: text,
              type: 'btn-color01',
              onTap: function (e) {
                a();
              }
            }
          ]
        });
      },
      //活動警告ポップアップ
      popupAlert: function (popActivity,a) {
        var title = `活動内容「${popActivity['title']}」<br>活動日：${popActivity['start_date']}<br>の実績を作成します。<br>実績を作成すると活動されたことになりますが、よろしいですか。`;
        //ポップアップ表示
        var myPopup = $ionicPopup.show({
          template: title,
          title: '確認',
          subTitle: '',
          buttons: [
            { text: '中止',
              type: 'btn-color02' }, {
              text: '<g>作成</g>',
              type: 'btn-color01',
              onTap: function (e) {
                a();
              }
            }
          ]
        });
      },
      //ポイント交換警告ポップアップ
      popupPointAlert: function (msg,a) {
        var title = msg;
        //ポップアップ表示
        var myPopup = $ionicPopup.show({
          template: title,
          title: '確認',
          subTitle: '',
          buttons: [
            { text: '中止',
              type: 'btn-color02' }, {
              text: '<g>交換</g>',
              type: 'btn-color01',
              onTap: function (e) {
                a();
              }
            }
          ]
        });
      },
      //ポイント交換警告ポップアップ
      popupGroupHikitsugi: function (msg,a,b) {
        var title = msg;
        //ポップアップ表示
        var myPopup = $ionicPopup.show({
          template: title,
          title: '確認',
          subTitle: '',
          buttons: [
            { text: 'いいえ',
              type: 'btn-color02',
              onTap: function(e) {
                  b();
              }}, {
              text: '<g>はい</g>',
              type: 'btn-color01',
              onTap: function (e) {
                a();
              }
            }
          ]
        });
      },
      //ユーザエラーポップアップ
      popupUserRegError: function (text) {
        var show = $ionicPopup.show({
          title: 'メッセージ',
          template: text,
          buttons: [{
            text: 'チュートリアルへ',
            type: 'btn-color03',
            onTap: function () {
              var pagename = $state.current.name;
              localStorage.setItem("history_page", pagename);
              //センターボタン配色変更
              $('#tab-center').addClass('tab-center-nonactive');

              //安定動作のため300ms後に遷移(localstrage関連)
              $timeout(function () {
                location.href = '#/tab/tutorial/';
                $ionicHistory.clearCache();
              }, 100);
            }
          }]
        });
      },
      //トースト表示
      toast: function (message, Backdrop) {
        $ionicLoading.show({
          template: message,
          animation: 'fade-in',
          noBackdrop: Backdrop,
          duration: 1500
        });
      },

      //ロードgif表示
      loading: function (backdrop = true) {
        $ionicLoading.show({
          content: 'Loading',
          animation: 'fade-in',
          showBackdrop: backdrop,
          maxWidth: 200,
          showDelay: 0
        });
      },

      //ロード完了
      loading_comp: function () {
        $ionicLoading.hide();
      },

      //ブラウザを立ち上げる
      invokeBrowser: function (url) {
        cordova.InAppBrowser.open(url, '_system');
      },

      //電話を立ち上げる
      invokePhone: function (tel) {
        cordova.InAppBrowser.open('tel:' + tel, '_system');
      },

      //メールを立ち上げる
      invokeMail: function (mail) {
        cordova.InAppBrowser.open('mailto:' + mail, '_system');
      },

      //バーコードリーダ設定
      BarcodeScanSetting: function (msg) {
        return {
          preferFrontCamera: false, // iOS and Android
          showFlipCameraButton: false, // iOS and Android
          showTorchButton: true, // iOS and Android
          torchOn: false, // Android, launch with the torch switched on (if available)
          saveHistory: false, // Android, save scan history (default false)
          prompt: msg, // Android
          resultDisplayDuration: 300, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
          //formats: "EAN_13", // default: all but PDF_417 and RSS_EXPANDED CODABAR,JAN
          orientation: "portrait", // Android only (portrait|landscape), default unset so it rotates with the device
          disableAnimations: true, // iOS
          disableSuccessBeep: false // iOS and Android
        }
      },

      //年～時までの値(画像のキャッシュ回避用)
      getYtoS: function () {
        var YtoS = moment().format('YYYYMMDDHHmmss');
        return '?d=' + YtoS;
      },

      //要素が空かどうか
      isset: function (data) {
        if (data == "" || data == null || data == undefined) {
          return false;
        } else {
          return true;
        }
      },

      //$.ajaxのオプション(POST送信)
      getAjaxOption: function (url, data) {
        var param = data;
        var shaObj = new jsSHA("SHA-256", "TEXT");
        shaObj.update(moment().format('YYYYMMDDHH'));
        if(param != null){
          param.hashPass = shaObj.getHash("HEX");
        }else{
          param = {"hashPass":shaObj.getHash("HEX")};
        }
        console.log(JSON.stringify(param));
        var option = {
          type: "POST",
          url: url,
          data: JSON.stringify(param),
          cache: false,
          async: true,
          processData: false,
          contentType: 'application/json'
        }
        return option;
      },
      //エラーログを登録
      regErrorLog: function (text) {
        //APIを取得
        var params = JSON.parse(localStorage.getItem('Parameter'));
        var url = Enumerable.from(params).where(x => x.param_key == 'api_reg_errorlog').first().param_value;
        //個人設定を取得
        var personal = JSON.parse(localStorage.getItem('Personal'));
        if (!(personal == "" || personal == null || personal == undefined)) {
          var query = {
            log_level: 'error',
            user_id: personal['user_id'],
            comment: text,
          }
          $.ajax({
            type: "POST",
            url: url,
            data: JSON.stringify(query),
            cache: false,
            async: true,
            processData: false,
            contentType: 'application/json'
          })
            .done(function (data, textStatus, jqXHR) {
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
            });
        }
      },

      /*画像の縮小
      *file:縮小対象の画像
      *canvasid:画像の表示領域のid
      *canvastempid:画像の表示領域のid
      *処理の流れ
      *１．選択された画像を読み込む
      *２．縦長・横長の画像を考慮するため、画像の描写位置を計算
      *３．読み込まれた画像を120×120の円形でトリミング
      *４．canvasに描写
      *５．blobで画像データを返却
      */
      imageShrink: function (file, canvasid, canvastempid, callback) {
        // 画像をリサイズする
        var blob = null; // 画像(BLOBデータ)
        const THUMBNAIL_WIDTH = 120; // 画像サイズ最大幅(表示用)
        const THUMBNAIL_HEIGHT = 120; // 画像サイズ最大高(表示用)
        const TRIM_SIZE = 120;
        const temp_THUMBNAIL_WIDTH = 240; // 画像サイズ最大幅(表示用)
        const temp_THUMBNAIL_HEIGHT = 240; // 画像サイズ最大高(表示用)
        const temp_TRIM_SIZE = 240;

        var image = new Image();
        var reader = new FileReader();

        //ファイルの読み込み開始
        reader.readAsDataURL(file);

        //ファイル読み込み完了
        reader.onload = function (e) {
          //ソースの設定
          image.src = e.target.result;

          //画像ファイル読み込み完了
          image.onload = function () {
            /**********************
             * 画面表示用のアイコン
            ***********************/
            //canvas要素の取得
            var canvas = $('#' + canvasid);
            var ctx = canvas[0].getContext('2d');
            // canvasに既に描画されている画像をクリア
            ctx.clearRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
            //描写位置の計算
            var width, height, xOffset, yOffset;
            if (image.width > image.height) {
              //横長の場合
              height = TRIM_SIZE;
              width = image.width * (TRIM_SIZE / image.height);
              xOffset = -(width - TRIM_SIZE) / 2;
              yOffset = 0;
            } else {
              //縦長の場合
              width = TRIM_SIZE;
              height = image.height * (TRIM_SIZE / image.width);
              yOffset = -(height - TRIM_SIZE) / 2;
              xOffset = 0;
            }
            //120×120で円形にトリミング
            ctx.beginPath();
            ctx.arc(60, 60, 60, 0 * Math.PI / 180, 360 * Math.PI / 180);
            ctx.clip();
            //canvasに描写
            console.log('xOff:' + xOffset + ' yOff:' + yOffset);
            ctx.drawImage(image, xOffset, yOffset, width, height);

            /**********************
             * 保存用のアイコン
            ***********************/
            //tempのcanvasにも同様の画像を描写し、そこからbase64データを取得する
            //2回目の登録の場合、すでにcanvasにはhttpで取得した画像を描写している。CrossOriginの云々でSecurityErrorになるためその対策
            var temp_canvas = $('#' + canvastempid);
            var temp_ctx = temp_canvas[0].getContext('2d');
            // canvasに既に描画されている画像をクリア
            temp_ctx.clearRect(0, 0, temp_THUMBNAIL_WIDTH, temp_THUMBNAIL_HEIGHT);
            //描写位置の計算
            var width, height, xOffset, yOffset;
            if (image.width > image.height) {
              //横長の場合
              height = temp_TRIM_SIZE;
              width = image.width * (temp_TRIM_SIZE / image.height);
              xOffset = -(width - temp_TRIM_SIZE) / 2;
              yOffset = 0;
            } else {
              //縦長の場合
              width = temp_TRIM_SIZE;
              height = image.height * (temp_TRIM_SIZE / image.width);
              yOffset = -(height - temp_TRIM_SIZE) / 2;
              xOffset = 0;
            }
            //240×240で円形にトリミング
            temp_ctx.beginPath();
            temp_ctx.arc(120, 120, 120, 0 * Math.PI / 180, 360 * Math.PI / 180);
            temp_ctx.clip();
            temp_ctx.drawImage(image, xOffset, yOffset, width, height);

            // canvasからbase64画像データを取得
            var base64 = temp_canvas[0].toDataURL("image/png");
            callback(base64);

          }//image.onload
        }//reader.onload
      }
    }
  });








