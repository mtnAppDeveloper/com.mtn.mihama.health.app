angular.module('starter.controllers', [])

    //画面共通処理
    .controller('CommonCtrl', function ($scope, $state, $timeout, $ionicLoading, $ionicHistory, $ionicPopup, SERVICE_COMMON) {
        //デバイスレディを登録
        document.addEventListener("deviceready", onDeviceReady, false);
        //キーボードが非表示になるときにタブを表示する
        window.addEventListener('keyboardWillHide', (event) => {
            console.log(event.keyboardHeight);
            $('.tab-nav').css('display', 'flex');
        });

        //デバイスレディ後の処理
        function onDeviceReady() {
            console.log('on DeviceReady');

            //OS依存の文字サイズを無視する
            window.MobileAccessibility.usePreferredTextZoom(false);

            //iphoneM字対策
            StatusBar.overlaysWebView(false);

            //初回起動時、ローカルストレージの初期化
            var isOpen = localStorage.getItem("isOpen");
            console.log('isOpen:' + isOpen);
            //開発者メニュー表示フラグ
            localStorage.setItem('devModeFlg', '0');
            if (null == isOpen || 0 == isOpen) {
                //検証モード切替フラグ
                localStorage.setItem('verificationFlg', '0');
                //Push通知設定の初期化
                localStorage.setItem('EnablePush', true);
                //プッシュ通知用トークンのストレージを作成
                localStorage.setItem('FCMToken', null);
                //Fit情報の初期化
                localStorage.setItem('GFit_step', 0);
                //Fit情報の初期化
                localStorage.setItem('Last_Step', 0);       
                //前回起動日の初期化
                localStorage.setItem('Last_Launch', moment().format('YYYY/MM/DD'));         
                //お知らせ最終確認日
                localStorage.setItem('LastNewsDate', moment().format('YYYY/MM/DD'));
                //規約同意済みか
                localStorage.setItem("KiyakuAgree", "0");
                //個人情報
                localStorage.setItem('Personal', null);
                //既読チェック(町)
                localStorage.setItem('kidokuNews', null);
                //既読チェック(活動)
                localStorage.setItem('kidokuActivity', null);
                //高齢者フラグ
                localStorage.setItem('oldPerson', 0);
                //若者フラグ
                localStorage.setItem('youngPerson', 0);
                //高齢者(団体認証なし)フラグ
                localStorage.setItem('GroupCertification', 0);
                //チュートリアルフラグ
                localStorage.setItem('Tutorial', 0);
                //招待（サポータ企業）コード
                localStorage.setItem('invite', null);
            }

            //これがないとちゃんとホットパッチが適用されたことにならないみたい
            //window.codePush.notifyApplicationReady();

            //設定ファイルを取得する
            // var url = "https://appdevelopers.mtn.co.jp/mihama-healthapp/api/api-getParameter.php";
            var url = "https://mihama-aiai.pupu.jp/mihama-healthapp/api/api-getParameter.php";
            $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        //ローカルストレージに格納
                        localStorage.setItem('Parameter', JSON.stringify(data['data']));
                        //console.log(localStorage.getItem('Parameter'));
                        //初期化処理
                        $timeout(function () {
                            $scope.deviceInit();
                        }, 100);

                    } else {
                        SERVICE_COMMON.toast(data['msg']);
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    console.log(JSON.stringify(jqXHR));
                });
            console.log('on Device Ready Finish');
        }

        //初期化処理
        $scope.deviceInit = function () {
            //メンテナンス中か判断
            var isMaintenance = SERVICE_COMMON.getParameter('option_maintenance_flg');
            if (isMaintenance == 1) {
                //メンテナンス中なので処理を行わない
                //splashを非表示にする。
                navigator.splashscreen.hide();
                //メンテナンス画面へ遷移
                var myPopup = $ionicPopup.show({
                    title: '<p class="color-white">メンテナンス中です</p>',
                    template: '<p class="font-bold">現在メンテナンス中です。メンテナンス中はアプリを利用することができません。ご了承ください。</p>',
                    buttons: []
                });
                return false;
            }

            //現在のアプリのバージョンとサーバに登録されているバージョン（最新）を比較する
            cordova.getAppVersion.getVersionNumber(function (version) {
                //最新バージョンを取得
                var latestVersion = SERVICE_COMMON.getParameter('option_app_version');
                console.log(`${version} ==== ${latestVersion}`);
                if (version != latestVersion) {
                    //バージョンが異なる場合はストアへ飛ばす
                    var myPopup = $ionicPopup.show({
                        title: '<p class="color-white">アップデートがあります</p>',
                        template: '<p class="font-bold">新しいバージョンが配信されています。<br>アップデートを適用しないと正常に動作しない場合がありますのでアップデートをお願いします。</p>',
                        buttons: [
                            { text: '無視', type: 'btn-color99', },
                            {
                                text: 'ストアへ', type: 'btn-color01',
                                onTap: function (e) {
                                    var url = SERVICE_COMMON.getParameter('url_invite');
                                    SERVICE_COMMON.invokeBrowser(url);
                                }
                            }
                        ]
                    });
                } else {
                    //ホットパッチを確認する
                    //checkHotPatch();
                }
                //splashを非表示にする。
                navigator.splashscreen.hide();
            });

            //splashを非表示にする。
            navigator.splashscreen.hide();

            //キーボードのエンターを入力した時閉じるように
            $('input').keypress(function (e) {
                if (e.which == 13) {
                    // スマホのキーボードを閉じる
                    $('#' + e.target.id).blur();
                    return false;
                }
            });

            //20231214 高齢者用先行アップデート対応のため、ヘルスケア・Fit連携を一時解除 start

            // Google FitまたはHealthKitが利用可能かどうかを判断します。
            navigator.health.isAvailable(
            function () {
                console.log("success use!");
            }, function () {
                console.log("not use!");
            }
            );

            // GoogleFit/HealthCareのインストール確認
            var isGfitOpen = localStorage.getItem("isGfitOpen");
            if (null == isGfitOpen || 0 == isGfitOpen) {
                //GoogleFit/HelthCareのインストールを促す
                if (monaca.isAndroid) {
                alert('本アプリはGoogleFitアプリとの連携を行います。GoogleFitアプリをインストールの上、GoogleFitの初期設定を行なってください。本アプリではカロリーの計算等にGoogleFitに登録されている身長・体重データを取り扱います。未登録の場合、正確な値が計算されないことがあります。');
                navigator.health.promptInstallFit(
                    function () {
                    localStorage.setItem("isGfitOpen", "1");
                    console.log("success Installed!!");
                    }, function () {
                    console.log("no Installed");
                    navigator.app.exitApp();
                    return false;
                    });

                } else if (monaca.isIOS) {
                localStorage.setItem("isGfitOpen", "1");
                alert('本アプリはヘルスケアとの連携を行います。ヘルスケアアプリの初期設定を行なってください。本アプリではカロリーの計算等にヘルスケアに登録されている身長・体重データを取り扱います。未登録の場合、正確な値が計算されないことがあります。');
                }
            }

            //20231214 高齢者用先行アップデート対応のため、ヘルスケア・Fit連携を一時解除 end

            //プッシュ通知を受け取るための許可を確認
            window.FirebasePlugin.grantPermission(function (data) {
                console.log('index.html -- grantPermission : success');
                window.FirebasePlugin.hasPermission(function (data) {
                    console.log('index.html -- asPermission : ' + data.isEnabled);
                    var _token = localStorage.getItem("FCMtoken");
                    if (_token == null || _token == 'null') {
                        //デバイストークン（ID）を取得
                        window.FirebasePlugin.getToken(function (token) {
                            console.log('index.html -- token success: ' + token);
                            localStorage.setItem("FCMtoken", token);
                        }, function (error) {
                            console.log('index.html -- token error: ' + error);
                        });
                        //トークンリフレッシュ時
                        window.FirebasePlugin.onTokenRefresh(function (token) {
                            console.log('index.html -- tokenRefresh : ' + token);
                            localStorage.setItem("FCMtoken", token);
                        }, function (error) {
                            console.log('index.html -- tokenRefresh : ' + error);
                        });
                    }
                });
            });

            //プッシュ通知を受け取るための許可を確認
            window.FirebasePlugin.grantPermission();
            window.FirebasePlugin.hasPermission(function(data){
                console.log('hindex.html -- asPermission : '+data.isEnabled);
            });
            var _token = localStorage.getItem("FCMtoken");
            if(_token == null || _token == 'null'){
                //デバイストークン（ID）を取得
                window.FirebasePlugin.getToken(function(token) {
                console.log('index.html -- token success: '+token);
                localStorage.setItem("FCMtoken",token);
                },function(error) {
                console.log('index.html -- token error: '+error);
                });
                //トークンリフレッシュ時
                window.FirebasePlugin.onTokenRefresh(function(token) {
                console.log('index.html -- tokenRefresh : '+token);
                localStorage.setItem("FCMtoken",token);
                }, function(error) {
                console.log('index.html -- tokenRefresh : '+error);
                });
            }

            //チュートリアル画面へ遷移する
            var isOpen = localStorage.getItem("isOpen");
            console.log('isOpen:' + isOpen);
            if (null == isOpen || 0 == isOpen) {
                location.href = "#/tab/tutorial/";
            } else {
                //高齢者フラグ
                if(localStorage.getItem('oldPerson') == 1){
                    console.log(localStorage.getItem('oldPerson'));
                    $scope.over60 = true;
                }else{
                    $scope.over60 = false;
                }
                //ホームへ遷移する
                location.href = "#/tab/top/";
            }
            //初回起動終了フラグをオンにする。
            localStorage.setItem("isOpen", "1");

        }

        //画面描写完了前に実行
        $scope.$on('$ionicView.beforeEnter', function () {

            //moment.jsの初期化(言語を日本語に)
            moment.locale('ja', {
                weekdays: ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"],
                weekdaysShort: ["日", "月", "火", "水", "木", "金", "土"],
            });

            //開発者メニューを表示するか
            var devModeFlg = localStorage.getItem('devModeFlg');
            if (devModeFlg == '1') {
                $scope.devMode = true;
            } else {
                $scope.devMode = false;
            }
            //検証モードの場合、色を黒くする
            var verificationFlg = localStorage.getItem('verificationFlg');
            console.log(verificationFlg);
            if (verificationFlg == '1') {
                $(".navilbar-background").css('background-color', 'rgb(0 0 0)');
            }

        });

        ///メニュー表示/非表示
        $(document).click(function (event) {
            state = $('#menulist').css('display');
            if (event.target.id == 'menubutton') {
                $('#menulist').toggleClass('active');
                if ($('#menulist').hasClass('active')) {
                    $('#menulist').addClass('active');
                } else {
                    $('#menulist').removeClass('active');
                }
            } else {
                $('#menulist').removeClass('active');
            }
        });
        //リリースノートへ遷移
        $scope.releaseNoteMove = function () {
            var url = SERVICE_COMMON.getParameter('url_relese_note');
            SERVICE_COMMON.invokeBrowser(url);
        }

        //ご当地体操へ遷移
        $scope.MoveGym = function () {
            var url = SERVICE_COMMON.getParameter('option_gymnastics_url');
            SERVICE_COMMON.invokeBrowser(url);
        }

        //登録団体一覧へ遷移
        $scope.MoveGroupList = function () {
            var url = SERVICE_COMMON.getParameter('option_grouplist_url');
            SERVICE_COMMON.invokeBrowser(url);
        }

        //クーポン引換券店舗一覧へ遷移
        $scope.MoveShopList = function () {
            var url = SERVICE_COMMON.getParameter('option_shoplist_url');
            SERVICE_COMMON.invokeBrowser(url);
        }

        //自治体HPへ遷移
        $scope.HPmove = function () {
            var url = SERVICE_COMMON.getParameter('option_main_url');
            SERVICE_COMMON.invokeBrowser(url);
        }
        //利用規約へ遷移
        $scope.Kiyakumove = function () {
            var url = SERVICE_COMMON.getParameter('url_kiyaku');
            SERVICE_COMMON.invokeBrowser(url);
        }
        //プライバシーポリシー
        $scope.Policymove = function () {
            var url = SERVICE_COMMON.getParameter('url_policy');
            SERVICE_COMMON.invokeBrowser(url);
        }
        //メニューへ移動
        $scope.MoveMenu = function (page) {
            location.href = page;
        }
    })

    //タブ用コントローラ
    .controller('TabsCtrl', function ($scope, $state, SERVICE_COMMON, SHARE_SCOPE) {
        $scope.$on('$ionicView.enter', function () {

        });

        //タブ遷移
        $scope.Tabmove = function (page) {
            SERVICE_COMMON.MovePage(page);
        };

        $.fn.addClass_org = $.fn.addClass; // addClassイベントを保存

        //TabsCtrlを共有
        SHARE_SCOPE.setScope('TabsCtrl', $scope);

        $.fn.addClass_org = $.fn.addClass; // addClassイベントを保存

    })
    //よくある質問
    .controller('AbtAppCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, SERVICE_COMMON) {
        $scope.$on('$ionicView.enter', function () {
            //よくある質問APIからデータ取得（高齢者用)
            SERVICE_COMMON.loading();
            var url = SERVICE_COMMON.getParameter('api_get_question');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
                .done(function (data, textStatus, jqXHR) {
                    console.log(JSON.stringify(data));
                    if (data['result'] == '0') {
                        $scope.questions = data['data'];
                        //ローディング完了
                        SERVICE_COMMON.loading_comp();
                    } else {
                        SERVICE_COMMON.toast('データ取得時にエラーが発生しました。');
                    }
                })

            //よくある質問APIからデータ取得(若者用)
            SERVICE_COMMON.loading();
            var url = SERVICE_COMMON.getParameter('api_get_question_young');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
                .done(function (data, textStatus, jqXHR) {
                    console.log(JSON.stringify(data));
                    if (data['result'] == '0') {
                        $scope.questions_young = data['data'];
                        //ローディング完了
                        SERVICE_COMMON.loading_comp();
                    } else {
                        SERVICE_COMMON.toast('データ取得時にエラーが発生しました。');
                    }
                })
        });

        
        //ブラウザを立ち上げる
        $scope.InvokeBrowser = function (url) {
            SERVICE_COMMON.invokeBrowser(url);
        }
    })
    //機種変更
    .controller('ModelChangeCtrl', function ($scope, $timeout, $ionicLoading, $ionicPopup, SERVICE_COMMON) {
        $scope.$on('$ionicView.enter', function () {
            //アプリ名
            $scope.appName = SERVICE_COMMON.getParameter('option_app_name');

            //年の作成
            var years = [];
            for (var i = 1930; i <= moment().year(); i++) {
                years.push(i);
            }
            $scope.ddl_birthY = years;

            //月の作成
            var months = [];
            for (var m = 1; m <= 12; m++) {
                months.push(m);
            }
            $scope.ddl_birthM = months;

            //日の作成
            //60年前
            var y = moment().subtract(60, 'years').year();
            $scope.createDays(y, 1);

            $timeout(function () {
                $scope.$apply(function () {
                    $("#birth_y").val(y);
                    $("#birth_m").val(1);
                    $("#birth_d").val(1);
                });
            }, 300);

        });

        //年月に応じた日のドロップダウン生成
        $scope.createDays = function (y, m) {
            var days = [];
            var lastDay = moment(`${y}/${m}/01`).daysInMonth();
            for (i = 1; i <= lastDay; i++) {
                days.push(i);
            }
            $scope.ddl_birthD = days;
            $timeout(function () {
                $scope.$apply(function () {
                    $("#birth_d").val(1);
                });
            }, 300);
        }
        //年月変更処理
        $scope.setDate = function () {
            var y = $("#birth_y").val();
            var m = $("#birth_m").val();
            $scope.createDays(y, m);
        }
        //引継ぎ処理
        $scope.modelChange = function () {

            //必須チェック
            if ($('#name').val() == "") {
                SERVICE_COMMON.popup('氏名を入力してください');
                return false;
            }

            if ($('#nameKana').val() == "") {
                SERVICE_COMMON.popup('氏名かなを入力してください');
                return false;
            }

            var name = $('#name').val();
            var nameKana = $('#nameKana').val();
            var y = $("#birth_y").val();
            var m = $("#birth_m").val();
            var d = $("#birth_d").val();
            var birth = moment(`${y}/${m}/${d}`).format('YYYY/MM/DD');

            var os = "";
            if (monaca.isAndroid) {
                os = '1';
            } else if (monaca.isIOS) {
                os = '2';
            } else {
                os = '3';
            }

            var device_info = JSON.stringify(device);

            var postData = { "name": name, "name_kana": nameKana, "birth": birth, "os": os, "device_info": device_info, "fcm_token": localStorage.getItem("FCMtoken") };
            var url = SERVICE_COMMON.getParameter('api_get_model_change');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        //メッセージ
                        SERVICE_COMMON.popup(data['msg']);
                        //ローカルストレージに保存
                        localStorage.setItem('Personal', JSON.stringify(data['data']));
                        var personal = data['data'];

                        //すべてのお知らせに既読をつける
                        var url = SERVICE_COMMON.getParameter('api_get_news');
                        $.ajax(SERVICE_COMMON.getAjaxOption(url, personal))
                            .done(function (data, textStatus, jqXHR) {
                                SERVICE_COMMON.loading_comp();
                                if (data['result'] == '0') {
                                    //activity_id取得
                                    var kidokuNews = Enumerable.from(data['data']['news']).where(x => x.kbn == 'town').select(x => parseInt(x.activity_id)).distinct().toArray();
                                    var kidokuNews_town = Enumerable.from(data['data']['news']).where(x => x.kbn == 'group').select(x => parseInt(x.activity_id)).distinct().toArray();
                                    var kidokuActivity = Enumerable.from(data['data']['group']).select(x => parseInt(x.activity_id)).distinct().toArray();
                                    //ローカルストレージに渡す
                                    var kidoku_activity_all = kidokuNews_town.concat(kidokuActivity);

                                    localStorage.setItem('kidokuNews', JSON.stringify(kidokuNews));
                                    localStorage.setItem('kidokuActivity', JSON.stringify(kidoku_activity_all));
                                } else {
                                    SERVICE_COMMON.toast(data['msg']);
                                }
                            })

                        //本人確認ページへ遷移
                        SERVICE_COMMON.MovePage('#/tab/personal/');

                    } else if (data['result'] == '9') {
                        SERVICE_COMMON.popup(data['msg']);
                    }
                })
        }
    })

      //チュートリアル画面
  .controller('TutorialCtrl', function ($scope, SERVICE_COMMON, $sce) {
    $scope.$on('$ionicView.enter', function () {
      var kiyakuAgree = localStorage.getItem("KiyakuAgree");
      //規約に同意済みか
      if(kiyakuAgree == '0'){
        //スライド表示
        $scope.NextSlide(0);
      }else{
        //スライド表示
        $scope.NextSlide(1);
      }

      //urlがエラーになるためホワイトリストに追加（$scope.kiyaku,$scope.tutorial1,$scope.tutorial2）
        $scope.trustSrc = function () {
            return $sce.trustAsResourceUrl(`${SERVICE_COMMON.getParameter('url_kiyaku')}?d=${SERVICE_COMMON.getYtoS()}`);
        }
      
      //規約の表示
    //   $scope.kiyaku = `${SERVICE_COMMON.getParameter('url_kiyaku')}?d=${SERVICE_COMMON.getYtoS()}`;
      $scope.kiyaku = $sce.trustAsResourceUrl(`${SERVICE_COMMON.getParameter('url_kiyaku')}?d=${SERVICE_COMMON.getYtoS()}`);
      $scope.tutorial1 = $sce.trustAsResourceUrl(`${SERVICE_COMMON.getParameter('url_tutorial1')}?d=${SERVICE_COMMON.getYtoS()}`);
      $scope.tutorial2 = $sce.trustAsResourceUrl(`${SERVICE_COMMON.getParameter('url_tutorial2')}?d=${SERVICE_COMMON.getYtoS()}`);

        //年の作成
        var years = [];
        for (var i = 1930; i <= moment().year(); i++) {
            years.push(i);
        }
        $scope.ddl_birthY = years;

        //月の作成
        var months = [];
        for (var m = 1; m <= 12; m++) {
            months.push(m);
        }
        $scope.ddl_birthM = months;

        //日の作成
        //60年前
        var y = moment().subtract(60, 'years').year();
        $scope.createDays(y, 1);

    });

    //年月に応じた日のドロップダウン生成
    $scope.createDays = function (y, m) {
        var days = [];
        var lastDay = moment(`${y}/${m}/01`).daysInMonth();
        for (i = 1; i <= lastDay; i++) {
            days.push(i);
        }
        $scope.ddl_birthD = days;
        $timeout(function () {
            $scope.$apply(function () {
                $("#birth_d").val(1);
            });
        }, 300);
    }
    //年月変更処理
    $scope.setDate = function () {
        var y = $("#birth_y").val();
        var m = $("#birth_m").val();
        $scope.createDays(y, m);
    }

    //前のスライドへ
    $scope.PrevSlide = function (index) {
      $($('.slider-page')[index]).addClass('active');
      $($('.slider-page')[index + 1]).removeClass('active');
    }
    //次のスライドへ
    $scope.NextSlide = function (index) {
      if(index == 0){
        //規約同意
        localStorage.setItem("KiyakuAgree","1");
      }
      $($('.slider-page')[index - 1]).removeClass('active');
      $($('.slider-page')[index]).addClass('active');
      //スクロールナビを表示（新規・機種変のページは表示しない）
      if(index < 3){
        SERVICE_COMMON.pointerNavi('up' , $($('.slider-page')[index]),{"bottom":50 , "right":30});
      }
      
    }
    //同意しない
    $scope.Disagree = function () {
      //アプリを終了
      SERVICE_COMMON.toast('アプリを終了します');
      navigator.app.exitApp();
    }
    //新規
    $scope.NewAccount = function () {

        //生年月日を取得
        var year = $('#birth_y option:selected').val();
        var month = $('#birth_m option:selected').val();
        var day = $('#birth_d option:selected').val();

        console.log(year);
        if(year == '? undefined:undefined ?'){
            SERVICE_COMMON.toast('年を入力してください。');
            return false;
        }
        if(month == '? undefined:undefined ?'){
            SERVICE_COMMON.toast('月を入力してください。');
            return false;
        }
        if(day == '? undefined:undefined ?'){
            SERVICE_COMMON.toast('日を入力してください。');
            return false;
        }


        //60歳以上であればmovepage
        var birth = moment(`${year}/${month}/${day}`);
        var now = moment();
        var age = now.diff(birth, 'years');

        //60歳以上なら団体認証、若者は個人設定
        if(age >= 60){
            //高齢者フラグをオン
            localStorage.setItem('oldPerson', 1);
            localStorage.setItem('youngPerson', 0);
            localStorage.setItem('Personal', null);
            localStorage.setItem('GroupCertification', 0);
            // localStorage.setItem('Tutorial', 1);

            //団体認証へ
            SERVICE_COMMON.MovePage("#/tab/personal/");
        }else{
            //若者フラグをオン
            localStorage.setItem('youngPerson', 1);
            localStorage.setItem('oldPerson', 0);
            localStorage.setItem('Personal', null);
            localStorage.setItem('GroupCertification', 0);
            // localStorage.setItem('Tutorial', 1);

            //個人設定画面へ
            SERVICE_COMMON.MovePage("#/tab/personal/");
        }
    }



    //引継ぎ画面表示
    $scope.PopModelChange = function () {

        //生年月日を取得
        var year = $('#birth_y').val();
        var month = $('#birth_m').val();
        var day = $('#birth_d').val();

        if(year == ""){
            SERVICE_COMMON.toast('年を入力してください。');
            return false;
        }
        if(month == ""){
            SERVICE_COMMON.toast('月を入力してください。');
            return false;
        }
        if(day == ""){
            SERVICE_COMMON.toast('日を入力してください。');
            return false;
        }


        //60歳以上であればmovepage
        var birth = moment(`${year}/${month}/${day}`);
        var now = moment();
        var age = now.diff(birth, 'years');

        //60歳以上なら団体認証、若者は個人設定
        if(age >= 60){
            //高齢者フラグをオン
            localStorage.setItem('oldPerson', 1);
            localStorage.setItem('youngPerson', 0);
            localStorage.setItem('Tutorial', 1);
            //団体認証へ

            //あいあいポイント事業に参加しているか確認
            var a = function () {
                localStorage.setItem('GroupCertification', 1)
                SERVICE_COMMON.MovePage("#/tab/group/");
            }
            var b = function (){
                //ユーザIDとパスワードを要求
                $('#pop-model-change-frame').show();
            }
            //警告メッセージ作成
            var msg = `あいあいポイント事業に参加している場合の引継ぎは「はい」、参加していない場合は「いいえ」をタップしてください。`;
            SERVICE_COMMON.popupGroupHikitsugi(msg, a, b);
        
        }else{
            //若者フラグをオン
            localStorage.setItem('youngPerson', 1);
            localStorage.setItem('oldPerson', 0);
            localStorage.setItem('Tutorial', 1);
            //ユーザIDとパスワードを要求
            $('#pop-model-change-frame').show();
        }        
    }
    //ポップアップをとじる
    $scope.PopClose = function () {
      $('#pop-model-change-frame').hide();
    }
    //引継ぎ
    $scope.ModelChange = function () {
      //ユーザIDとパスワードを要求
      var user_id = $('#user_id').val();
      var password = $('#password').val();
      //入力チェック
      if (user_id == "") {
        SERVICE_COMMON.toast('ユーザIDを入力してください');
        return false;
      }
      if (password == "") {
        SERVICE_COMMON.toast('暗証番号を入力してください');
        return false;
      }
      //機種変用データ取得
      var post_data = {};
      post_data['user_id'] = user_id;
      post_data['password'] = password;
      var url = SERVICE_COMMON.getParameter('api_get_model_change_young');
      $.ajax(SERVICE_COMMON.getAjaxOption(url, post_data))
        .done(function (data, textStatus, jqXHR) {
          if (data['result'] == '0') {
            var storage = JSON.parse(data['data'][0]['storage']);
            var _FCMtoken = localStorage.getItem("FCMtoken");
            for (var key in storage) {
              console.log(`${key}`);
              if(key != 'Parameter'){
                localStorage.setItem(key,storage[key]);
              }
            }

            //FCMのトークンは変更されるため個人設定を再登録
            
            var personal = JSON.parse(localStorage.getItem('Personal'));
            personal['token'] = _FCMtoken;          
            console.log(JSON.stringify(personal));
            var url = SERVICE_COMMON.getParameter('api_reg_user');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, personal))
              .done(function (data, textStatus, jqXHR) {
                console.log(JSON.stringify(data));
                if (data['result'] == '0') {
                  //ホームへ戻る
                  SERVICE_COMMON.toast('引継ぎが完了しました。');
                  SERVICE_COMMON.MovePage("#/tab/personal/");
                }
              })
              .fail(function (jqXHR, textStatus, errorThrown) {
                console.log(JSON.stringify(jqXHR));
              });

          } else {
            SERVICE_COMMON.toast('引継ぎデータが見つかりませんでした。ユーザID・パスワードが正しいことを確認してください');
          }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.log(JSON.stringify(jqXHR));
        });
    }
    

  })