angular.module('starter.PersonalControllers', [])
    .controller('PersonalCtrl', function ($scope, $ionicLoading, $ionicPopup, $timeout, $ionicSlideBoxDelegate, SERVICE_COMMON, SHARE_SCOPE) {
        $scope.$on('$ionicView.enter', function () {

            //チュートリアルを通っている場合のみユーザ登録する
            // if (localStorage.getItem('Tutorial') == 0) {
            //     SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。チュートリアルから登録してください。');
            //     return false;
            // }

            //連携リセット部分の説明
            if (monaca.isAndroid) {
                $scope.RenkeiApp = 'GoogleFit';
            } else {
                $scope.RenkeiApp = 'ヘルスケア';
            }

            //高齢・若者判定(未認証高齢者は若者判定にする)
            if(localStorage.getItem('oldPerson') == 1){
                $scope.over60 = true;
            }
            else{
                $scope.over60 = false;
            }

            //認証済の場合個人情報の変更不可
            if(localStorage.getItem('GroupCertification') == 1){
                $scope.cert = true;
            }
            else{
                $scope.cert = false;
            }

            //年の作成
            var years = [];
            for (var i = 1920; i <= moment().year(); i++) {
                years.push(i);
            }
            //月の作成
            var months = [];
            for (var m = 1; m <= 12; m++) {
                months.push(m);
            }

            //コードマスタから性別・地区・業種を取得しドロップダウンに反映
            var url = SERVICE_COMMON.getParameter('api_get_code_mst');
            SERVICE_COMMON.loading();
            $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        //性別
                        $scope.seis = Enumerable.from(data['data']).where(x => x.kubun == 1000).orderBy(x => parseInt(x.code)).toArray();
                        //血液型
                        $scope.bloods = Enumerable.from(data['data']).where(x => x.kubun == 1010).orderBy(x => parseInt(x.code)).toArray();
                        //生年月日ドロップダウンの作成
                        $scope.ddl_birthY = years;
                        $scope.ddl_birthM = months;
                        //60年前を初期値とする
                        var y = moment().subtract(60, 'years').year();
                        $scope.createDays(y, 1);
                    } else {
                        SERVICE_COMMON.toast(data['msg']);
                    }
                    //ローディング完了＆$scopeの更新
                    $timeout(function () {
                        $scope.$apply(function () {
                            $("#birth_y").val(y);
                            $("#birth_m").val(1);
                            $("#birth_d").val(1);
                            //ローカルストレージの内容を反映
                            $scope.bindPersonal();
                            SERVICE_COMMON.loading_comp();
                        }, 300);
                    });
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    console.log(JSON.stringify(jqXHR));
                    SERVICE_COMMON.loading_comp();
                });

            //20231214 高齢者用先行アップデート対応のため、ヘルスケア・Fit連携を一時解除
            //取得するデータタイプを定義
            var datatypes = [
                {
                read: ['steps', 'height', 'weight'],// Read only permission 歩数、身長、体重
                }
            ];

            //ユーザID付与
            $scope.SettingCheck();

            //Androidの場合、GoogleFitがインストールされているか判定
            if (monaca.isAndroid) {
                //GoogleFitのインストール有無判定
                navigator.health.promptInstallFit(
                function () {
                    console.log("success Installed!!");
                //GoogleSignIn画面を表示する
                $scope.requestGoogleSignIn();
                }, function () {
                    console.log("no Installed");
                    alert('本アプリはGoogleFitアプリとの連携を行います。GoogleFitアプリをインストールの上、GoogleFitの初期設定を行なってください。本アプリではカロリーの計算等にGoogleFitに登録されている身長・体重データを取り扱います。未登録の場合、正確な値が計算されないことがあります。');
                    navigator.app.exitApp();
                    return false;
                });
            } else {
                //ヘルスケアとの連携要求（iOS）
                $scope.requestAuthorization();
            }

        });

        //GoogleSignIn画面を表示
        $scope.requestGoogleSignIn = function () {
            if (monaca.isAndroid) {
                //サインイン画面を表示
                var reqAuth = localStorage.getItem('requestAuthorization');
                if (reqAuth == '0' || reqAuth == null || reqAuth == undefined) {
                    $scope.reqAuthPop = true;
                } else {
                    $scope.reqAuthPop = false;
                }

            } else {
                //iOSはサインイン画面を出さない
                $scope.reqAuthPop = false;
                //連携要求
                $scope.requestAuthorization();
            }
        }
        //GoogleSignIn画面を閉じる
        $scope.closeGoogleSignIn = function () {
            $scope.reqAuthPop = false;
        }

        //GoogleFitのインストール有無（Androidのみ）
        $scope.promptInstallFit = function () {
            //GoogleFitのインストール有無判定
            navigator.health.promptInstallFit(
                function () {
                    console.log("success Installed!!");
                    //GoogleFitとの連携要求
                    $scope.requestAuthorization();
                }, function () {
                    console.log("no Installed");
                    alert('本アプリはGoogleFitアプリとの連携を行います。GoogleFitアプリをインストールの上、GoogleFitの初期設定を行なってください。本アプリではカロリーの計算等にGoogleFitに登録されている身長・体重データを取り扱います。未登録の場合、正確な値が計算されないことがあります。');
                    navigator.app.exitApp();
                    return false;
                });
        }

        //GoogleFit/ヘルスケアとの連携要求
        $scope.requestAuthorization = function () {
            //取得するデータタイプを定義
            var datatypes = SERVICE_COMMON.getHealthParam();
            console.log(JSON.stringify(datatypes));

            //アプリに一連のデータ型を読み書きする権限があるかどうかを確認します。
            navigator.health.isAuthorized(datatypes, function () {
                console.log("success Authority!");
                //requestAuthorizationがfalseの場合リクエスト
                var reqAuth = localStorage.getItem('requestAuthorization');
                if (reqAuth == '0' || reqAuth == null || reqAuth == undefined) {
                    navigator.health.requestAuthorization(datatypes,
                        function () {
                            console.log("success read!");
                            //一度要求が通ればOKなのでrequestAuthorizationはtrueにする
                            localStorage.setItem('requestAuthorization', '1');
                            $scope.reqAuthPop = false;
                            $timeout(function () {
                                $scope.$apply();
                            })
                        }, function (err) {
                            console.log("failed read!" + err);
                            if (monaca.isAndroid) {
                                alert('GoogleFitからの情報取得に失敗しました。GoogleFitの設定が正しく行われているか確認してください。' + JSON.stringify(err));
                            } else {
                                alert('ヘルスケアからの情報取得に失敗しました。ヘルスケアの設定が正しく行われているか確認してください。' + JSON.stringify(err));
                            }
                        });
                }
            }, function (err) {
                //エラーログ出力
                SERVICE_COMMON.regErrorLog(err);
                console.log("no Authority!..." + err);
            });
        }

        //設定を確認
        $scope.SettingCheck = function () {
            //個人設定を取得
            var personal = JSON.parse(localStorage.getItem('Personal'));
            if (SERVICE_COMMON.isset(personal)) {
                if (personal['user_id'] == "") {
                    //ユーザID採番
                    $scope.getUserId();
                } else {
                    //初期化処理
                    $scope.bindPersonal();
                }
            } else {
                //ユーザID採番
                $scope.getUserId();
            }
        }

        //ユーザIDの自動採番+個人設定格納用ローカルストレージの初期化
        $scope.getUserId = function () {
            var url = SERVICE_COMMON.getParameter('api_reg_userid');
            console.log(url);
            $.getJSON(url, function (data) {
                if (data['result'] == "0") {
                    var userid = data['user_id'];
                    console.log(JSON.stringify(data));
                    personal = new Object;
                    personal['user_id'] = userid;
                    personal['token'] = localStorage.getItem("FCMtoken");
                    personal['name'] = '';
                    personal['sei'] = 1;
                    personal['weight'] = 60;
                    personal['height'] = 165;
                    personal['blood'] = '';
                    personal['birth'] = '1962/01/01';
                    personal['post_code'] = '';
                    personal['address'] = '';
                    personal['mail'] = '';
                    personal['tel'] = '';
                    personal['icon'] = './img/thumb-default.png';
                    personal['stamp_manager'] = '';
                    personal['silver_human'] = '';
                    personal['senior_club'] = '';
                    personal['os'] = '';
                    personal['device_info'] = '';
                    localStorage.setItem('Personal', JSON.stringify(personal));
                    console.log('personal reg success');
                    SERVICE_COMMON.toast('ユーザの初期設定が完了しました');
                    //初期化処理
                    $scope.bindPersonal();
                } else {
                    SERVICE_COMMON.toast('ユーザIDの取得に失敗しました');
                }
            });
        }

        //年月に応じた日のドロップダウン生成
        $scope.createDays = function (y, m, d = 1) {
            var days = [];
            var lastDay = moment(`${y}/${m}/01`).daysInMonth();
            for (i = 1; i <= lastDay; i++) {
                days.push(i);
            }
            $scope.ddl_birthD = days;
            $timeout(function () {
                $scope.$apply(function () {
                    $("#birth_d").val(d);
                });
            }, 300);
        }


        //基本情報のローカルストレージの情報を画面に反映
        $scope.bindPersonal = function () {
            //ユーザ登録チェック
            var personal = JSON.parse(localStorage.getItem('Personal'));
            var oldPerson = localStorage.getItem('oldPerson');
            var certification = localStorage.getItem('GroupCertification');
            console.log(JSON.stringify(personal));
            //新規登録（若者と未認証高齢者）は団体認証をスルー
            if (!SERVICE_COMMON.isset(personal) && oldPerson == 1 && certification == 1) {
                SERVICE_COMMON.popupUserRegError('ユーザ情報を取得できません。チュートリアルから登録してください。');
                return false;
            }

            //登録されているなら個人情報表示
            if(SERVICE_COMMON.isset(personal)){
                console.log(JSON.stringify(personal));
                //アイコンの設定
                var YtoS = SERVICE_COMMON.getYtoS();
                var icon = personal.icon + YtoS;
                var cvs = $('#user_icon_canvas');
                var ctx = cvs[0].getContext('2d');
                console.log(icon);
                //画像オブジェクトを生成
                var img = new Image();
                img.src = icon;
                //画像をcanvasに設定
                img.onload = function () {
                    console.log('img  on load');
                    ctx.drawImage(img, 0, 0, 120, 120);
                }
                //プッシュ通知の受取可否を設定
                if (personal['ispush'] == '1') {
                    $scope.enablePush = { checked: true };
                } else {
                    $scope.enablePush = { checked: false };
                }
                //生年月日入力
                var def_birth = '1962/01/01'
                // console.log(personal['birth']);
                // birth = personal['birth'];
                if(personal['birth'] == [""] || personal['birth'] == null){
                    birth = def_birth.split('/');
                }else{
                    birth = personal['birth'].split('/');
                }

                console.log(JSON.stringify(birth));
                $scope.personal = personal;
                $scope.personal.birth_y = birth[0];
                $scope.personal.birth_m = birth[1].replace(/^0+/, '');
                $scope.personal.birth_d = birth[2].replace(/^0+/, '');
                $scope.createDays(birth[0], birth[1].replace(/^0+/, ''), birth[2].replace(/^0+/, ''));
                }

        }

        //サポータ企業コード入力ボタン
        $scope.codeInput = function () {
            var invite = $('#invite').val();
            if(invite == ""){
                SERVICE_COMMON.toast('サポータ企業コードを入力してください。');
                return false;
            }
            //月によって背景画像とへしこちゃんの画像を差し替える
            var url = SERVICE_COMMON.getParameter('api_get_code_mst');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, null))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        //コードマスタ区分1160(サポータ企業コード)を抽出
                        var codedata = Enumerable.from(data['data']).where(x => x.kubun == 1160).toArray();
                        var company_code = [];
                        for (var i = 0; i < codedata.length; i++) {
                            company_code.push(codedata[i].kanren1);
                        }
                        //サポータ企業コードが一致するか判定
                        if (company_code.indexOf(invite) == -1) {
                            SERVICE_COMMON.toast('入力されたサポータ企業コードは存在しません。');
                            return false;
                        } else {
                            //サポータ企業コードをローカルストレージに保存
                            localStorage.setItem('invite', invite);
                            $scope.regUser();
                        }

                    } else {
                        SERVICE_COMMON.toast(data['msg']);
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    //エラーログ出力
                    SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
                    console.log(JSON.stringify(jqXHR));
                    SERVICE_COMMON.loading_comp();
                });
        }

        //登録ボタン押下時
        $scope.regUser = function () {
            console.log(JSON.stringify($scope.personal));

            //入力チェック-利用者情報
            var user_id = $scope.personal.user_id;
            var book_no = $('#book_no').val();
            var name = $('#name').val();
            var name_kana = $('#name_kana').val();
            var sei = $('#sei').val();
            var blood = $('#blood').val();
            var address = $('#address').val();
            var tel = $('#tel').val();
            var height = $('#height').val();
            var weight = $('#weight').val();
            var birth_y = $scope.personal.birth_y;
            var birth_m = $scope.personal.birth_m;
            var birth_d = $scope.personal.birth_d;

            console.log($scope.personal.birth_y);
            console.log($scope.personal.birth_m);
            console.log($scope.personal.birth_d);
            console.log(sei);
            console.log(blood);

            if (user_id == ""){
                SERVICE_COMMON.toast('ユーザ登録に失敗しました。アプリを再起動してください。');
                return false;
            }
            if (name == "") {
                SERVICE_COMMON.toast('氏名は必ず入力してください。');
                return false;
            }
            if (name_kana == "") {
                SERVICE_COMMON.toast('氏名(かな)必ず入力してください。');
                return false;
            }
            if (sei == "" || sei == 0 || sei == "? string:0 ?") {
                SERVICE_COMMON.toast('性別は必ず入力してください。');
                return false;
            }
            // if (blood == "" || blood == "? string:0 ?") {
            //     SERVICE_COMMON.toast('血液型は必ず入力してください。');
            //     return false;
            // }
            if (address == "") {
                SERVICE_COMMON.toast('住所は必ず入力してください。');
                return false;
            }
            //住所に「美浜」の文字が入っていない場合エラーとする
            if (address.indexOf('美浜') == -1 && localStorage.getItem('invite') == 'null') {
                SERVICE_COMMON.toast('美浜町外の住所は登録できません。サポータ企業の方は画面下部のコード入力欄から登録してください。');
                return false;
            }
            console.log(address.indexOf('美浜'));
            console.log(localStorage.getItem('invite'));
            if (tel == "") {
                SERVICE_COMMON.toast('連絡先(電話番号)は必ず入力してください。');
                return false;
            }
            if (height == "") {
                SERVICE_COMMON.toast('身長は必ず入力してください。');
                return false;
            }
            if (weight == "") {
                SERVICE_COMMON.toast('体重は必ず入力してください。');
                return false;
            }
            if (birth_y == "") {
                SERVICE_COMMON.toast('生年月（年）は必ず入力してください');
                return false;
            }
            if (birth_m == "") {
                SERVICE_COMMON.toast('生年月（月）は必ず入力してください');
                return false;
            }
            if (birth_d == "") {
                SERVICE_COMMON.toast('生年月（日）は必ず入力してください');
                return false;
            }

            //プッシュ情報の保存
            var enable_push = $scope.enablePush.checked;
            var push = 0;
            console.log(enable_push);
            if (enable_push) {
                push = 1;
            } else {
                push = 0;
            }
            //FCMトークンを取得
            $scope.personal.fcm_token = localStorage.getItem("FCMtoken");
            $scope.personal.ispush = push;
            $scope.personal.user_id = user_id;
            $scope.personal.book_no = book_no;
            $scope.personal.name = name;
            $scope.personal.name_kana = name_kana;
            $scope.personal.sei = sei;
            $scope.personal.birth = moment(`${birth_y}/${birth_m}/${birth_d}`).format('YYYY/MM/DD');
            $scope.personal.blood = blood;
            $scope.personal.address = address;
            $scope.personal.tel = tel;
            $scope.personal.height = height;
            $scope.personal.weight = weight;
            $scope.personal.device_info = JSON.stringify(device);
            $scope.personal.certification = localStorage.getItem("GroupCertification");
            $scope.personal.support = localStorage.getItem('invite');
            //os判定
            if (monaca.isAndroid) {
                $scope.personal.os = '1';
            } else if (monaca.isIOS) {
                $scope.personal.os = '2';
            } else {
                $scope.personal.os = '3';
            }

            // console.log(JSON.stringify($scope.personal));
            // var personal = JSON.parse(localStorage.getItem('Personal'));
            // if (SERVICE_COMMON.isset(personal)) {
            //     personal['user_id'] = $scope.personal.user_id;
            //     personal['token'] = localStorage.getItem("FCMtoken");
            //     personal['push'] = push;
            //     personal['name'] = name;
            //     personal['sei'] = sei;
            //     personal['birth'] = moment(`${$scope.personal.birth_y}/${$scope.personal.birth_m}/${$scope.personal.birth_d}`).format('YYYY/MM/DD');
            //     personal['blood'] = blood;
            //     personal['address'] = address;
            //     personal['tel'] = tel;
            //     if (monaca.isAndroid) {
            //         personal['os'] = '1';
            //     } else if (monaca.isIOS) {
            //         personal['os'] = '2';
            //     } else {
            //         personal['os'] = '3';
            //     }
            //     personal['device_info'] = device;
            // } else {
            //     SERVICE_COMMON.toast('登録が失敗しました');
            //     return false;
            // }
            //
            //【高齢者】団体認証済
            if(localStorage.getItem('GroupCertification') == 1){
                var url = SERVICE_COMMON.getParameter('api_reg_user');
                $.ajax(SERVICE_COMMON.getAjaxOption(url, $scope.personal))
                    .done(function (data, textStatus, jqXHR) {
                        console.log(JSON.stringify(data));
                        if (data['result'] == '0') {
                            SERVICE_COMMON.toast('登録が完了しました');
                            //ローカルストレージに保存
                            localStorage.setItem('Personal', JSON.stringify($scope.personal));
                            localStorage.setItem('Tutorial', 1);
                            // 3秒後にトップへ
                            $timeout(function () {
                                SERVICE_COMMON.MovePage('#/tab/top');
                            }, 3500);
                        } else {
                            SERVICE_COMMON.toast('登録時にエラーが発生しました。');
                        }
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        //エラーログ出力
                        SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
                        console.log(JSON.stringify(jqXHR));
                    });
            }//【若者】団体認証なし、チュートリアルの有無関係なし
            else if(localStorage.getItem('GroupCertification') == 0 && localStorage.getItem('youngPerson') == 1){
                var url = SERVICE_COMMON.getParameter('api_reg_user_young');
                $.ajax(SERVICE_COMMON.getAjaxOption(url, $scope.personal))
                    .done(function (data, textStatus, jqXHR) {
                        console.log(JSON.stringify(data));
                        if (data['result'] == '0') {
                            SERVICE_COMMON.toast('登録が完了しました');
                            //ローカルストレージに保存
                            localStorage.setItem('Personal', JSON.stringify($scope.personal));
                            localStorage.setItem('Tutorial', 1);
                            // 3秒後にトップへ
                            $timeout(function () {
                                SERVICE_COMMON.MovePage('#/tab/top');
                            }, 3500);
                        } else {
                            SERVICE_COMMON.toast('登録時にエラーが発生しました。');
                        }
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        //エラーログ出力
                        SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
                        console.log(JSON.stringify(jqXHR));
                    });
            }//【高齢者】個人団体に強制入団、ユーザ登録
            else{
                var url = SERVICE_COMMON.getParameter('api_reg_old_user');
                $.ajax(SERVICE_COMMON.getAjaxOption(url, $scope.personal))
                    .done(function (data, textStatus, jqXHR) {
                        console.log(JSON.stringify(data));
                        if (data['result'] == '0') {
                            SERVICE_COMMON.toast('登録が完了しました。アプリを再起動してください。');
                            //ローカルストレージに保存
                            localStorage.setItem('Personal', JSON.stringify($scope.personal));
                            localStorage.setItem('Tutorial', 1);
                            localStorage.setItem('GroupCertification', 1)
                            // 3秒後にトップへ
                            $timeout(function () {
                                // SERVICE_COMMON.MovePage('#/tab/top');
                                if(monaca.isAndroid){
                                    navigator.app.exitApp();
                                }
                                else{
                                    SERVICE_COMMON.MovePage('#/tab/top');
                                }
                            }, 3500);
                        } else {
                            SERVICE_COMMON.toast('登録時にエラーが発生しました。');
                        }
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        //エラーログ出力
                        SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
                        console.log(JSON.stringify(jqXHR));
                    });                
            }
        };

        //写真選択
        $scope.selectPhoto = function () {
            //ギャラリーを表示
            navigator.camera.getPicture(
                cameraSuccess,
                onError,
                {
                    quality: 100,  // 写真のクオリティ（0～100）
                    destinationType: Camera.DestinationType.FILE_URI,  // 戻り値のフォーマット
                    sourceType: Camera.PictureSourceType.PHOTOLIBRARY   // ライブラリから選択
                }
            );
        }

        //読み取り成功時
        var cameraSuccess = function (result) {
            //FILE_URIをBlobに変換する
            console.log('read success');
            console.log(result);
            var blob = URItoFileEntry(result);
        }

        // URIからFileEntryに変換する
        function URItoFileEntry(imageURI) {
            console.log('convert');
            console.log(imageURI);
            window.resolveLocalFileSystemURL(imageURI, fileEntryToArrayBuffer, onError);
        }
        // FileEntryからFileオブジェクトを取得し、さらにArrayBufferに変換する
        function fileEntryToArrayBuffer(fileEntry) {
            console.log('convert part2');
            // Fileオブジェクトを取得
            fileEntry.file((file) => {
                // FileReaderを生成
                let reader = new FileReader();
                // ArrayBuffer形式への変換完了時の処理
                reader.onloadend = ArrayBufferToBlob;
                // ArrayBuffer形式に変換
                reader.readAsArrayBuffer(file);
            }, onError);
        }
        // ArrayBufferからBlobに変換する
        function ArrayBufferToBlob(event) {

            let blob = new Blob([event.target.result]);
            console.log(blob);
            //画像を読み込み、トリミングし、canvasに描写
            SERVICE_COMMON.imageShrink(blob, 'user_icon_canvas', 'user_icon_canvas_temp', call);
        }

        //コールバック時の処理(canvasデータをbase64に変換した結果が返ってくる)
        var call = function (base64) {
            var data = {};
            data.base64 = base64;
            data.user_id = $scope.personal.user_id;
            console.log(JSON.stringify(data));
            //アイコンの登録
            var url = SERVICE_COMMON.getParameter('api_reg_user_icon');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, data))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        //画像の保存URL
                        var icon_url = data['data'];
                        personal = JSON.parse(localStorage.getItem('Personal'));
                        if (SERVICE_COMMON.isset(personal)) {
                            personal['icon'] = icon_url;
                            console.log(personal['icon']);
                            localStorage.setItem('Personal', JSON.stringify(personal));
                            SERVICE_COMMON.toast('画像の登録が完了しました。');
                        }
                    } else {
                        SERVICE_COMMON.toast(data['msg']);
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    //エラーログ出力
                    SERVICE_COMMON.regErrorLog(JSON.stringify(jqXHR));
                    SERVICE_COMMON.toast('画像の登録に失敗しました。', true);
                });
        }

        function onError(e) {
            SERVICE_COMMON.toast("画像登録に失敗しました");
            console.log(JSON.stringify(e));
            return false;

        }

        //連携リセット
        $scope.RenkeiReset = function () {
            //requestAuthorizationの値を0に（もう1回連携確認をするように）
            localStorage.setItem('requestAuthorization', '0');
            //取得するデータタイプを定義
            var datatypes = SERVICE_COMMON.getHealthParam();
            //再連携
            navigator.health.requestAuthorization(datatypes,
                function () {
                    console.log("success read!");
                    //一度要求が通ればOKなのでrequestAuthorizationはtrueにする
                    localStorage.setItem('requestAuthorization', '1');
                    //ポップアップ
                    SERVICE_COMMON.popup($scope.RenkeiApp + 'との連携をリセットしました。アプリを再起動してください。');
                }, function (err) {
                    //エラーログ出力
                    SERVICE_COMMON.regErrorLog(err);
                    console.log("failed read!" + err);
                    SERVICE_COMMON.popup($scope.RenkeiApp + 'との連携リセットにエラーが発生しました。<br>アプリを再起動し、再度個人設定画面を開いてください。');
                });

        }

        //ユーザアカウント削除
        $scope.UserReset = function () {
            var myPopup = $ionicPopup.show({
                template: 'アカウント情報を削除します。よろしいですか？',
                title: '',
                subTitle: '',
                scope: $scope,
                buttons: [
                    { text: '閉じる', type: 'btn-color99', },
                    {
                        text: '削除', type: 'btn-color04',
                        onTap: function (e) {
                            SERVICE_COMMON.loading();
                            $timeout(function () {
                                //ローカルストレージをクリア
                                localStorage.clear();
                                $scope.UserResetComp();
                                SERVICE_COMMON.loading_comp();
                            }, 1500)
                        }
                    }
                ]
            });
        }
        $scope.UserResetComp = function () {
            var myPopup2 = $ionicPopup.show({
                template: 'アカウント情報の削除が完了しました。アプリの再起動またはアンインストールを実施してください。',
                title: '',
                subTitle: '',
                scope: $scope,
                buttons: []
            });

        }


    })