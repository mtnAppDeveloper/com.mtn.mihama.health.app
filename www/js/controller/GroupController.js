angular.module('starter.GroupControllers', [])
    //グラフ画面処理
    .controller('GroupCtrl', function ($scope, $ionicLoading, $ionicPopup, $timeout, $ionicSlideBoxDelegate, SHARE_DATA, SERVICE_COMMON, SHARE_SCOPE) {
        $scope.$on('$ionicView.enter', function () {
            //アプリ名
            $scope.appName = SERVICE_COMMON.getParameter('option_app_name');
            $scope.groupJoinInfo = SERVICE_COMMON.getParameter('option_group_join_info');
            $scope.$apply();

            $scope.oldPerson = true;
        });

        //スキャナー起動フラグ（2度押し防止）
        $scope.scannerLounching = false;
        //カメラを起動しQRを読み取る
        $scope.scanQR = function () {
            if (!$scope.scannerLounching) {
                $scope.scannerLounching = true;
                //QRから読み取ったグループ情報の確認
                cordova.plugins.barcodeScanner.scan(
                    function (data) {
                        $scope.scannerLounching = false;
                        //console.log(data.text);
                        var qrData = JSON.parse(data.text);
                        var personal = JSON.parse(localStorage.getItem('Personal'));
                        var user_id = null;
                        if (SERVICE_COMMON.isset(personal)) {
                            user_id = personal.user_id;
                        }
                        //生成したJsonをデータベースへ登録
                        var postData = { "user_id": user_id, "group_id": qrData['group_id'], "group_token": qrData['group_token'], "name": qrData['name'], "owner": qrData['owner'] };
                        var url = SERVICE_COMMON.getParameter('api_get_group');
                        $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                            .done(function (data, textStatus, jqXHR) {
                                if (data['result'] == '0') {
                                    //console.log(JSON.stringify(data));
                                    //メッセージ
                                    SERVICE_COMMON.toast(data['msg']);
                                    console.log(JSON.stringify(data));
                                    //本人確認ページへ遷移
                                    SERVICE_COMMON.MovePage('#/tab/group/cert/');
                                    SHARE_DATA.setData('GroupData', data);
                                } else if (data['result'] == '9') {
                                    SERVICE_COMMON.popup(data['msg']);
                                }
                            })
                            .fail(function (jqXHR, textStatus, errorThrown) {
                                console.log(JSON.stringify(jqXHR));
                            });
                    },
                    function (error) {
                        $scope.scannerLounching = false;
                        alert("読み取りに失敗しました: " + error);
                    },
                    SERVICE_COMMON.BarcodeScanSetting('QRコードをスキャンしてください')
                );
            } else {
                console.log('Scanner is runing');
            }
        }
        //機種変更へ
        $scope.modelChange = function () {
            SERVICE_COMMON.MovePage('#/tab/group/model_change/');
        }
        //チュートリアルへ
        $scope.tutorial = function(){
            SERVICE_COMMON.MovePage('#/tab/tutorial/');
        }

    })
    .controller('GroupCertCtrl', function ($scope, $ionicLoading, $ionicPopup, $timeout, SHARE_DATA, $ionicSlideBoxDelegate, SERVICE_COMMON, SHARE_SCOPE) {
        $scope.$on('$ionicView.enter', function () {
            //アプリ名
            $scope.appName = SERVICE_COMMON.getParameter('option_app_name');

            var datas = [];

            //QRコードで読み込んだ団体情報取得
            if(SERVICE_COMMON.isset(SHARE_DATA.getData('GroupData'))){
                datas = SHARE_DATA.getData('GroupData');
                $scope.group = datas['data'];
            }
            //高齢・若者判定
            if(localStorage.getItem('oldPerson') == 1 && localStorage.getItem('GroupCertification') == 1){
                $scope.over60 = true;
            }
            else{
                $scope.over60 = false;
            }

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
                    //2つ目以降の団体参加である場合、ユーザ情報はすでにローカルストレージに保存されているのでそれを表示
                    // var personal = JSON.parse(localStorage.getItem('Personal'));
                    // if (SERVICE_COMMON.isset(personal)) {
                    //     $('#name').val(personal.name);
                    //     $('#nameKana').val(personal.name_kana);
                    //     var birth = personal['birth'].split('/');
                    //     $("#birth_y").val(birth[0]);
                    //     $("#birth_m").val(birth[1].replace(/^0+/, ''));
                    //     $("#birth_d").val(birth[2].replace(/^0+/, ''));
                    //     $("#name").attr("disabled", true);
                    //     $("#nameKana").attr("disabled", true);
                    //     $("#birth_y").attr("disabled", true);
                    //     $("#birth_m").attr("disabled", true);
                    //     $("#birth_d").attr("disabled", true);
                    // }
                });
            }, 300);

        });

        //引継ぎ処理(高齢)
        $scope.modelChange_old = function () {

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

                                    localStorage.setItem('oldPerson' , 1);
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

        //認証
        $scope.certUser = function () {

            //必須チェック
            if ($('#name_cert').val() == "") {
                SERVICE_COMMON.popup('氏名を入力してください');
                return false;
            }

            if ($('#nameKana_cert').val() == "") {
                SERVICE_COMMON.popup('氏名かなを入力してください');
                return false;
            }

            var datas = SHARE_DATA.getData('GroupData');
            console.log(JSON.stringify(datas));
            var group = datas['data'];
            var group_id = group.group_id;
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

            var postData = { "group_id": group_id, "name": name, "name_kana": nameKana, "birth": birth, "os": os, "device_info":device_info, "fcm_token": localStorage.getItem("FCMtoken") };
            var url = SERVICE_COMMON.getParameter('api_get_user_check');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, postData))
                .done(function (data, textStatus, jqXHR) {
                    if (data['result'] == '0') {
                        //メッセージ
                        SERVICE_COMMON.popup(data['msg']);
                        //本人確認ページへ遷移
                        SERVICE_COMMON.MovePage('#/tab/personal/');
                        //ローカルストレージに保存
                        localStorage.setItem('GroupCertification', 1);
                        localStorage.setItem('oldPerson', 1);
                        localStorage.setItem('Tutorial', 1);
                        localStorage.setItem('Personal', JSON.stringify(data['data']));
                    } else if (data['result'] == '9') {
                        SERVICE_COMMON.popup(data['msg']);
                    }
                })
        }

    //機種変更実行
    $scope.ModelChange = function () {
      //入力チェック
      var password = $('#password_reg').val();
      if (password == "") {
        SERVICE_COMMON.toast('暗証番号は必ず入力してください');
        return false;
      }
      console.log(password.length);
      if (password.length == 3) {
        SERVICE_COMMON.toast('暗証番号は4ケタにしてください');
        return false;
      }
      //集約用配列
      var data = new Object;
      //個人設定を取得
      var personal = JSON.parse(localStorage.getItem('Personal'));
      if (SERVICE_COMMON.isset(personal)) {
        var user_id = personal['user_id'];
        data['Personal'] = personal;
      } else {
        SERVICE_COMMON.toast('個人設定が登録されていません');
        return false;
      }
      var storage = localStorage;
      for (var key in storage) {
              console.log(`${key}`);
              //localStorage.setItem(key,JSON.stringify(storage[key]));
              //Parameterは長いので格納しない
              if(key != 'Parameter'){
                data[key] = storage[key];
              }
      }

      var post_data = new Object;
      post_data['user_id'] = user_id;
      post_data['password'] = password;
      post_data['storage'] = data;
      console.log(JSON.stringify(post_data));

      //機種変用データ登録
      var url = SERVICE_COMMON.getParameter('api_reg_model_change_young');
      $.ajax(SERVICE_COMMON.getAjaxOption(url, post_data))
        .done(function (data, textStatus, jqXHR) {
          if (data['result'] == '0') {
            SERVICE_COMMON.popup('機種変更の準備が完了しました。<br>引継ぎ時に以下の情報が必要になります。忘れないようにしてください。<br>ユーザID：' + user_id + '<br>パスワード：' + password);
            //ローカルストレージを削除してしまう。
            //localStorage.clear();
          } else {
            SERVICE_COMMON.toast('機種変更処理に失敗しました。すでに機種変更実施済みでないか確認してください。');
          }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.log(JSON.stringify(jqXHR));
        });
    }
    //引継ぎ
    $scope.Hikitsugi = function(){
      //ユーザIDとパスワードを要求
      var user_id = $('#user_id').val();
      var password = $('#password').val();
      console.log(user_id);
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
      var url = SERVICE_COMMON.getParameter('api_get_model_change');
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
            var url = SERVICE_COMMON.getParameter('api_reg_user');
            $.ajax(SERVICE_COMMON.getAjaxOption(url, personal))
              .done(function (data, textStatus, jqXHR) {
                console.log(JSON.stringify(data));
                if (data['result'] == '0') {
                  //ホームへ戻る
                  SERVICE_COMMON.toast('引継ぎが完了しました。');
                  localStorage.setItem('Tutorial', 1);
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

    });

    